"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { portfolioItems, profiles, projectMembers, projectRoles, projects, trialTaskAttempts, trialTasks } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { ROLE_LABELS } from "@/lib/constants";
import { enforceUserRateLimit, isNewAccount } from "@/lib/security";
import { getRequestLocale } from "@/lib/site-server";
import { uuidSchema } from "@/lib/validations";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { isMissingTrialTables } from "@/server/data/trial-tasks";
import { createNotification } from "@/server/services/notifications";

type Result = { error?: string; success?: true };

const createSchema = z.object({
  roleId: uuidSchema,
  title: z.string().trim().min(3, "Give the task a short title.").max(90, "The title is too long."),
  brief: z.string().trim().min(20, "Describe the task in at least 20 characters.").max(1500, "The description is too long."),
  timeLimitMinutes: z.coerce.number().int().min(30, "The time limit is at least 30 minutes.").max(480, "The time limit is at most 8 hours."),
});

const submitSchema = z.object({
  url: z.string().trim().max(500).optional().transform((value) => value || undefined),
  note: z.string().trim().max(1500, "The note is too long.").optional().transform((value) => value || undefined),
  addToPortfolio: z.boolean(),
}).refine((value) => value.url || value.note, { message: "Add a link or a short description of your result." })
  .refine((value) => !value.url || /^https?:\/\/\S+$/i.test(value.url), { message: "The link must start with http:// or https://." });

/** Picks the Polish or English copy based on the request locale. */
async function translator() {
  const locale = await getRequestLocale();
  return (pl: string, en: string) => (locale === "en" ? en : pl);
}

