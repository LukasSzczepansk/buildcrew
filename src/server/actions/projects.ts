"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  applications,
  crewMembers,
  crews,
  profiles,
  projectInvites,
  projectIdeaInterests,
  projectMembers,
  projectRoles,
  projectTechnologies,
  projectWorkspaceActivity,
  projectWorkspaceTasks,
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
import { listFollowerIds } from "@/server/data/network";

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
    let sourceIdeaInterestUserIds: string[] = [];
    if (data.sourceIdeaId) {
      const sourceRows = await tx.select().from(projects).where(and(eq(projects.id, data.sourceIdeaId), eq(projects.entryType, "IDEA"))).limit(1);
      const sourceIdea = sourceRows[0];
      if (!sourceIdea || sourceIdea.ownerId !== user.id) return { error: "Nie możesz przekształcić tego pomysłu w projekt." } as const;
      const interestRows = await tx.select({ userId: projectIdeaInterests.userId }).from(projectIdeaInterests).where(eq(projectIdeaInterests.projectId, data.sourceIdeaId));
      sourceIdeaInterestUserIds = interestRows.map((row) => row.userId);
    }

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
      entryType: "PROJECT",
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      stage: data.stage,
      interests: data.interests,
      ownerContribution: data.ownerContribution || null,
      commitment: data.commitment,
      goal: data.goal,
      character: data.character,
      projectType: data.projectType,
      existingAssets: data.existingAssets,
      collaborationMode: data.collaborationMode,
      collaborationPace: data.collaborationPace,
      duration: data.duration,
      repositoryUrl: data.repositoryUrl || null,
      demoUrl: data.demoUrl || null,
      designUrl: data.designUrl || null,
      docsUrl: data.docsUrl || null,
    }).returning();

    if (data.technologies.length) {
      await tx.insert(projectTechnologies).values(data.technologies.map((name) => ({ projectId: project.id, name })));
    }
    await tx.insert(projectRoles).values(data.roles.map((r) => ({
      projectId: project.id,
      roleType: r.roleType,
      description: r.description || null,
      preferredLevel: r.preferredLevel,
      skills: r.skills,
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
    if (data.sourceIdeaId) {
      await tx.delete(projects).where(and(eq(projects.id, data.sourceIdeaId), eq(projects.ownerId, user.id), eq(projects.entryType, "IDEA")));
    }
    return { project, sourceIdeaInterestUserIds } as const;
  });

  if ("error" in result) return result;
  if (data.crewId) await logEvent("crew_converted_to_project", user.id, { crewId: data.crewId, projectId: result.project.id });
  if (data.sourceIdeaId && result.sourceIdeaInterestUserIds.length) {
    await Promise.all(result.sourceIdeaInterestUserIds.filter((id) => id !== user.id).map((recipientId) => createNotification(
      recipientId,
      "IDEA_CONVERTED",
      `${data.name} jest już projektem`,
      "Pomysł, którym się interesowałeś, został rozwinięty w pełny projekt.",
      `/projects/${result.project.id}`,
      { actorId: user.id, entityType: "project", entityId: result.project.id },
    )));
  }
  await logEvent("project_created", user.id, { projectId: result.project.id, name: data.name, sourceIdeaId: data.sourceIdeaId });
  const followerIds = await listFollowerIds(user.id);
  if (followerIds.length) {
    const actor = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    await Promise.all(followerIds.map((recipientId) => createNotification(
      recipientId,
      "FOLLOWED_USER_PROJECT",
      `${actor[0]?.username ?? "Obserwowany builder"} opublikował nowy projekt`,
      data.name,
      `/projects/${result.project.id}`,
      { actorId: user.id, entityType: "project", entityId: result.project.id },
    )));
  }
  revalidatePath("/projects");
  revalidatePath("/network");
  revalidatePath("/ideas");
  revalidatePath("/dashboard");
  return { success: true, projectId: result.project.id };
}

export async function applyToProject(projectId: string, input: z.infer<typeof applicationSchema>) {
  if (!uuidSchema.safeParse(projectId).success) return { error: "Nieprawidłowy projekt." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:project:apply", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Błędne dane." };

  const projectRows = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT"))).limit(1);
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
  await createNotification(project.ownerId, "PROJECT_APPLICATION", `${profileRows[0]?.username ?? "Ktoś"} chce dołączyć do ${project.name}`, `Rola: ${ROLE_LABELS[role.roleType]}${parsed.data.message ? ` · ${parsed.data.message.slice(0, 120)}` : ""}`, `/projects/${projectId}/applications`, { actorId: user.id, entityType: "project", entityId: projectId, emailPreference: "emailProjectApplications", emailCtaLabel: "Zobacz zgłoszenie" });
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
  await createNotification(row.application.applicantId, decision === "ACCEPTED" ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED", decision === "ACCEPTED" ? `Dołączasz do ekipy ${row.project.name}` : `Twoje zgłoszenie do ${row.project.name} nie zostało przyjęte.`, decision === "ACCEPTED" ? "Możecie teraz wymienić kontakt i zacząć budować razem." : undefined, `/projects/${row.project.id}`, { actorId: user.id, entityType: "project", entityId: row.project.id, emailPreference: "emailProjectAccepted", emailCtaLabel: "Zobacz projekt" });
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

  const projectRows = await db.select().from(projects).where(and(eq(projects.id, validatedProjectId), eq(projects.entryType, "PROJECT"))).limit(1);
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
  await createNotification(validatedInviteeId, "PROJECT_INVITE", `Zaproszenie do projektu ${project.name}`, validatedMessage || undefined, "/invitations", { actorId: user.id, entityType: "project", entityId: project.id, emailPreference: "emailProjectApplications", emailCtaLabel: "Zobacz zaproszenie" });
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


export async function removeProjectMember(projectId: string, memberId: string) {
  if (!uuidSchema.safeParse(projectId).success || !uuidSchema.safeParse(memberId).success) return { error: "Nieprawidłowe dane." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:project:remove-member", user.id, 40, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from projects where id = ${projectId} for update`);
    const projectRows = await tx.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT"))).limit(1);
    const project = projectRows[0];
    if (!project) return { error: "Projekt nie istnieje." } as const;
    if (project.ownerId !== user.id) return { error: "Tylko twórca projektu może usuwać członków zespołu." } as const;
    if (memberId === user.id) return { error: "Twórca projektu nie może usunąć samego siebie." } as const;

    const memberRows = await tx.select({ member: projectMembers, username: profiles.username })
      .from(projectMembers)
      .leftJoin(profiles, eq(profiles.userId, projectMembers.userId))
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)))
      .limit(1);
    const row = memberRows[0];
    if (!row || row.member.isOwner) return { error: "Ta osoba nie jest członkiem projektu." } as const;

    await tx.update(projectWorkspaceTasks)
      .set({ assigneeId: null, updatedAt: new Date() })
      .where(and(eq(projectWorkspaceTasks.projectId, projectId), eq(projectWorkspaceTasks.assigneeId, memberId)));
    await tx.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)));
    await tx.insert(projectWorkspaceActivity).values({
      projectId,
      actorId: user.id,
      type: "MEMBER_REMOVED",
      body: `${row.username ?? "Członek zespołu"} nie jest już członkiem projektu.`,
    });

    return { project, username: row.username ?? "Członek zespołu" } as const;
  });

  if ("error" in outcome) return outcome;
  await createNotification(
    memberId,
    "PROJECT_MEMBER_REMOVED",
    `Nie jesteś już członkiem projektu ${outcome.project.name}`,
    "Twój dostęp do prywatnego workspace'u i nowych treści zespołu został zakończony.",
    `/projects/${projectId}`,
    { actorId: user.id, entityType: "project", entityId: projectId },
  );
  await logEvent("project_member_removed", user.id, { projectId, memberId });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/manage`);
  revalidatePath(`/projects/${projectId}/workspace`);
  revalidatePath("/my-projects");
  return { success: true };
}

export async function leaveProject(projectId: string) {
  if (!uuidSchema.safeParse(projectId).success) return { error: "Nieprawidłowy projekt." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:project:leave", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from projects where id = ${projectId} for update`);
    const projectRows = await tx.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT"))).limit(1);
    const project = projectRows[0];
    if (!project) return { error: "Projekt nie istnieje." } as const;
    if (project.ownerId === user.id) return { error: "Twórca projektu nie może go opuścić. Może nim zarządzać z poziomu Moich projektów." } as const;

    const memberRows = await tx.select({ member: projectMembers, username: profiles.username })
      .from(projectMembers)
      .leftJoin(profiles, eq(profiles.userId, projectMembers.userId))
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)))
      .limit(1);
    const row = memberRows[0];
    if (!row) return { error: "Nie należysz do tego projektu." } as const;

    await tx.update(projectWorkspaceTasks)
      .set({ assigneeId: null, updatedAt: new Date() })
      .where(and(eq(projectWorkspaceTasks.projectId, projectId), eq(projectWorkspaceTasks.assigneeId, user.id)));
    await tx.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)));
    await tx.insert(projectWorkspaceActivity).values({
      projectId,
      actorId: user.id,
      type: "MEMBER_LEFT",
      body: `${row.username ?? "Członek zespołu"} opuścił projekt.`,
    });

    return { project, username: row.username ?? "Członek zespołu" } as const;
  });

  if ("error" in outcome) return outcome;
  await createNotification(
    outcome.project.ownerId,
    "PROJECT_MEMBER_LEFT",
    `${outcome.username} opuścił projekt ${outcome.project.name}`,
    "Miejsce w zespole jest ponownie dostępne, jeśli było przypisane do otwartej roli.",
    `/projects/${projectId}/manage`,
    { actorId: user.id, entityType: "project", entityId: projectId },
  );
  await logEvent("project_member_left", user.id, { projectId });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/manage`);
  revalidatePath(`/projects/${projectId}/workspace`);
  revalidatePath("/my-projects");
  return { success: true };
}
