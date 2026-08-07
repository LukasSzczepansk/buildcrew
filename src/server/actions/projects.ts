"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  applications,
  crewMembers,
  crews,
  profiles,
  projectInvites,
  projectMembers,
  projectRoles,
  projectTechnologies,
  projects,
  users,
} from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit } from "@/lib/security";
import { applicationSchema, decisionSchema, projectCreateSchema, projectInviteSchema, uuidSchema } from "@/lib/validations";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { createNotification } from "@/server/services/notifications";
import { ROLE_LABELS } from "@/lib/constants";

export type ActionState = { error?: string; success?: boolean };

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

export async function createProject(input: z.infer<typeof projectCreateSchema>) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:project:create", user.id, 10, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = projectCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź wypełnione pola." };
  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    let crewMembersList: { userId: string; roleType: string | null }[] = [];
    if (data.crewId) {
      await tx.execute(sql`select id from crews where id = ${data.crewId} for update`);
      const crewRows = await tx.select().from(crews).where(eq(crews.id, data.crewId)).limit(1);
      const crew = crewRows[0];
      if (!crew || crew.status !== "FORMING") return { error: "Ta ekipa nie może już zostać zamieniona w projekt." } as const;
      const members = await tx
        .select({ userId: crewMembers.userId, roleType: profiles.role })
        .from(crewMembers)
        .leftJoin(profiles, eq(profiles.userId, crewMembers.userId))
        .where(eq(crewMembers.crewId, data.crewId));
      if (!members.some((m) => m.userId === user.id)) return { error: "Nie należysz do tej ekipy." } as const;
      crewMembersList = members;
    }

    const [project] = await tx.insert(projects).values({
      ownerId: user.id,
      crewId: data.crewId ?? null,
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      stage: data.stage,
      interests: data.interests,
      ownerContribution: data.ownerContribution || null,
      commitment: data.commitment,
      goal: data.goal,
      character: data.character,
    }).returning();

    if (data.technologies.length) {
      await tx.insert(projectTechnologies).values(data.technologies.map((name) => ({ projectId: project.id, name })));
    }
    await tx.insert(projectRoles).values(data.roles.map((r) => ({
      projectId: project.id,
      roleType: r.roleType,
      description: r.description || null,
      preferredLevel: r.preferredLevel,
      slots: r.slots,
    })));
    await tx.insert(projectMembers).values({ projectId: project.id, userId: user.id, isOwner: true, roleType: null });

    if (data.crewId && crewMembersList.length) {
      const others = crewMembersList.filter((m) => m.userId !== user.id);
      if (others.length) {
        await tx.insert(projectMembers).values(others.map((m) => ({
          projectId: project.id,
          userId: m.userId,
          isOwner: false,
          roleType: m.roleType as never,
        }))).onConflictDoNothing();
      }
      await tx.update(crews).set({ status: "CONVERTED_TO_PROJECT", projectId: project.id }).where(eq(crews.id, data.crewId));
    }
    return { project } as const;
  });

  if ("error" in result) return result;
  if (data.crewId) await logEvent("crew_converted_to_project", user.id, { crewId: data.crewId, projectId: result.project.id });
  await logEvent("project_created", user.id, { projectId: result.project.id, name: data.name });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${result.project.id}`);
}

export async function applyToProject(projectId: string, input: z.infer<typeof applicationSchema>) {
  if (!uuidSchema.safeParse(projectId).success) return { error: "Nieprawidłowy projekt." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:project:apply", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Błędne dane." };

  const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  const project = projectRows[0];
  if (!project) return { error: "Projekt nie istnieje." };
  if (project.ownerId === user.id) return { error: "Nie możesz aplikować do własnego projektu." };
  if (await isBlockedEitherWay(user.id, project.ownerId)) return { error: "Nie możesz aplikować do tego projektu." };

  const roleRows = await db.select().from(projectRoles).where(eq(projectRoles.id, parsed.data.roleId)).limit(1);
  const role = roleRows[0];
  if (!role || role.projectId !== projectId) return { error: "Rola nie istnieje." };
  const filledRows = await db.select({ count: sql<number>`count(*)::int` }).from(projectMembers).where(eq(projectMembers.roleId, role.id));
  if ((filledRows[0]?.count ?? 0) >= role.slots) return { error: "Ta rola jest już obsadzona." };

  try {
    await db.insert(applications).values({ projectId, roleId: role.id, applicantId: user.id, message: parsed.data.message || null });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Masz już oczekujące zgłoszenie do tej roli." };
    throw error;
  }

  const profileRows = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  await createNotification(project.ownerId, "PROJECT_APPLICATION", `${profileRows[0]?.username ?? "Ktoś"} zgłasza się do projektu ${project.name}`, `Rola: ${ROLE_LABELS[role.roleType]}`, `/projects/${projectId}/applications`);
  await logEvent("project_application_sent", user.id, { projectId, roleId: role.id });
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function respondToApplication(applicationId: string, decision: "ACCEPTED" | "REJECTED") {
  if (!uuidSchema.safeParse(applicationId).success || !decisionSchema.safeParse(decision).success) return { error: "Nieprawidłowe dane." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from applications where id = ${applicationId} for update`);
    const rows = await tx.select({ application: applications, project: projects, role: projectRoles })
      .from(applications)
      .innerJoin(projects, eq(projects.id, applications.projectId))
      .innerJoin(projectRoles, eq(projectRoles.id, applications.roleId))
      .where(eq(applications.id, applicationId)).limit(1);
    const row = rows[0];
    if (!row) return { error: "Zgłoszenie nie istnieje." } as const;
    if (row.project.ownerId !== user.id) return { error: "Brak uprawnień." } as const;
    if (row.application.status !== "PENDING") return { error: "To zgłoszenie zostało już rozpatrzone." } as const;

    if (decision === "ACCEPTED") {
      await tx.execute(sql`select id from project_roles where id = ${row.role.id} for update`);
      const filledRows = await tx.select({ count: sql<number>`count(*)::int` }).from(projectMembers).where(eq(projectMembers.roleId, row.role.id));
      if ((filledRows[0]?.count ?? 0) >= row.role.slots) return { error: "Ta rola jest już obsadzona." } as const;
      await tx.insert(projectMembers).values({ projectId: row.project.id, userId: row.application.applicantId, roleId: row.role.id, roleType: row.role.roleType, isOwner: false }).onConflictDoNothing();
    }
    await tx.update(applications).set({ status: decision, updatedAt: new Date() }).where(and(eq(applications.id, applicationId), eq(applications.status, "PENDING")));
    return { row } as const;
  });

  if ("error" in outcome) return outcome;
  const row = outcome.row;
  if (decision === "ACCEPTED") {
    await logEvent("project_application_accepted", user.id, { projectId: row.project.id, applicantId: row.application.applicantId });
    await logEvent("contact_revealed", user.id, { withUserId: row.application.applicantId });
  }
  await createNotification(row.application.applicantId, decision === "ACCEPTED" ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED", decision === "ACCEPTED" ? `Zostałeś przyjęty do projektu ${row.project.name}! 🎉` : `Twoje zgłoszenie do ${row.project.name} nie zostało przyjęte.`, decision === "ACCEPTED" ? "Możecie teraz wymienić kontakt." : undefined, `/projects/${row.project.id}`);
  revalidatePath(`/projects/${row.project.id}`);
  revalidatePath(`/projects/${row.project.id}/applications`);
  return { success: true };
}

