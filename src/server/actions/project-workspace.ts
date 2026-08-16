"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  projectWorkspaceActivity,
  projectWorkspaceLinks,
  projectWorkspaceMessageReactions,
  projectWorkspaceMessages,
  projectWorkspaceReads,
  projectWorkspaces,
  projectWorkspaceTasks,
  projects,
} from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit } from "@/lib/security";
import {
  uuidSchema,
  workspaceLinkSchema,
  workspaceMessageSchema,
  workspaceOverviewSchema,
  workspaceReactionSchema,
  workspaceTaskSchema,
  workspaceTaskStatusSchema,
  workspaceTaskUpdateSchema,
} from "@/lib/validations";
import { canAccessProjectWorkspace } from "@/server/data/project-workspace";
import { createNotification } from "@/server/services/notifications";

export type WorkspaceActionResult = { success?: boolean; error?: string };

async function requireMember(projectId: string) {
  if (!uuidSchema.safeParse(projectId).success) return { error: "Nieprawidłowy projekt." } as const;
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." } as const;
  if (!(await canAccessProjectWorkspace(projectId, user.id))) {
    return { error: "Ta przestrzeń jest dostępna tylko dla członków projektu." } as const;
  }
  return { user } as const;
}

async function projectInfo(projectId: string) {
  const rows = await db
    .select({ ownerId: projects.ownerId, name: projects.name })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return rows[0] ?? null;
}

async function requireOwner(projectId: string) {
  const access = await requireMember(projectId);
  if ("error" in access) return access;
  const project = await projectInfo(projectId);
  if (!project || project.ownerId !== access.user.id) return { error: "Tę zmianę może wykonać tylko twórca projektu." } as const;
  return { user: access.user, project } as const;
}

async function addActivity(
  projectId: string,
  actorId: string,
  type: (typeof projectWorkspaceActivity.$inferInsert)["type"],
  body: string,
) {
  await db.insert(projectWorkspaceActivity).values({ projectId, actorId, type, body });
}