function featureUnavailable(t: (pl: string, en: string) => string): Result {
  return { error: t("Mini-próby nie są jeszcze włączone. Spróbuj później.", "Trial tasks are not enabled yet. Please try again later.") };
}

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/manage`);
  revalidatePath(`/projects/${projectId}/applications`);
}

/** Owner: attach a trial task to one of the project's roles. */
export async function createTrialTask(projectId: string, input: z.input<typeof createSchema>): Promise<Result> {
  const t = await translator();
  if (!uuidSchema.safeParse(projectId).success) return { error: t("Nieprawidłowy projekt.", "Invalid project.") };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: t("Musisz być zalogowany.", "You must be logged in.") };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t("Nieprawidłowe dane.", "Invalid data.") };

  const rateError = await enforceUserRateLimit("action:trial:create", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const project = (await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT"))).limit(1))[0];
  if (!project || project.ownerId !== user.id) return { error: t("Nie masz do tego uprawnień.", "You do not have permission to do this.") };
  if (project.lifecycleStatus !== "ACTIVE") return { error: t("Projekt nie rekrutuje.", "This project is not recruiting.") };

  const role = (await db.select().from(projectRoles).where(eq(projectRoles.id, parsed.data.roleId)).limit(1))[0];
  if (!role || role.projectId !== projectId) return { error: t("Nie znaleziono roli.", "Role not found.") };

  try {
    await db.insert(trialTasks).values({ projectId, roleId: role.id, title: parsed.data.title, brief: parsed.data.brief, timeLimitMinutes: parsed.data.timeLimitMinutes });
  } catch (error) {
    if (isMissingTrialTables(error)) return featureUnavailable(t);
    if (isUniqueViolation(error)) return { error: t("Ta rola ma już aktywną mini-próbę. Zarchiwizuj ją, aby dodać nową.", "This role already has an active trial task. Archive it to add a new one.") };
    throw error;
  }
  await logEvent("trial_task_created", user.id, { projectId, roleId: role.id });
  revalidateProject(projectId);
  return { success: true };
}

/** Owner: stop offering a trial task (history of attempts is kept). */
export async function archiveTrialTask(taskId: string): Promise<Result> {
  const t = await translator();
  if (!uuidSchema.safeParse(taskId).success) return { error: t("Nieprawidłowe dane.", "Invalid data.") };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: t("Musisz być zalogowany.", "You must be logged in.") };

  try {
    const rows = await db.select({ task: trialTasks, ownerId: projects.ownerId }).from(trialTasks).innerJoin(projects, eq(projects.id, trialTasks.projectId)).where(eq(trialTasks.id, taskId)).limit(1);
    const row = rows[0];
    if (!row || row.ownerId !== user.id) return { error: t("Nie masz do tego uprawnień.", "You do not have permission to do this.") };
    await db.update(trialTasks).set({ isActive: false }).where(eq(trialTasks.id, taskId));
    revalidateProject(row.task.projectId);
    return { success: true };
  } catch (error) {
    if (isMissingTrialTables(error)) return featureUnavailable(t);
    throw error;
  }
}

/** Candidate: start the clock on a trial task. One attempt per person per task. */
export async function startTrialAttempt(taskId: string): Promise<Result> {
  const t = await translator();
  if (!uuidSchema.safeParse(taskId).success) return { error: t("Nieprawidłowe dane.", "Invalid data.") };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: t("Musisz być zalogowany.", "You must be logged in.") };
  const rateError = await enforceUserRateLimit("action:trial:start", user.id, (await isNewAccount(user.id)) ? 4 : 12, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  try {
    const rows = await db.select({ task: trialTasks, project: projects, role: projectRoles })
      .from(trialTasks)
      .innerJoin(projects, eq(projects.id, trialTasks.projectId))
      .innerJoin(projectRoles, eq(projectRoles.id, trialTasks.roleId))
      .where(eq(trialTasks.id, taskId)).limit(1);
    const row = rows[0];
    if (!row || !row.task.isActive || row.project.lifecycleStatus !== "ACTIVE") return { error: t("Ta mini-próba nie jest już dostępna.", "This trial task is no longer available.") };
    if (row.project.ownerId === user.id) return { error: t("Nie możesz podejść do próby własnego projektu.", "You cannot take a trial for your own project.") };
    if (await isBlockedEitherWay(user.id, row.project.ownerId)) return { error: t("Nie możesz podejść do tej próby.", "You cannot take this trial.") };

    const filled = await db.select({ count: sql<number>`count(*)::int` }).from(projectMembers).where(eq(projectMembers.roleId, row.role.id));
    if ((filled[0]?.count ?? 0) >= row.role.slots) return { error: t("Ta rola jest już obsadzona.", "This role has already been filled.") };
    const alreadyMember = await db.select({ userId: projectMembers.userId }).from(projectMembers).where(and(eq(projectMembers.projectId, row.project.id), eq(projectMembers.userId, user.id))).limit(1);
    if (alreadyMember[0]) return { error: t("Jesteś już w tym zespole.", "You are already on this team.") };

    const dueAt = new Date(Date.now() + row.task.timeLimitMinutes * 60_000);
    try {
      await db.insert(trialTaskAttempts).values({ trialTaskId: taskId, userId: user.id, dueAt });
    } catch (error) {
      if (isUniqueViolation(error)) return { error: t("Już podchodzisz lub podchodziłeś do tej próby.", "You already have an attempt on this task.") };
      throw error;
    }
    await logEvent("trial_attempt_started", user.id, { projectId: row.project.id, taskId });
    revalidateProject(row.project.id);
    return { success: true };
  } catch (error) {
    if (isMissingTrialTables(error)) return featureUnavailable(t);
    throw error;
  }
}

/** Candidate: hand in the result. Late submissions are accepted; the owner sees the time taken. */
export async function submitTrialAttempt(attemptId: string, input: z.input<typeof submitSchema>): Promise<Result> {
  const t = await translator();
  if (!uuidSchema.safeParse(attemptId).success) return { error: t("Nieprawidłowe dane.", "Invalid data.") };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: t("Musisz być zalogowany.", "You must be logged in.") };
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t("Nieprawidłowe dane.", "Invalid data.") };

  try {
    const rows = await db.select({ attempt: trialTaskAttempts, task: trialTasks, project: projects })
      .from(trialTaskAttempts)
      .innerJoin(trialTasks, eq(trialTasks.id, trialTaskAttempts.trialTaskId))
      .innerJoin(projects, eq(projects.id, trialTasks.projectId))
      .where(eq(trialTaskAttempts.id, attemptId)).limit(1);
    const row = rows[0];
    if (!row || row.attempt.userId !== user.id) return { error: t("Nie znaleziono próby.", "Attempt not found.") };
    if (row.attempt.status !== "STARTED") return { error: t("Ta próba została już oddana.", "This attempt has already been submitted.") };

    const updated = await db.update(trialTaskAttempts)
      .set({ status: "SUBMITTED", submittedAt: new Date(), submissionUrl: parsed.data.url ?? null, submissionNote: parsed.data.note ?? null, addToPortfolio: parsed.data.addToPortfolio })
      .where(and(eq(trialTaskAttempts.id, attemptId), eq(trialTaskAttempts.status, "STARTED")))
      .returning({ id: trialTaskAttempts.id });
    if (!updated[0]) return { error: t("Ta próba została już oddana.", "This attempt has already been submitted.") };

    const profile = (await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1))[0];
    const who = profile?.username ?? "Ktoś";
    await createNotification(
      row.project.ownerId,
      "TRIAL_TASK_SUBMITTED",
      `${who} oddał(a) mini-próbę w ${row.project.name}`,
      row.task.title,
      `/projects/${row.project.id}/manage#trial-tasks`,
      { actorId: user.id, entityType: "trial_attempt", entityId: attemptId, titleEn: `${who} submitted a trial task for ${row.project.name}`, bodyEn: row.task.title },
    );
    await logEvent("trial_attempt_submitted", user.id, { projectId: row.project.id, taskId: row.task.id });
    revalidateProject(row.project.id);
    return { success: true };
  } catch (error) {
    if (isMissingTrialTables(error)) return featureUnavailable(t);
    throw error;
  }
}