export async function inviteToProject(projectId: string, inviteeId: string, roleId: string | undefined, message: string) {
  const inviteInput = projectInviteSchema.safeParse({ projectId, inviteeId, roleId, message });
  if (!inviteInput.success) return { error: inviteInput.error.issues[0]?.message ?? "Nieprawidłowe dane." };
  const validatedProjectId = inviteInput.data.projectId;
  const validatedInviteeId = inviteInput.data.inviteeId;
  const validatedRoleId = inviteInput.data.roleId;
  const validatedMessage = inviteInput.data.message ?? "";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:project:invite", user.id, 30, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  if (validatedInviteeId === user.id) return { error: "Nie możesz zaprosić samego siebie." };
  const inviteeRows = await db.select({ id: users.id, isSuspended: users.isSuspended, systemRole: users.systemRole, onboardingCompleted: profiles.onboardingCompleted })
    .from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, validatedInviteeId)).limit(1);
  const invitee = inviteeRows[0];
  if (!invitee || invitee.isSuspended || invitee.systemRole === "ADMIN" || !invitee.onboardingCompleted) return { error: "Ta osoba nie jest dostępna." };

  const projectRows = await db.select().from(projects).where(eq(projects.id, validatedProjectId)).limit(1);
  const project = projectRows[0];
  if (!project) return { error: "Projekt nie istnieje." };
  if (project.ownerId !== user.id) return { error: "Brak uprawnień." };
  if (await isBlockedEitherWay(user.id, validatedInviteeId)) return { error: "Nie można zaprosić tej osoby." };
  const existingMember = await db.select({ userId: projectMembers.userId }).from(projectMembers).where(and(eq(projectMembers.projectId, validatedProjectId), eq(projectMembers.userId, validatedInviteeId))).limit(1);
  if (existingMember.length) return { error: "Ta osoba już należy do projektu." };
  if (validatedRoleId) {
    const role = await db.select({ id: projectRoles.id, projectId: projectRoles.projectId }).from(projectRoles).where(eq(projectRoles.id, validatedRoleId)).limit(1);
    if (!role[0] || role[0].projectId !== validatedProjectId) return { error: "Wybrana rola nie należy do tego projektu." };
  }

  try {
    await db.insert(projectInvites).values({ projectId: validatedProjectId, roleId: validatedRoleId ?? null, inviterId: user.id, inviteeId: validatedInviteeId, message: validatedMessage || null });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Ta osoba ma już oczekujące zaproszenie do tego projektu." };
    throw error;
  }
  await createNotification(validatedInviteeId, "PROJECT_INVITE", `Zaproszenie do projektu ${project.name}`, validatedMessage || undefined, "/invitations");
  await logEvent("builder_invite_sent", user.id, { projectId: validatedProjectId, inviteeId: validatedInviteeId });
  revalidatePath(`/projects/${validatedProjectId}`);
  return { success: true };
}

