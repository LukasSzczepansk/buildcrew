"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  projectWorkspaceActivity,
  projectWorkspaceLinks,
  projectWorkspaceMessages,
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
  workspaceTaskSchema,
  workspaceTaskStatusSchema,
} from "@/lib/validations";
import { canAccessProjectWorkspace } from "@/server/data/project-workspace";

export type WorkspaceActionResult = { success?: boolean; error?: string };

async function requireMember(projectId: string) {
  if (!uuidSchema.safeParse(projectId).success) return { error: "Nieprawidłowy projekt." } as const;
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." } as const;
  if (!(await canAccessProjectWorkspace(projectId, user.id))) return { error: "Ta przestrzeń jest dostępna tylko dla członków projektu." } as const;
  return { user } as const;
}

async function projectOwnerId(projectId: string) {
  const rows = await db.select({ ownerId: projects.ownerId }).from(projects).where(eq(projects.id, projectId)).limit(1);
  return rows[0]?.ownerId ?? null;
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
}

export async function sendProjectWorkspaceMessage(projectId: string, body: string): Promise<WorkspaceActionResult> {
  const access = await requireMember(projectId);
  if ("error" in access) return access;
  const parsed = workspaceMessageSchema.safeParse({ body });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź wiadomość." };

  const rateError = await enforceUserRateLimit("action:workspace:message", access.user.id, 120, 60 * 60);
  if (rateError) return { error: rateError };

  await db.insert(projectWorkspaceMessages).values({
    projectId,
    senderId: access.user.id,
    body: parsed.data.body,
  });
  refresh(projectId);
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

  const ownerId = await projectOwnerId(message.projectId);
  if (message.senderId !== user.id && ownerId !== user.id) return { error: "Możesz usunąć tylko własną wiadomość." };

  await db.delete(projectWorkspaceMessages).where(eq(projectWorkspaceMessages.id, messageId));
  refresh(message.projectId);
  return { success: true };
}

export async function updateProjectWorkspaceOverview(
  projectId: string,
  input: { currentFocus?: string; milestoneTitle?: string; milestoneDueAt?: string; milestoneCompleted?: boolean },
): Promise<WorkspaceActionResult> {
  const access = await requireMember(projectId);
  if ("error" in access) return access;
  const parsed = workspaceOverviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź dane workspace." };

  const beforeRows = await db.select().from(projectWorkspaces).where(eq(projectWorkspaces.projectId, projectId)).limit(1);
  const before = beforeRows[0];
  const dueAt = parsed.data.milestoneDueAt ? new Date(`${parsed.data.milestoneDueAt}T00:00:00.000Z`) : null;

  await db.insert(projectWorkspaces).values({
    projectId,
    currentFocus: parsed.data.currentFocus || null,
    milestoneTitle: parsed.data.milestoneTitle || null,
    milestoneDueAt: dueAt,
    milestoneCompleted: parsed.data.milestoneCompleted,
    updatedBy: access.user.id,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: projectWorkspaces.projectId,
    set: {
      currentFocus: parsed.data.currentFocus || null,
      milestoneTitle: parsed.data.milestoneTitle || null,
      milestoneDueAt: dueAt,
      milestoneCompleted: parsed.data.milestoneCompleted,
      updatedBy: access.user.id,
      updatedAt: new Date(),
    },
  });

  if ((before?.currentFocus ?? "") !== (parsed.data.currentFocus ?? "")) {
    await addActivity(projectId, access.user.id, "FOCUS_UPDATED", parsed.data.currentFocus ? "Zmieniono aktualny fokus projektu." : "Wyczyszczono aktualny fokus projektu.");
  }
  if (
    (before?.milestoneTitle ?? "") !== (parsed.data.milestoneTitle ?? "") ||
    Boolean(before?.milestoneCompleted) !== Boolean(parsed.data.milestoneCompleted) ||
    (before?.milestoneDueAt?.toISOString().slice(0, 10) ?? "") !== (parsed.data.milestoneDueAt ?? "")
  ) {
    await addActivity(projectId, access.user.id, "MILESTONE_UPDATED", parsed.data.milestoneCompleted ? "Oznaczono milestone jako ukończony." : "Zaktualizowano najbliższy milestone.");
  }

  refresh(projectId);
  return { success: true };
}

export async function addProjectWorkspaceTask(
  projectId: string,
  input: { title: string; assigneeId?: string },
): Promise<WorkspaceActionResult> {
  const access = await requireMember(projectId);
  if ("error" in access) return access;
  const parsed = workspaceTaskSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź zadanie." };

  const rateError = await enforceUserRateLimit("action:workspace:task", access.user.id, 80, 24 * 60 * 60);
  if (rateError) return { error: rateError };

  const assigneeId = parsed.data.assigneeId || null;
  if (assigneeId && !(await canAccessProjectWorkspace(projectId, assigneeId))) return { error: "Wybrana osoba nie należy do projektu." };

  await db.insert(projectWorkspaceTasks).values({
    projectId,
    title: parsed.data.title,
    assigneeId,
    createdBy: access.user.id,
  });
  await addActivity(projectId, access.user.id, "TASK_CREATED", `Dodano zadanie: ${parsed.data.title}`);
  refresh(projectId);
  return { success: true };
}

export async function updateProjectWorkspaceTaskStatus(
  taskId: string,
  status: "TODO" | "DOING" | "DONE",
): Promise<WorkspaceActionResult> {
  if (!uuidSchema.safeParse(taskId).success) return { error: "Nieprawidłowe zadanie." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const parsedStatus = workspaceTaskStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { error: "Nieprawidłowy status zadania." };

  const rows = await db.select().from(projectWorkspaceTasks).where(eq(projectWorkspaceTasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task) return { error: "Zadanie nie istnieje." };
  if (!(await canAccessProjectWorkspace(task.projectId, user.id))) return { error: "Brak uprawnień." };

  await db.update(projectWorkspaceTasks).set({ status: parsedStatus.data, updatedAt: new Date() }).where(eq(projectWorkspaceTasks.id, taskId));
  await addActivity(task.projectId, user.id, "TASK_STATUS_CHANGED", `Zmieniono status zadania „${task.title}”.`);
  refresh(task.projectId);
  return { success: true };
}

export async function deleteProjectWorkspaceTask(taskId: string): Promise<WorkspaceActionResult> {
  if (!uuidSchema.safeParse(taskId).success) return { error: "Nieprawidłowe zadanie." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const rows = await db.select().from(projectWorkspaceTasks).where(eq(projectWorkspaceTasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task) return { error: "Zadanie nie istnieje." };
  if (!(await canAccessProjectWorkspace(task.projectId, user.id))) return { error: "Brak uprawnień." };
  const ownerId = await projectOwnerId(task.projectId);
  if (task.createdBy !== user.id && ownerId !== user.id) return { error: "Brak uprawnień do usunięcia zadania." };

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
  const ownerId = await projectOwnerId(link.projectId);
  if (link.createdBy !== user.id && ownerId !== user.id) return { error: "Brak uprawnień do usunięcia linku." };

  await db.delete(projectWorkspaceLinks).where(and(eq(projectWorkspaceLinks.id, linkId), eq(projectWorkspaceLinks.projectId, link.projectId)));
  await addActivity(link.projectId, user.id, "LINK_REMOVED", `Usunięto link „${link.label}”.`);
  refresh(link.projectId);
  return { success: true };
}