/** Owner: pass or fail a submitted attempt. A passed attempt is published to the candidate's portfolio if they opted in. */
export async function reviewTrialAttempt(attemptId: string, decision: "PASSED" | "FAILED", note?: string): Promise<Result> {
  const t = await translator();
  if (!uuidSchema.safeParse(attemptId).success || !["PASSED", "FAILED"].includes(decision)) return { error: t("Nieprawidłowe dane.", "Invalid data.") };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: t("Musisz być zalogowany.", "You must be logged in.") };
  const reviewNote = (note ?? "").trim().slice(0, 500) || null;

  try {
    const rows = await db.select({ attempt: trialTaskAttempts, task: trialTasks, project: projects, role: projectRoles })
      .from(trialTaskAttempts)
      .innerJoin(trialTasks, eq(trialTasks.id, trialTaskAttempts.trialTaskId))
      .innerJoin(projects, eq(projects.id, trialTasks.projectId))
      .innerJoin(projectRoles, eq(projectRoles.id, trialTasks.roleId))
      .where(eq(trialTaskAttempts.id, attemptId)).limit(1);
    const row = rows[0];
    if (!row || row.project.ownerId !== user.id) return { error: t("Nie masz do tego uprawnień.", "You do not have permission to do this.") };
    if (row.attempt.status !== "SUBMITTED") return { error: t("Ta próba nie czeka na ocenę.", "This attempt is not waiting for review.") };

    let portfolioItemId: string | null = null;
    if (decision === "PASSED" && row.attempt.addToPortfolio) {
      const description = [
        row.attempt.submissionNote,
        row.attempt.submissionUrl ? `Link: ${row.attempt.submissionUrl}` : null,
        `Mini-próba w projekcie ${row.project.name}: ${row.task.brief}`.slice(0, 600),
      ].filter(Boolean).join("\n\n");
      const [item] = await db.insert(portfolioItems).values({
        userId: row.attempt.userId,
        projectId: row.project.id,
        title: `Mini-próba: ${row.task.title}`.slice(0, 120),
        description: description.slice(0, 2000),
        role: ROLE_LABELS[row.role.roleType],
        tools: row.role.skills.slice(0, 8),
      }).returning({ id: portfolioItems.id });
      portfolioItemId = item?.id ?? null;
    }

    const updated = await db.update(trialTaskAttempts)
      .set({ status: decision, reviewedAt: new Date(), reviewNote, portfolioItemId })
      .where(and(eq(trialTaskAttempts.id, attemptId), eq(trialTaskAttempts.status, "SUBMITTED")))
      .returning({ id: trialTaskAttempts.id });
    if (!updated[0]) return { error: t("Ta próba została już oceniona.", "This attempt has already been reviewed.") };

    const passed = decision === "PASSED";
    await createNotification(
      row.attempt.userId,
      "TRIAL_TASK_REVIEWED",
      passed ? `Mini-próba zaliczona: ${row.project.name}` : `Mini-próba oceniona: ${row.project.name}`,
      reviewNote ?? (passed ? "Świetna robota! Możesz teraz zgłosić się do tej roli." : undefined),
      `/projects/${row.project.id}`,
      {
        actorId: user.id,
        entityType: "trial_attempt",
        entityId: attemptId,
        titleEn: passed ? `Trial task passed: ${row.project.name}` : `Trial task reviewed: ${row.project.name}`,
        bodyEn: reviewNote ?? (passed ? "Great work! You can now apply for this role." : null),
      },
    );
    await logEvent("trial_attempt_reviewed", user.id, { projectId: row.project.id, attemptId, decision });
    revalidateProject(row.project.id);
    if (portfolioItemId) {
      revalidatePath("/profile");
      revalidatePath(`/builders/${row.attempt.userId}`);
    }
    return { success: true };
  } catch (error) {
    if (isMissingTrialTables(error)) return featureUnavailable(t);
    throw error;
  }
}