export async function respondToProjectInvite(inviteId: string, decision: "ACCEPTED" | "REJECTED") {
  if (!uuidSchema.safeParse(inviteId).success || !decisionSchema.safeParse(decision).success) return { error: "Nieprawidłowe dane." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from project_invites where id = ${inviteId} for update`);
    const rows = await tx.select({ invite: projectInvites, project: projects }).from(projectInvites).innerJoin(projects, eq(projects.id, projectInvites.projectId)).where(eq(projectInvites.id, inviteId)).limit(1);
    const row = rows[0];
    if (!row) return { error: "Zaproszenie nie istnieje." } as const;
    if (row.invite.inviteeId !== user.id) return { error: "Brak uprawnień." } as const;
    if (row.invite.status !== "PENDING") return { error: "To zaproszenie zostało już rozpatrzone." } as const;
    if (await isBlockedEitherWay(user.id, row.project.ownerId)) return { error: "Nie można zaakceptować tego zaproszenia." } as const;

    let roleType = null as typeof profiles.$inferSelect.role;
    if (decision === "ACCEPTED") {
      if (row.invite.roleId) {
        await tx.execute(sql`select id from project_roles where id = ${row.invite.roleId} for update`);
        const roleRows = await tx.select().from(projectRoles).where(eq(projectRoles.id, row.invite.roleId)).limit(1);
        const role = roleRows[0];
        if (!role || role.projectId !== row.project.id) return { error: "Rola nie jest już dostępna." } as const;
        const filledRows = await tx.select({ count: sql<number>`count(*)::int` }).from(projectMembers).where(eq(projectMembers.roleId, role.id));
        if ((filledRows[0]?.count ?? 0) >= role.slots) return { error: "Ta rola jest już obsadzona." } as const;
        roleType = role.roleType;
      } else {
        const profileRows = await tx.select({ role: profiles.role }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
        roleType = profileRows[0]?.role ?? null;
      }
      await tx.insert(projectMembers).values({ projectId: row.project.id, userId: user.id, roleId: row.invite.roleId, roleType, isOwner: false }).onConflictDoNothing();
    }
    await tx.update(projectInvites).set({ status: decision }).where(and(eq(projectInvites.id, inviteId), eq(projectInvites.status, "PENDING")));
    return { row } as const;
  });

  if ("error" in outcome) return outcome;
  const row = outcome.row;
  if (decision === "ACCEPTED") await logEvent("contact_revealed", user.id, { withUserId: row.project.ownerId });
  await createNotification(row.project.ownerId, decision === "ACCEPTED" ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED", decision === "ACCEPTED" ? `Zaproszenie do ${row.project.name} zostało zaakceptowane!` : `Zaproszenie do ${row.project.name} zostało odrzucone.`, undefined, `/projects/${row.project.id}`);
  revalidatePath(`/projects/${row.project.id}`);
  return { success: true };
}