function refresh(projectId: string) {
  revalidatePath(`/projects/${projectId}/workspace`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/my-projects");
  revalidatePath("/", "layout");
}

function parseMentions(body: string) {
  const matches = body.matchAll(/@([\p{L}\p{N}._-]{2,24})/gu);
  return Array.from(new Set(Array.from(matches, (match) => match[1]).filter(Boolean)));
}

async function notifyMessageRecipients(input: {
  projectId: string;
  projectName: string;
  senderId: string;
  body: string;
  replyToSenderId?: string | null;
}) {
  const alreadyNotified = new Set<string>();

  if (input.replyToSenderId && input.replyToSenderId !== input.senderId) {
    alreadyNotified.add(input.replyToSenderId);
    await createNotification(
      input.replyToSenderId,
      "WORKSPACE_REPLY",
      `Odpowiedź w ${input.projectName}`,
      input.body.slice(0, 180),
      `/projects/${input.projectId}/workspace`,
      {
        actorId: input.senderId,
        entityType: "project_workspace",
        entityId: input.projectId,
        emailPreference: "emailWorkspace",
        emailCtaLabel: "Otwórz rozmowę",
        emailCtaLabelEn: "Open conversation",
        titleEn: `Reply in ${input.projectName}`,
        bodyEn: input.body.slice(0, 180),
        emailTitleEn: `Reply in ${input.projectName}`,
        emailIntro: "Masz nową odpowiedź w prywatnym workspace projektu. Otwórz BuildCrew, żeby zobaczyć treść.",
        emailIntroEn: "You have a new reply in a private project workspace. Open BuildCrew to read it.",
      },
    );
  }

  const mentionNames = parseMentions(input.body);
  if (!mentionNames.length) return;

  const mentionedProfiles = await db
    .select({ userId: profiles.userId, username: profiles.username })
    .from(profiles)
    .where(inArray(profiles.username, mentionNames));

  for (const mentioned of mentionedProfiles) {
    if (mentioned.userId === input.senderId || alreadyNotified.has(mentioned.userId)) continue;
    if (!(await canAccessProjectWorkspace(input.projectId, mentioned.userId))) continue;
    alreadyNotified.add(mentioned.userId);
    await createNotification(
      mentioned.userId,
      "WORKSPACE_MENTION",
      `Wspomniano Cię w ${input.projectName}`,
      input.body.slice(0, 180),
      `/projects/${input.projectId}/workspace`,
      {
        actorId: input.senderId,
        entityType: "project_workspace",
        entityId: input.projectId,
        emailPreference: "emailWorkspace",
        emailCtaLabel: "Otwórz rozmowę",
        emailCtaLabelEn: "Open conversation",
        titleEn: `You were mentioned in ${input.projectName}`,
        bodyEn: input.body.slice(0, 180),
        emailTitleEn: `You were mentioned in ${input.projectName}`,
        emailIntro: "Ktoś oznaczył Cię w prywatnym workspace projektu. Otwórz BuildCrew, żeby zobaczyć treść.",
        emailIntroEn: "Someone mentioned you in a private project workspace. Open BuildCrew to read it.",
      },
    );
  }
}

export async function sendProjectWorkspaceMessage(
  projectId: string,
  body: string,
  replyToId?: string,
): Promise<WorkspaceActionResult> {
  const access = await requireMember(projectId);
  if ("error" in access) return access;
  const parsed = workspaceMessageSchema.safeParse({ body });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź wiadomość." };

  const rateError = await enforceUserRateLimit("action:workspace:message", access.user.id, 120, 60 * 60);
  if (rateError) return { error: rateError };

  let replyToSenderId: string | null = null;
  let normalizedReplyToId: string | null = null;
  if (replyToId) {
    if (!uuidSchema.safeParse(replyToId).success) return { error: "Nieprawidłowa wiadomość, na którą odpowiadasz." };
    const replyRows = await db
      .select({ id: projectWorkspaceMessages.id, projectId: projectWorkspaceMessages.projectId, senderId: projectWorkspaceMessages.senderId })
      .from(projectWorkspaceMessages)
      .where(eq(projectWorkspaceMessages.id, replyToId))
      .limit(1);
    const reply = replyRows[0];
    if (!reply || reply.projectId !== projectId) return { error: "Wiadomość, na którą odpowiadasz, nie istnieje w tym workspace." };
    normalizedReplyToId = reply.id;
    replyToSenderId = reply.senderId;
  }

  await db.insert(projectWorkspaceMessages).values({
    projectId,
    senderId: access.user.id,
    body: parsed.data.body,
    replyToId: normalizedReplyToId,
  });

  await db
    .insert(projectWorkspaceReads)
    .values({ projectId, userId: access.user.id, lastReadAt: new Date(), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [projectWorkspaceReads.projectId, projectWorkspaceReads.userId],
      set: { lastReadAt: new Date(), updatedAt: new Date() },
    });

  const project = await projectInfo(projectId);
  if (project) {
    await notifyMessageRecipients({
      projectId,
      projectName: project.name,
      senderId: access.user.id,
      body: parsed.data.body,
      replyToSenderId,
    });
  }

  refresh(projectId);
  return { success: true };
}

export async function editProjectWorkspaceMessage(messageId: string, body: string): Promise<WorkspaceActionResult> {
  if (!uuidSchema.safeParse(messageId).success) return { error: "Nieprawidłowa wiadomość." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const parsed = workspaceMessageSchema.safeParse({ body });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź wiadomość." };

  const rows = await db.select().from(projectWorkspaceMessages).where(eq(projectWorkspaceMessages.id, messageId)).limit(1);
  const message = rows[0];
  if (!message || message.deletedAt) return { error: "Wiadomość nie istnieje." };
  if (message.senderId !== user.id) return { error: "Możesz edytować tylko własne wiadomości." };
  if (!(await canAccessProjectWorkspace(message.projectId, user.id))) return { error: "Brak uprawnień." };

  await db
    .update(projectWorkspaceMessages)
    .set({ body: parsed.data.body, editedAt: new Date() })
    .where(eq(projectWorkspaceMessages.id, messageId));
  await addActivity(message.projectId, user.id, "MESSAGE_EDITED", "Edytowano wiadomość w rozmowie zespołu.");
  refresh(message.projectId);
  return { success: true };
}

export async function deleteProjectWorkspaceMessage(messageId: string): Promise<WorkspaceActionResult> {
  if (!uuidSchema.safeParse(messageId).success) return { error: "Nieprawidłowa wiadomość." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const rows = await db.select().from(projectWorkspaceMessages).where(eq(projectWorkspaceMessages.id, messageId)).limit(1);
  const message = rows[0];
  if (!message) return { error: "Wiadomość nie istnieje." };
  if (!(await canAccessProjectWorkspace(message.projectId, user.id))) return { error: "Brak uprawnień." };

  const project = await projectInfo(message.projectId);
  if (message.senderId !== user.id && project?.ownerId !== user.id) return { error: "Możesz usunąć tylko własną wiadomość." };

  await db
    .update(projectWorkspaceMessages)
    .set({ body: "", deletedAt: new Date(), editedAt: null, pinnedAt: null, pinnedBy: null })
    .where(eq(projectWorkspaceMessages.id, messageId));
  refresh(message.projectId);
  return { success: true };
}

export async function setProjectWorkspaceMessagePinned(messageId: string, pinned: boolean): Promise<WorkspaceActionResult> {
  if (!uuidSchema.safeParse(messageId).success) return { error: "Nieprawidłowa wiadomość." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rows = await db.select().from(projectWorkspaceMessages).where(eq(projectWorkspaceMessages.id, messageId)).limit(1);
  const message = rows[0];
  if (!message || message.deletedAt) return { error: "Wiadomość nie istnieje." };
  const owner = await requireOwner(message.projectId);
  if ("error" in owner) return owner;

  await db
    .update(projectWorkspaceMessages)
    .set({ pinnedAt: pinned ? new Date() : null, pinnedBy: pinned ? user.id : null })
    .where(eq(projectWorkspaceMessages.id, messageId));
  await addActivity(
    message.projectId,
    user.id,
    pinned ? "MESSAGE_PINNED" : "MESSAGE_UNPINNED",
    pinned ? "Przypięto ważną wiadomość." : "Odpięto wiadomość.",
  );
  refresh(message.projectId);
  return { success: true };
}

export async function toggleProjectWorkspaceReaction(
  messageId: string,
  reaction: "CHECK" | "LIKE",
): Promise<WorkspaceActionResult> {
  if (!uuidSchema.safeParse(messageId).success) return { error: "Nieprawidłowa wiadomość." };
  const parsedReaction = workspaceReactionSchema.safeParse(reaction);
  if (!parsedReaction.success) return { error: "Nieprawidłowa reakcja." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const rows = await db
    .select({ projectId: projectWorkspaceMessages.projectId, deletedAt: projectWorkspaceMessages.deletedAt })
    .from(projectWorkspaceMessages)
    .where(eq(projectWorkspaceMessages.id, messageId))
    .limit(1);
  const message = rows[0];
  if (!message || message.deletedAt) return { error: "Wiadomość nie istnieje." };
  if (!(await canAccessProjectWorkspace(message.projectId, user.id))) return { error: "Brak uprawnień." };

  const existingRows = await db
    .select({ reaction: projectWorkspaceMessageReactions.reaction })
    .from(projectWorkspaceMessageReactions)
    .where(and(
      eq(projectWorkspaceMessageReactions.messageId, messageId),
      eq(projectWorkspaceMessageReactions.userId, user.id),
      eq(projectWorkspaceMessageReactions.reaction, parsedReaction.data),
    ))
    .limit(1);

  if (existingRows[0]) {
    await db.delete(projectWorkspaceMessageReactions).where(and(
      eq(projectWorkspaceMessageReactions.messageId, messageId),
      eq(projectWorkspaceMessageReactions.userId, user.id),
      eq(projectWorkspaceMessageReactions.reaction, parsedReaction.data),
    ));
  } else {
    await db.insert(projectWorkspaceMessageReactions).values({ messageId, userId: user.id, reaction: parsedReaction.data });
  }
  refresh(message.projectId);
  return { success: true };
}

export async function markProjectWorkspaceRead(projectId: string): Promise<WorkspaceActionResult> {
  const access = await requireMember(projectId);
  if ("error" in access) return access;
  const now = new Date();
  await db
    .insert(projectWorkspaceReads)
    .values({ projectId, userId: access.user.id, lastReadAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [projectWorkspaceReads.projectId, projectWorkspaceReads.userId],
      set: { lastReadAt: now, updatedAt: now },
    });
  revalidatePath("/my-projects");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateProjectWorkspaceOverview(
  projectId: string,
  input: {
    currentFocus?: string;
    milestoneTitle?: string;
    milestoneDescription?: string;
    milestoneDueAt?: string;
    milestoneStatus?: "PLANNED" | "DOING" | "DONE";
    milestoneCompleted?: boolean;
  },
): Promise<WorkspaceActionResult> {
  const access = await requireOwner(projectId);
  if ("error" in access) return access;
  const parsed = workspaceOverviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź dane workspace." };

  const beforeRows = await db.select().from(projectWorkspaces).where(eq(projectWorkspaces.projectId, projectId)).limit(1);
  const before = beforeRows[0];
  const dueAt = parsed.data.milestoneDueAt ? new Date(`${parsed.data.milestoneDueAt}T12:00:00.000Z`) : null;
  const milestoneStatus = parsed.data.milestoneStatus ?? (parsed.data.milestoneCompleted ? "DONE" : "DOING");
  const milestoneCompleted = milestoneStatus === "DONE";

  await db.insert(projectWorkspaces).values({
    projectId,
    currentFocus: parsed.data.currentFocus || null,
    milestoneTitle: parsed.data.milestoneTitle || null,
    milestoneDescription: parsed.data.milestoneDescription || null,
    milestoneDueAt: dueAt,
    milestoneStatus,
    milestoneCompleted,
    updatedBy: access.user.id,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: projectWorkspaces.projectId,
    set: {
      currentFocus: parsed.data.currentFocus || null,
      milestoneTitle: parsed.data.milestoneTitle || null,
      milestoneDescription: parsed.data.milestoneDescription || null,
      milestoneDueAt: dueAt,
      milestoneStatus,
      milestoneCompleted,
      updatedBy: access.user.id,
      updatedAt: new Date(),
    },
  });

  if ((before?.currentFocus ?? "") !== (parsed.data.currentFocus ?? "")) {
    await addActivity(projectId, access.user.id, "FOCUS_UPDATED", parsed.data.currentFocus ? `Ustawiono fokus: ${parsed.data.currentFocus}` : "Wyczyszczono aktualny fokus projektu.");
  }
  if (
    (before?.milestoneTitle ?? "") !== (parsed.data.milestoneTitle ?? "") ||
    (before?.milestoneDescription ?? "") !== (parsed.data.milestoneDescription ?? "") ||
    (before?.milestoneStatus ?? "DOING") !== milestoneStatus ||
    (before?.milestoneDueAt?.toISOString().slice(0, 10) ?? "") !== (parsed.data.milestoneDueAt ?? "")
  ) {
    await addActivity(projectId, access.user.id, "MILESTONE_UPDATED", milestoneCompleted ? "Oznaczono najbliższy milestone jako ukończony." : "Zaktualizowano najbliższy milestone.");
  }

  refresh(projectId);
  return { success: true };
}

export async function addProjectWorkspaceTask(
  projectId: string,
  input: { title: string; description?: string; assigneeId?: string; dueAt?: string; sourceMessageId?: string },
): Promise<WorkspaceActionResult> {
  const access = await requireMember(projectId);
  if ("error" in access) return access;
  const parsed = workspaceTaskSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź zadanie." };

  const rateError = await enforceUserRateLimit("action:workspace:task", access.user.id, 80, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const assigneeId = parsed.data.assigneeId || null;
  if (assigneeId && !(await canAccessProjectWorkspace(projectId, assigneeId))) return { error: "Wybrana osoba nie należy do projektu." };

  const sourceMessageId = parsed.data.sourceMessageId || null;
  if (sourceMessageId) {
    const sourceRows = await db.select({ projectId: projectWorkspaceMessages.projectId }).from(projectWorkspaceMessages).where(eq(projectWorkspaceMessages.id, sourceMessageId)).limit(1);
    if (!sourceRows[0] || sourceRows[0].projectId !== projectId) return { error: "Wiadomość źródłowa nie należy do tego projektu." };
  }

  const dueAt = parsed.data.dueAt ? new Date(`${parsed.data.dueAt}T12:00:00.000Z`) : null;
  await db.insert(projectWorkspaceTasks).values({
    projectId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    assigneeId,
    dueAt,
    sourceMessageId,
    createdBy: access.user.id,
  });
  await addActivity(projectId, access.user.id, "TASK_CREATED", `Dodano zadanie: ${parsed.data.title}`);

  if (assigneeId && assigneeId !== access.user.id) {
    const project = await projectInfo(projectId);
    await createNotification(
      assigneeId,
      "WORKSPACE_TASK_ASSIGNED",
      `Przypisano Ci zadanie${project ? ` w ${project.name}` : ""}`,
      parsed.data.title,
      `/projects/${projectId}/workspace`,
      {
        actorId: access.user.id,
        entityType: "project_workspace_task",
        entityId: projectId,
        emailPreference: "emailWorkspace",
        emailCtaLabel: "Otwórz zadania",
        emailCtaLabelEn: "Open tasks",
        titleEn: `A task was assigned to you${project ? ` in ${project.name}` : ""}`,
        bodyEn: parsed.data.title,
      },
    );
  }

  refresh(projectId);
  return { success: true };
}

export async function updateProjectWorkspaceTask(
  taskId: string,
  input: { title?: string; description?: string; assigneeId?: string; dueAt?: string; status?: "TODO" | "DOING" | "DONE" },
): Promise<WorkspaceActionResult> {
  if (!uuidSchema.safeParse(taskId).success) return { error: "Nieprawidłowe zadanie." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const parsed = workspaceTaskUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź zadanie." };

  const rows = await db.select().from(projectWorkspaceTasks).where(eq(projectWorkspaceTasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task) return { error: "Zadanie nie istnieje." };
  if (!(await canAccessProjectWorkspace(task.projectId, user.id))) return { error: "Brak uprawnień." };

  const assigneeId = parsed.data.assigneeId === undefined ? task.assigneeId : (parsed.data.assigneeId || null);
  if (assigneeId && !(await canAccessProjectWorkspace(task.projectId, assigneeId))) return { error: "Wybrana osoba nie należy do projektu." };
  const dueAt = parsed.data.dueAt === undefined
    ? task.dueAt
    : parsed.data.dueAt
      ? new Date(`${parsed.data.dueAt}T12:00:00.000Z`)
      : null;

  await db.update(projectWorkspaceTasks).set({
    title: parsed.data.title ?? task.title,
    description: parsed.data.description === undefined ? task.description : (parsed.data.description || null),
    assigneeId,
    dueAt,
    status: parsed.data.status ?? task.status,
    updatedAt: new Date(),
  }).where(eq(projectWorkspaceTasks.id, taskId));

  await addActivity(task.projectId, user.id, "TASK_UPDATED", `Zaktualizowano zadanie „${parsed.data.title ?? task.title}”.`);

  if (assigneeId && assigneeId !== task.assigneeId && assigneeId !== user.id) {
    const project = await projectInfo(task.projectId);
    await createNotification(
      assigneeId,
      "WORKSPACE_TASK_ASSIGNED",
      `Przypisano Ci zadanie${project ? ` w ${project.name}` : ""}`,
      parsed.data.title ?? task.title,
      `/projects/${task.projectId}/workspace`,
      {
        actorId: user.id,
        entityType: "project_workspace_task",
        entityId: task.projectId,
        emailPreference: "emailWorkspace",
        emailCtaLabel: "Otwórz zadania",
        emailCtaLabelEn: "Open tasks",
        titleEn: `A task was assigned to you${project ? ` in ${project.name}` : ""}`,
        bodyEn: parsed.data.title ?? task.title,
      },
    );
  }

  refresh(task.projectId);
  return { success: true };
}

export async function updateProjectWorkspaceTaskStatus(
  taskId: string,
  status: "TODO" | "DOING" | "DONE",
): Promise<WorkspaceActionResult> {
  const parsedStatus = workspaceTaskStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { error: "Nieprawidłowy status zadania." };
  return updateProjectWorkspaceTask(taskId, { status: parsedStatus.data });
}

export async function deleteProjectWorkspaceTask(taskId: string): Promise<WorkspaceActionResult> {
  if (!uuidSchema.safeParse(taskId).success) return { error: "Nieprawidłowe zadanie." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const rows = await db.select().from(projectWorkspaceTasks).where(eq(projectWorkspaceTasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task) return { error: "Zadanie nie istnieje." };
  if (!(await canAccessProjectWorkspace(task.projectId, user.id))) return { error: "Brak uprawnień." };
  const project = await projectInfo(task.projectId);
  if (task.createdBy !== user.id && project?.ownerId !== user.id) return { error: "Brak uprawnień do usunięcia zadania." };

  await db.delete(projectWorkspaceTasks).where(eq(projectWorkspaceTasks.id, taskId));
  await addActivity(task.projectId, user.id, "TASK_DELETED", `Usunięto zadanie „${task.title}”.`);
  refresh(task.projectId);
  return { success: true };
}

export async function addProjectWorkspaceLink(
  projectId: string,
  input: { label: string; url: string; kind: "GITHUB" | "FIGMA" | "NOTION" | "DISCORD" | "DEMO" | "DOCS" | "OTHER" },
): Promise<WorkspaceActionResult> {
  const access = await requireMember(projectId);
  if ("error" in access) return access;
  const parsed = workspaceLinkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź link." };

  const rateError = await enforceUserRateLimit("action:workspace:link", access.user.id, 40, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  await db.insert(projectWorkspaceLinks).values({
    projectId,
    label: parsed.data.label,
    url: parsed.data.url,
    kind: parsed.data.kind,
    createdBy: access.user.id,
  });
  await addActivity(projectId, access.user.id, "LINK_ADDED", `Dodano link: ${parsed.data.label}`);
  refresh(projectId);
  return { success: true };
}

export async function deleteProjectWorkspaceLink(linkId: string): Promise<WorkspaceActionResult> {
  if (!uuidSchema.safeParse(linkId).success) return { error: "Nieprawidłowy link." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const rows = await db.select().from(projectWorkspaceLinks).where(eq(projectWorkspaceLinks.id, linkId)).limit(1);
  const link = rows[0];
  if (!link) return { error: "Link nie istnieje." };
  if (!(await canAccessProjectWorkspace(link.projectId, user.id))) return { error: "Brak uprawnień." };
  const project = await projectInfo(link.projectId);
  if (link.createdBy !== user.id && project?.ownerId !== user.id) return { error: "Brak uprawnień do usunięcia linku." };

  await db.delete(projectWorkspaceLinks).where(and(eq(projectWorkspaceLinks.id, linkId), eq(projectWorkspaceLinks.projectId, link.projectId)));
  await addActivity(link.projectId, user.id, "LINK_REMOVED", `Usunięto link „${link.label}”.`);
  refresh(link.projectId);
  return { success: true };
}
