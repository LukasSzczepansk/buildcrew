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
  projectUpdates,
  projectWorkspaceActivity,
  projectWorkspaceTasks,
  projects,
  users,
} from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit, isNewAccount } from "@/lib/security";
import { applicationSchema, decisionSchema, projectContentUpdateSchema, projectCreateSchema, projectInternationalSettingsSchema, projectInviteSchema, uuidSchema } from "@/lib/validations";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { createNotification } from "@/server/services/notifications";
import { ROLE_LABELS } from "@/lib/constants";
import { listFollowerIds } from "@/server/data/network";
import { getRequestLocale } from "@/lib/site-server";
import { appMessage } from "@/lib/server-copy";

export type ActionState = { error?: string; success?: boolean };

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

export async function createProject(input: z.infer<typeof projectCreateSchema>) {
  const locale = await getRequestLocale();
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: appMessage("You must be logged in.", locale) };
  const rateError = await enforceUserRateLimit("action:project:create", user.id, 10, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = projectCreateSchema.safeParse(input);
  if (!parsed.success) return { error: appMessage(parsed.error.issues[0]?.message, locale, "Check the fields and try again.") };
  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    let sourceIdeaInterestUserIds: string[] = [];
    if (data.sourceIdeaId) {
      const sourceRows = await tx.select().from(projects).where(and(eq(projects.id, data.sourceIdeaId), eq(projects.entryType, "IDEA"))).limit(1);
      const sourceIdea = sourceRows[0];
      if (!sourceIdea || sourceIdea.ownerId !== user.id) return { error: appMessage("You cannot convert this idea into a project.", locale) } as const;
      const interestRows = await tx.select({ userId: projectIdeaInterests.userId }).from(projectIdeaInterests).where(eq(projectIdeaInterests.projectId, data.sourceIdeaId));
      sourceIdeaInterestUserIds = interestRows.map((row) => row.userId);
    }

    let crewMembersList: { userId: string; roleType: string | null }[] = [];
    if (data.crewId) {
      await tx.execute(sql`select id from crews where id = ${data.crewId} for update`);
      const crewRows = await tx.select().from(crews).where(eq(crews.id, data.crewId)).limit(1);
      const crew = crewRows[0];
      if (!crew || crew.status !== "FORMING") return { error: appMessage("This crew can no longer be converted into a project.", locale) } as const;
      const members = await tx
        .select({ userId: crewMembers.userId, roleType: profiles.role })
        .from(crewMembers)
        .leftJoin(profiles, eq(profiles.userId, crewMembers.userId))
        .where(eq(crewMembers.crewId, data.crewId));
      if (!members.some((m) => m.userId === user.id)) return { error: appMessage("You are not a member of this crew.", locale) } as const;
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
      projectLanguage: data.projectLanguage,
      country: data.country || null,
      marketScope: data.marketScope,
      needs: data.needs,
      fundingStage: data.fundingStage ?? null,
      fundingAmount: data.fundingAmount || null,
      fundingUse: data.fundingUse || null,
      pitchDeckUrl: data.pitchDeckUrl || null,
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
      `${data.name} is now a project`,
      "An idea you were interested in has been developed into a full project.",
      `/projects/${result.project.id}`,
      { actorId: user.id, entityType: "project", entityId: result.project.id, titleEn: `${data.name} is now a project`, bodyEn: "An idea you were interested in has been developed into a full project." },
    )));
  }
  await logEvent("project_created", user.id, { projectId: result.project.id, name: data.name, sourceIdeaId: data.sourceIdeaId });
  const followerIds = await listFollowerIds(user.id);
  if (followerIds.length) {
    const actor = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    await Promise.all(followerIds.map((recipientId) => createNotification(
      recipientId,
      "FOLLOWED_USER_PROJECT",
      `${actor[0]?.username ?? "A builder you follow"} published a new project`,
      data.name,
      `/projects/${result.project.id}`,
      { actorId: user.id, entityType: "project", entityId: result.project.id, titleEn: `${actor[0]?.username ?? "A builder you follow"} published a new project`, bodyEn: data.name },
    )));
  }
  revalidatePath("/projects");
  revalidatePath("/network");
  revalidatePath("/ideas");
  revalidatePath("/dashboard");
  return { success: true, projectId: result.project.id };
}

