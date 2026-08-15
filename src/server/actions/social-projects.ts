"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  profiles,
  projectCredits,
  projectFollows,
  projectMembers,
  projectUpdates,
  projects,
  type ProjectUpdateKind,
} from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit } from "@/lib/security";
import { listProjectFollowerIds } from "@/server/data/social-projects";
import { createNotification } from "@/server/services/notifications";

const uuid = z.string().uuid();
const updateSchema = z.object({
  projectId: z.string().uuid(),
  kind: z.enum(["PROGRESS", "ROLE", "MILESTONE", "LAUNCH"]),
  body: z.string().trim().min(10, "Napisz przynajmniej 10 znaków.").max(600, "Aktualizacja może mieć maksymalnie 600 znaków."),
});
const completionSchema = z.object({
  projectId: z.string().uuid(),
  outcome: z.string().trim().min(20, "Krótko opisz rezultat projektu (min. 20 znaków).").max(800, "Opis rezultatu może mieć maksymalnie 800 znaków."),
});

export async function followProject(projectId: string) {
  const parsed = uuid.safeParse(projectId);
  if (!parsed.success) return { error: "Nieprawidłowy projekt." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:project:follow", user.id, 100, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const row = await db.select({ id: projects.id, ownerId: projects.ownerId }).from(projects)
    .where(and(eq(projects.id, parsed.data), eq(projects.entryType, "PROJECT"))).limit(1);
  if (!row[0]) return { error: "Projekt nie istnieje." };
  if (row[0].ownerId === user.id) return { error: "To Twój projekt — nie musisz go obserwować." };

  await db.insert(projectFollows).values({ projectId: parsed.data, userId: user.id }).onConflictDoNothing();
  await logEvent("project_follow", user.id, { projectId: parsed.data });
  revalidatePath(`/projects/${parsed.data}`);
  revalidatePath(`/p/${parsed.data}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function unfollowProject(projectId: string) {
  const parsed = uuid.safeParse(projectId);
  if (!parsed.success) return { error: "Nieprawidłowy projekt." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  await db.delete(projectFollows).where(and(eq(projectFollows.projectId, parsed.data), eq(projectFollows.userId, user.id)));
  await logEvent("project_unfollow", user.id, { projectId: parsed.data });
  revalidatePath(`/projects/${parsed.data}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function publishProjectUpdate(input: { projectId: string; kind: ProjectUpdateKind; body: string }) {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź treść aktualizacji." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:project:update", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const projectRows = await db.select({ id: projects.id, name: projects.name, ownerId: projects.ownerId, lifecycleStatus: projects.lifecycleStatus })
    .from(projects).where(and(eq(projects.id, parsed.data.projectId), eq(projects.entryType, "PROJECT"))).limit(1);
  const project = projectRows[0];
  if (!project) return { error: "Projekt nie istnieje." };
  if (project.ownerId !== user.id) return { error: "Tylko autor projektu może publikować aktualizacje." };
  if (project.lifecycleStatus === "COMPLETED") return { error: "Ukończony projekt ma zamkniętą historię aktualizacji." };

  const [created] = await db.insert(projectUpdates).values({
    projectId: project.id,
    authorId: user.id,
    kind: parsed.data.kind,
    body: parsed.data.body,
  }).returning({ id: projectUpdates.id });
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, project.id));

  const followers = (await listProjectFollowerIds(project.id)).filter((id) => id !== user.id);
  await Promise.all(followers.slice(0, 250).map((followerId) => createNotification(
    followerId,
    "PROJECT_UPDATE",
    `${project.name} ma nową aktualizację`,
    parsed.data.body.length > 140 ? `${parsed.data.body.slice(0, 137)}…` : parsed.data.body,
    `/projects/${project.id}`,
    { actorId: user.id, entityType: "project", entityId: project.id },
  )));
  await logEvent("project_update_published", user.id, { projectId: project.id, updateId: created?.id, kind: parsed.data.kind, followers: followers.length });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/p/${project.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/network");
  return { success: true };
}

export async function setProjectLifecycleStatus(projectId: string, status: "ACTIVE" | "PAUSED") {
  const parsed = uuid.safeParse(projectId);
  if (!parsed.success) return { error: "Nieprawidłowy projekt." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const projectRows = await db.select({ ownerId: projects.ownerId, lifecycleStatus: projects.lifecycleStatus }).from(projects)
    .where(and(eq(projects.id, parsed.data), eq(projects.entryType, "PROJECT"))).limit(1);
  const project = projectRows[0];
  if (!project) return { error: "Projekt nie istnieje." };
  if (project.ownerId !== user.id) return { error: "Tylko autor może zmienić status projektu." };
  if (project.lifecycleStatus === "COMPLETED") return { error: "Ukończonego projektu nie można ponownie aktywować z tego miejsca." };
  await db.update(projects).set({ lifecycleStatus: status, updatedAt: new Date() }).where(eq(projects.id, parsed.data));
  revalidatePath(`/projects/${parsed.data}`);
  revalidatePath(`/projects/${parsed.data}/manage`);
  revalidatePath("/projects");
  revalidatePath("/my-projects");
  return { success: true };
}

export async function completeProject(input: { projectId: string; outcome: string }) {
  const parsed = completionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź opis rezultatu." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:project:complete", user.id, 10, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from projects where id = ${parsed.data.projectId} for update`);
    const projectRows = await tx.select().from(projects)
      .where(and(eq(projects.id, parsed.data.projectId), eq(projects.entryType, "PROJECT"))).limit(1);
    const project = projectRows[0];
    if (!project) return { error: "Projekt nie istnieje." } as const;
    if (project.ownerId !== user.id) return { error: "Tylko autor projektu może oznaczyć go jako ukończony." } as const;
    if (project.lifecycleStatus === "COMPLETED") return { error: "Projekt jest już ukończony." } as const;

    const memberRows = await tx.select({
      userId: projectMembers.userId,
      roleType: projectMembers.roleType,
      isOwner: projectMembers.isOwner,
      username: profiles.username,
    }).from(projectMembers)
      .leftJoin(profiles, eq(profiles.userId, projectMembers.userId))
      .where(eq(projectMembers.projectId, project.id));

    const ownerRows = await tx.select({ username: profiles.username, roleType: profiles.role })
      .from(profiles).where(eq(profiles.userId, project.ownerId)).limit(1);

    const credits = memberRows.map((member) => ({
      projectId: project.id,
      userId: member.userId,
      usernameSnapshot: member.username ?? "Builder",
      roleType: member.roleType,
      isOwner: member.isOwner || member.userId === project.ownerId,
    }));
    if (!credits.some((credit) => credit.userId === project.ownerId)) {
      credits.push({
        projectId: project.id,
        userId: project.ownerId,
        usernameSnapshot: ownerRows[0]?.username ?? "Builder",
        roleType: ownerRows[0]?.roleType ?? null,
        isOwner: true,
      });
    }
    if (credits.length) await tx.insert(projectCredits).values(credits).onConflictDoNothing();

    const now = new Date();
    await tx.update(projects).set({
      lifecycleStatus: "COMPLETED",
      stage: "LAUNCHED",
      completedAt: now,
      outcome: parsed.data.outcome,
      updatedAt: now,
    }).where(eq(projects.id, project.id));
    await tx.insert(projectUpdates).values({
      projectId: project.id,
      authorId: user.id,
      kind: "LAUNCH",
      body: parsed.data.outcome,
    });
    return { project, memberIds: credits.map((credit) => credit.userId).filter((id): id is string => Boolean(id)) } as const;
  });

  if ("error" in outcome) return outcome;
  const followerIds = await listProjectFollowerIds(outcome.project.id);
  const recipients = [...new Set([...followerIds, ...outcome.memberIds])].filter((id) => id !== user.id);
  await Promise.all(recipients.slice(0, 300).map((recipientId) => createNotification(
    recipientId,
    "PROJECT_COMPLETED",
    `${outcome.project.name} został ukończony`,
    "Zespół zamknął projekt. Rezultat i credits są teraz częścią historii współpracy.",
    `/projects/${outcome.project.id}`,
    { actorId: user.id, entityType: "project", entityId: outcome.project.id },
  )));
  await logEvent("project_completed", user.id, { projectId: outcome.project.id, creditedUsers: outcome.memberIds.length });

  revalidatePath(`/projects/${outcome.project.id}`);
  revalidatePath(`/projects/${outcome.project.id}/manage`);
  revalidatePath(`/p/${outcome.project.id}`);
  revalidatePath("/projects");
  revalidatePath("/my-projects");
  revalidatePath("/network");
  revalidatePath("/dashboard");
  for (const memberId of outcome.memberIds) revalidatePath(`/builders/${memberId}`);
  return { success: true };
}