export async function applyToProject(projectId: string, input: z.infer<typeof applicationSchema>) {
  const locale = await getRequestLocale();
  if (!uuidSchema.safeParse(projectId).success) return { error: appMessage("Invalid project.", locale) };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: appMessage("You must be logged in.", locale) };
  const rateError = await enforceUserRateLimit("action:project:apply", user.id, (await isNewAccount(user.id)) ? 8 : 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return { error: appMessage(parsed.error.issues[0]?.message, locale, "Invalid data.") };

  const projectRows = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT"))).limit(1);
  const project = projectRows[0];
  if (!project) return { error: appMessage("Project not found.", locale) };
  if (project.ownerId === user.id) return { error: appMessage("You cannot apply to your own project.", locale) };
  if (await isBlockedEitherWay(user.id, project.ownerId)) return { error: appMessage("You cannot apply to this project.", locale) };

  const roleRows = await db.select().from(projectRoles).where(eq(projectRoles.id, parsed.data.roleId)).limit(1);
  const role = roleRows[0];
  if (!role || role.projectId !== projectId) return { error: appMessage("Role not found.", locale) };
  const filledRows = await db.select({ count: sql<number>`count(*)::int` }).from(projectMembers).where(eq(projectMembers.roleId, role.id));
  if ((filledRows[0]?.count ?? 0) >= role.slots) return { error: appMessage("This role has already been filled.", locale) };

  try {
    await db.insert(applications).values({ projectId, roleId: role.id, applicantId: user.id, message: parsed.data.message || null });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: appMessage("You already have a pending application for this role.", locale) };
    throw error;
  }

  const profileRows = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  await createNotification(project.ownerId, "PROJECT_APPLICATION", `${profileRows[0]?.username ?? "Ktoś"} chce dołączyć do ${project.name}`, `Rola: ${ROLE_LABELS[role.roleType]}${parsed.data.message ? ` · ${parsed.data.message.slice(0, 120)}` : ""}`, `/projects/${projectId}/applications`, { actorId: user.id, entityType: "project", entityId: projectId, emailPreference: "emailProjectApplications", emailCtaLabel: "Zobacz zgłoszenie", emailCtaLabelEn: "View application", titleEn: `${profileRows[0]?.username ?? "Someone"} wants to join ${project.name}`, bodyEn: `Role: ${ROLE_LABELS[role.roleType]}${parsed.data.message ? ` · ${parsed.data.message.slice(0, 120)}` : ""}` });
  await logEvent("project_application_sent", user.id, { projectId, roleId: role.id });
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function respondToApplication(applicationId: string, decision: "ACCEPTED" | "REJECTED") {
  const locale = await getRequestLocale();
  if (!uuidSchema.safeParse(applicationId).success || !decisionSchema.safeParse(decision).success) return { error: appMessage("Invalid data.", locale) };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: appMessage("You must be logged in.", locale) };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from applications where id = ${applicationId} for update`);
    const rows = await tx.select({ application: applications, project: projects, role: projectRoles })
      .from(applications)
      .innerJoin(projects, eq(projects.id, applications.projectId))
      .innerJoin(projectRoles, eq(projectRoles.id, applications.roleId))
      .where(eq(applications.id, applicationId)).limit(1);
    const row = rows[0];
    if (!row) return { error: appMessage("Application not found.", locale) } as const;
    if (row.project.ownerId !== user.id) return { error: appMessage("You do not have permission to do this.", locale) } as const;
    if (row.application.status !== "PENDING") return { error: appMessage("This application has already been reviewed.", locale) } as const;

    if (decision === "ACCEPTED") {
      await tx.execute(sql`select id from project_roles where id = ${row.role.id} for update`);
      const filledRows = await tx.select({ count: sql<number>`count(*)::int` }).from(projectMembers).where(eq(projectMembers.roleId, row.role.id));
      if ((filledRows[0]?.count ?? 0) >= row.role.slots) return { error: appMessage("This role has already been filled.", locale) } as const;
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
  await createNotification(row.application.applicantId, decision === "ACCEPTED" ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED", decision === "ACCEPTED" ? `Dołączasz do zespołu ${row.project.name}` : `Twoje zgłoszenie do ${row.project.name} nie zostało zaakceptowane.`, decision === "ACCEPTED" ? "Możecie teraz nawiązać kontakt i zacząć wspólnie budować." : undefined, `/projects/${row.project.id}`, { actorId: user.id, entityType: "project", entityId: row.project.id, emailPreference: "emailProjectAccepted", emailCtaLabel: "Zobacz projekt", emailCtaLabelEn: "View project", titleEn: decision === "ACCEPTED" ? `You are joining ${row.project.name}` : `Your application to ${row.project.name} was not accepted.`, bodyEn: decision === "ACCEPTED" ? "You can now exchange contact details and start building together." : null });
  revalidatePath(`/projects/${row.project.id}`);
  revalidatePath(`/projects/${row.project.id}/applications`);
  return { success: true };
}

export async function inviteToProject(projectId: string, inviteeId: string, roleId: string | undefined, message: string) {
  const locale = await getRequestLocale();
  const inviteInput = projectInviteSchema.safeParse({ projectId, inviteeId, roleId, message });
  if (!inviteInput.success) return { error: appMessage(inviteInput.error.issues[0]?.message, locale, "Invalid data.") };
  const validatedProjectId = inviteInput.data.projectId;
  const validatedInviteeId = inviteInput.data.inviteeId;
  const validatedRoleId = inviteInput.data.roleId;
  const validatedMessage = inviteInput.data.message ?? "";
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: appMessage("You must be logged in.", locale) };
  const rateError = await enforceUserRateLimit("action:project:invite", user.id, (await isNewAccount(user.id)) ? 10 : 30, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  if (validatedInviteeId === user.id) return { error: appMessage("You cannot invite yourself.", locale) };
  const inviteeRows = await db.select({ id: users.id, isSuspended: users.isSuspended, systemRole: users.systemRole, onboardingCompleted: profiles.onboardingCompleted })
    .from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, validatedInviteeId)).limit(1);
  const invitee = inviteeRows[0];
  if (!invitee || invitee.isSuspended || invitee.systemRole === "ADMIN" || !invitee.onboardingCompleted) return { error: appMessage("This person is not available.", locale) };

  const projectRows = await db.select().from(projects).where(and(eq(projects.id, validatedProjectId), eq(projects.entryType, "PROJECT"))).limit(1);
  const project = projectRows[0];
  if (!project) return { error: appMessage("Project not found.", locale) };
  if (project.ownerId !== user.id) return { error: appMessage("You do not have permission to do this.", locale) };
  if (await isBlockedEitherWay(user.id, validatedInviteeId)) return { error: appMessage("This person cannot be invited.", locale) };
  const existingMember = await db.select({ userId: projectMembers.userId }).from(projectMembers).where(and(eq(projectMembers.projectId, validatedProjectId), eq(projectMembers.userId, validatedInviteeId))).limit(1);
  if (existingMember.length) return { error: appMessage("This person is already a project member.", locale) };
  if (validatedRoleId) {
    const role = await db.select({ id: projectRoles.id, projectId: projectRoles.projectId }).from(projectRoles).where(eq(projectRoles.id, validatedRoleId)).limit(1);
    if (!role[0] || role[0].projectId !== validatedProjectId) return { error: appMessage("The selected role does not belong to this project.", locale) };
  }

  try {
    await db.insert(projectInvites).values({ projectId: validatedProjectId, roleId: validatedRoleId ?? null, inviterId: user.id, inviteeId: validatedInviteeId, message: validatedMessage || null });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: appMessage("This person already has a pending invitation to this project.", locale) };
    throw error;
  }
  await createNotification(validatedInviteeId, "PROJECT_INVITE", `Zaproszenie do ${project.name}`, validatedMessage || undefined, "/invitations", { actorId: user.id, entityType: "project", entityId: project.id, emailPreference: "emailProjectApplications", emailCtaLabel: "Zobacz zaproszenie", emailCtaLabelEn: "View invitation", titleEn: `Invitation to ${project.name}` });
  await logEvent("builder_invite_sent", user.id, { projectId: validatedProjectId, inviteeId: validatedInviteeId });
  revalidatePath(`/projects/${validatedProjectId}`);
  return { success: true };
}

export async function respondToProjectInvite(inviteId: string, decision: "ACCEPTED" | "REJECTED") {
  const locale = await getRequestLocale();
  if (!uuidSchema.safeParse(inviteId).success || !decisionSchema.safeParse(decision).success) return { error: appMessage("Invalid data.", locale) };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: appMessage("You must be logged in.", locale) };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from project_invites where id = ${inviteId} for update`);
    const rows = await tx.select({ invite: projectInvites, project: projects }).from(projectInvites).innerJoin(projects, eq(projects.id, projectInvites.projectId)).where(eq(projectInvites.id, inviteId)).limit(1);
    const row = rows[0];
    if (!row) return { error: appMessage("Invitation not found.", locale) } as const;
    if (row.invite.inviteeId !== user.id) return { error: appMessage("You do not have permission to do this.", locale) } as const;
    if (row.invite.status !== "PENDING") return { error: appMessage("This invitation has already been reviewed.", locale) } as const;
    if (await isBlockedEitherWay(user.id, row.project.ownerId)) return { error: appMessage("This invitation cannot be accepted.", locale) } as const;

    let roleType = null as typeof profiles.$inferSelect.role;
    if (decision === "ACCEPTED") {
      if (row.invite.roleId) {
        await tx.execute(sql`select id from project_roles where id = ${row.invite.roleId} for update`);
        const roleRows = await tx.select().from(projectRoles).where(eq(projectRoles.id, row.invite.roleId)).limit(1);
        const role = roleRows[0];
        if (!role || role.projectId !== row.project.id) return { error: appMessage("This role is no longer available.", locale) } as const;
        const filledRows = await tx.select({ count: sql<number>`count(*)::int` }).from(projectMembers).where(eq(projectMembers.roleId, role.id));
        if ((filledRows[0]?.count ?? 0) >= role.slots) return { error: appMessage("This role has already been filled.", locale) } as const;
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
  await createNotification(row.project.ownerId, decision === "ACCEPTED" ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED", decision === "ACCEPTED" ? `Zaproszenie do ${row.project.name} zostało zaakceptowane!` : `Zaproszenie do ${row.project.name} zostało odrzucone.`, undefined, `/projects/${row.project.id}`, { titleEn: decision === "ACCEPTED" ? `Invitation to ${row.project.name} was accepted!` : `Invitation to ${row.project.name} was declined.` });
  revalidatePath(`/projects/${row.project.id}`);
  return { success: true };
}


export async function removeProjectMember(projectId: string, memberId: string) {
  if (!uuidSchema.safeParse(projectId).success || !uuidSchema.safeParse(memberId).success) return { error: "Invalid data." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:project:remove-member", user.id, 40, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from projects where id = ${projectId} for update`);
    const projectRows = await tx.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT"))).limit(1);
    const project = projectRows[0];
    if (!project) return { error: "Project not found." } as const;
    if (project.ownerId !== user.id) return { error: "Only the project owner can remove team members." } as const;
    if (memberId === user.id) return { error: "The project owner cannot remove themselves." } as const;

    const memberRows = await tx.select({ member: projectMembers, username: profiles.username })
      .from(projectMembers)
      .leftJoin(profiles, eq(profiles.userId, projectMembers.userId))
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)))
      .limit(1);
    const row = memberRows[0];
    if (!row || row.member.isOwner) return { error: "This person is not a project member." } as const;

    await tx.update(projectWorkspaceTasks)
      .set({ assigneeId: null, updatedAt: new Date() })
      .where(and(eq(projectWorkspaceTasks.projectId, projectId), eq(projectWorkspaceTasks.assigneeId, memberId)));
    await tx.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)));
    await tx.insert(projectWorkspaceActivity).values({
      projectId,
      actorId: user.id,
      type: "MEMBER_REMOVED",
      body: `${row.username ?? "Team member"} is no longer a project member.`,
    });

    return { project, username: row.username ?? "Team member" } as const;
  });

  if ("error" in outcome) return outcome;
  await createNotification(
    memberId,
    "PROJECT_MEMBER_REMOVED",
    `You are no longer a member of ${outcome.project.name}`,
    "Your access to the private workspace and new team content has ended.",
    `/projects/${projectId}`,
    { actorId: user.id, entityType: "project", entityId: projectId, titleEn: `You are no longer a member of ${outcome.project.name}`, bodyEn: "Your access to the private workspace and new team content has ended." },
  );
  await logEvent("project_member_removed", user.id, { projectId, memberId });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/manage`);
  revalidatePath(`/projects/${projectId}/workspace`);
  revalidatePath("/my-projects");
  return { success: true };
}

export async function leaveProject(projectId: string) {
  if (!uuidSchema.safeParse(projectId).success) return { error: "Invalid project." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:project:leave", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from projects where id = ${projectId} for update`);
    const projectRows = await tx.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT"))).limit(1);
    const project = projectRows[0];
    if (!project) return { error: "Project not found." } as const;
    if (project.ownerId === user.id) return { error: "The project owner cannot leave the project. Manage it from My Projects instead." } as const;

    const memberRows = await tx.select({ member: projectMembers, username: profiles.username })
      .from(projectMembers)
      .leftJoin(profiles, eq(profiles.userId, projectMembers.userId))
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)))
      .limit(1);
    const row = memberRows[0];
    if (!row) return { error: "You are not a member of this project." } as const;

    await tx.update(projectWorkspaceTasks)
      .set({ assigneeId: null, updatedAt: new Date() })
      .where(and(eq(projectWorkspaceTasks.projectId, projectId), eq(projectWorkspaceTasks.assigneeId, user.id)));
    await tx.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)));
    await tx.insert(projectWorkspaceActivity).values({
      projectId,
      actorId: user.id,
      type: "MEMBER_LEFT",
      body: `${row.username ?? "Team member"} left the project.`,
    });

    return { project, username: row.username ?? "Team member" } as const;
  });

  if ("error" in outcome) return outcome;
  await createNotification(
    outcome.project.ownerId,
    "PROJECT_MEMBER_LEFT",
    `${outcome.username} left ${outcome.project.name}`,
    "The team spot is available again if it was tied to an open role.",
    `/projects/${projectId}/manage`,
    { actorId: user.id, entityType: "project", entityId: projectId, titleEn: `${outcome.username} left ${outcome.project.name}`, bodyEn: "The team spot is available again if it was tied to an open role." },
  );
  await logEvent("project_member_left", user.id, { projectId });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/manage`);
  revalidatePath(`/projects/${projectId}/workspace`);
  revalidatePath("/my-projects");
  return { success: true };
}

export async function updateProjectEnglishContent(projectId: string, input: z.infer<typeof projectContentUpdateSchema>) {
  const locale = await getRequestLocale();
  if (!uuidSchema.safeParse(projectId).success) return { error: appMessage("Invalid project.", locale) };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: appMessage("You must be logged in.", locale) };

  const parsed = projectContentUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: appMessage(parsed.error.issues[0]?.message, locale, "Check the fields and try again.") };

  const row = await db.select({ ownerId: projects.ownerId }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT"))).limit(1);
  if (!row[0]) return { error: appMessage("Project not found.", locale) };
  if (row[0].ownerId !== user.id) return { error: appMessage("You do not have permission to do this.", locale) };

  const data = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(projects).set({
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      goal: data.goal,
      ownerContribution: data.ownerContribution || null,
      outcome: data.outcome || null,
      fundingUse: data.fundingUse || null,
      updatedAt: new Date(),
    }).where(eq(projects.id, projectId));

    for (const role of data.roles) {
      await tx.update(projectRoles).set({ description: role.description || null })
        .where(and(eq(projectRoles.id, role.id), eq(projectRoles.projectId, projectId)));
    }

    for (const update of data.updates) {
      await tx.update(projectUpdates).set({ body: update.body })
        .where(and(eq(projectUpdates.id, update.id), eq(projectUpdates.projectId, projectId)));
    }
  });

  await logEvent("project_english_content_updated", user.id, { projectId });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/manage`);
  revalidatePath(`/p/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/my-projects");
  revalidatePath("/");
  return { success: true };
}

export async function updateProjectInternationalSettings(projectId: string, input: z.infer<typeof projectInternationalSettingsSchema>) {
  const locale = await getRequestLocale();
  if (!uuidSchema.safeParse(projectId).success) return { error: appMessage("Invalid project.", locale) };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: appMessage("You must be logged in.", locale) };
  const parsed = projectInternationalSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: appMessage(parsed.error.issues[0]?.message, locale, "Check the fields and try again.") };
  const row = await db.select({ ownerId: projects.ownerId }).from(projects).where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT"))).limit(1);
  if (!row[0]) return { error: appMessage("Project not found.", locale) };
  if (row[0].ownerId !== user.id) return { error: appMessage("You do not have permission to do this.", locale) };
  const data = parsed.data;
  await db.update(projects).set({
    projectLanguage: data.projectLanguage,
    country: data.country || null,
    marketScope: data.marketScope,
    needs: data.needs,
    fundingStage: data.needs.includes("FUNDING") ? data.fundingStage ?? null : null,
    fundingAmount: data.needs.includes("FUNDING") ? data.fundingAmount || null : null,
    fundingUse: data.needs.includes("FUNDING") ? data.fundingUse || null : null,
    pitchDeckUrl: data.needs.includes("FUNDING") ? data.pitchDeckUrl || null : null,
    updatedAt: new Date(),
  }).where(eq(projects.id, projectId));
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/manage`);
  revalidatePath(`/p/${projectId}`);
  revalidatePath("/projects");
  return { success: true };
}

export async function refreshProjectRecruitmentAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  if (!uuidSchema.safeParse(projectId).success) return;

  const user = await getVerifiedCurrentUser();
  if (!user) return;

  const rateError = await enforceUserRateLimit("action:project:refresh-recruitment", user.id, 20, 24 * 60 * 60);
  if (rateError) return;

  const projectRows = await db
    .select({ id: projects.id, ownerId: projects.ownerId, lifecycleStatus: projects.lifecycleStatus })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT")))
    .limit(1);
  const project = projectRows[0];

  if (!project || project.ownerId !== user.id || project.lifecycleStatus !== "ACTIVE") return;

  const roleRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projectRoles)
    .where(eq(projectRoles.projectId, projectId));
  if ((roleRows[0]?.count ?? 0) === 0) return;

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
  await logEvent("project_recruitment_refreshed", user.id, { projectId });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/p/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/my-projects");
  revalidatePath("/dashboard");
}

export async function respondToCollaborationCheck(projectId: string, memberId: string, answer: "STARTED" | "NOT_STARTED" | "ENDED") {
  const locale = await getRequestLocale();
  if (!uuidSchema.safeParse(projectId).success || !uuidSchema.safeParse(memberId).success) return { error: appMessage("Invalid collaboration.", locale) };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: appMessage("You must be logged in.", locale) };
  const rateError = await enforceUserRateLimit("action:collaboration:check", user.id, 30, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select project_id from project_members where project_id = ${projectId} and user_id = ${memberId} for update`);
    const rows = await tx.select({ member: projectMembers, project: projects })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)))
      .limit(1);
    const row = rows[0];
    if (!row || row.member.isOwner) return { error: appMessage("Collaboration not found.", locale) } as const;

    const isOwner = row.project.ownerId === user.id;
    const isMember = row.member.userId === user.id;
    if (!isOwner && !isMember) return { error: appMessage("You cannot update this collaboration.", locale) } as const;

    const now = new Date();
    const checkOpensAt = row.member.joinedAt.getTime() + 7 * 24 * 60 * 60 * 1000;
    if (row.member.collaborationStatus === "PENDING" && now.getTime() < checkOpensAt) {
      return { error: appMessage("Collaboration confirmation opens 7 days after the person joins the project.", locale) } as const;
    }
    if (answer === "NOT_STARTED") {
      await tx.update(projectMembers).set({ collaborationStatus: "NOT_STARTED", collaborationEndedAt: now, collaborationCheckRequestedAt: now })
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)));
      return { row, confirmed: false, status: "NOT_STARTED" as const };
    }
    if (answer === "ENDED") {
      await tx.update(projectMembers).set({ collaborationStatus: "ENDED", collaborationEndedAt: now, collaborationCheckRequestedAt: now })
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)));
      return { row, confirmed: false, status: "ENDED" as const };
    }

    const nextMemberConfirmedAt = isMember ? now : row.member.memberConfirmedAt;
    const nextOwnerConfirmedAt = isOwner ? now : row.member.ownerConfirmedAt;
    const confirmed = Boolean(nextMemberConfirmedAt && nextOwnerConfirmedAt);
    await tx.update(projectMembers).set({
      memberConfirmedAt: nextMemberConfirmedAt,
      ownerConfirmedAt: nextOwnerConfirmedAt,
      collaborationStatus: confirmed ? "CONFIRMED" : "PENDING",
      collaborationCheckRequestedAt: now,
      collaborationEndedAt: null,
    }).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)));
    return { row, confirmed, status: confirmed ? "CONFIRMED" as const : "PENDING" as const };
  });

  if ("error" in outcome) return outcome;
  const otherUserId = user.id === outcome.row.project.ownerId ? memberId : outcome.row.project.ownerId;
  await logEvent("collaboration_check_submitted", user.id, { projectId, memberId, answer, status: outcome.status });

  if (outcome.confirmed) {
    await logEvent("collaboration_confirmed", user.id, { projectId, memberId });
    await createNotification(otherUserId, "COLLABORATION_CONFIRMED", `Potwierdzono współpracę przy ${outcome.row.project.name}`, "Ta współpraca jest teraz widoczna w Twojej historii i reputacji w BuildCrew.", `/projects/${projectId}`, { actorId: user.id, entityType: "project", entityId: projectId });
  } else if (answer === "STARTED") {
    await createNotification(otherUserId, "COLLABORATION_CHECK", `Potwierdź współpracę przy ${outcome.row.project.name}`, "Druga strona potwierdziła rozpoczęcie współpracy. Potwierdź ją, aby pojawiła się na obu profilach.", `/projects/${projectId}`, { actorId: user.id, entityType: "project", entityId: projectId });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/manage`);
  revalidatePath("/my-projects");
  revalidatePath("/network");
  revalidatePath(`/builders/${memberId}`);
  revalidatePath(`/builders/${outcome.row.project.ownerId}`);
  return { success: true, status: outcome.status };
}
