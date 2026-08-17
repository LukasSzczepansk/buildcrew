import "server-only";

import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  conversations,
  messages,
  notifications,
  profiles,
  projectCredits,
  projectFollows,
  projectMembers,
  projectUpdates,
  projectWorkspaceTasks,
  projects,
  users,
  type ProjectUpdateKind,
} from "@/db/schema";
import { isUuid } from "@/lib/security";

export const PROJECT_UPDATE_KIND_LABELS: Record<ProjectUpdateKind, string> = {
  PROGRESS: "Progress",
  ROLE: "Team",
  MILESTONE: "Milestone",
  LAUNCH: "Launch",
};

export async function getProjectFollowState(projectId: string, userId: string) {
  if (!isUuid(projectId) || !isUuid(userId)) return { following: false, followers: 0 };
  const [mine, countRows] = await Promise.all([
    db.select({ userId: projectFollows.userId }).from(projectFollows)
      .where(and(eq(projectFollows.projectId, projectId), eq(projectFollows.userId, userId))).limit(1),
    db.select({ count: sql<number>`count(*)::int` }).from(projectFollows).where(eq(projectFollows.projectId, projectId)),
  ]);
  return { following: Boolean(mine[0]), followers: Number(countRows[0]?.count ?? 0) };
}

export async function listProjectFollowerIds(projectId: string) {
  if (!isUuid(projectId)) return [];
  const rows = await db.select({ userId: projectFollows.userId }).from(projectFollows).where(eq(projectFollows.projectId, projectId));
  return rows.map((row) => row.userId);
}

export async function listProjectUpdates(projectId: string, limit = 12) {
  if (!isUuid(projectId)) return [];
  const rows = await db.select({
    id: projectUpdates.id,
    projectId: projectUpdates.projectId,
    authorId: projectUpdates.authorId,
    kind: projectUpdates.kind,
    body: projectUpdates.body,
    createdAt: projectUpdates.createdAt,
    username: profiles.username,
  })
    .from(projectUpdates)
    .leftJoin(profiles, eq(profiles.userId, projectUpdates.authorId))
    .where(eq(projectUpdates.projectId, projectId))
    .orderBy(desc(projectUpdates.createdAt))
    .limit(Math.max(1, Math.min(limit, 30)));
  return rows.map((row) => ({ ...row, username: row.username ?? "Project team" }));
}

export async function listFollowedProjectUpdates(userId: string, limit = 8) {
  if (!isUuid(userId)) return [];
  const followedRows = await db.select({ projectId: projectFollows.projectId })
    .from(projectFollows).where(eq(projectFollows.userId, userId));
  const projectIds = followedRows.map((row) => row.projectId);
  if (!projectIds.length) return [];

  return db.select({
    updateId: projectUpdates.id,
    projectId: projects.id,
    projectName: projects.name,
    projectTagline: projects.tagline,
    kind: projectUpdates.kind,
    body: projectUpdates.body,
    createdAt: projectUpdates.createdAt,
    authorUsername: profiles.username,
  })
    .from(projectUpdates)
    .innerJoin(projects, eq(projects.id, projectUpdates.projectId))
    .leftJoin(profiles, eq(profiles.userId, projectUpdates.authorId))
    .where(and(inArray(projectUpdates.projectId, projectIds), eq(projects.projectLanguage, "EN")))
    .orderBy(desc(projectUpdates.createdAt))
    .limit(Math.max(1, Math.min(limit, 20)));
}

export async function listRecentGlobalProjectUpdates(limit = 8) {
  return db.select({
    updateId: projectUpdates.id,
    projectId: projects.id,
    projectName: projects.name,
    projectTagline: projects.tagline,
    kind: projectUpdates.kind,
    body: projectUpdates.body,
    createdAt: projectUpdates.createdAt,
    authorUsername: profiles.username,
  })
    .from(projectUpdates)
    .innerJoin(projects, eq(projects.id, projectUpdates.projectId))
    .innerJoin(users, eq(users.id, projects.ownerId))
    .leftJoin(profiles, eq(profiles.userId, projectUpdates.authorId))
    .where(and(eq(projects.entryType, "PROJECT"), eq(projects.lifecycleStatus, "ACTIVE"), eq(projects.projectLanguage, "EN"), eq(users.isSuspended, false)))
    .orderBy(desc(projectUpdates.createdAt))
    .limit(Math.max(1, Math.min(limit, 20)));
}

export async function listProjectCredits(projectId: string) {
  if (!isUuid(projectId)) return [];
  return db.select().from(projectCredits).where(eq(projectCredits.projectId, projectId)).orderBy(desc(projectCredits.isOwner), projectCredits.creditedAt);
}

export async function listCreditsForUser(userId: string, limit = 12) {
  if (!isUuid(userId)) return [];
  return db.select({
    creditId: projectCredits.id,
    projectId: projectCredits.projectId,
    roleType: projectCredits.roleType,
    isOwner: projectCredits.isOwner,
    creditedAt: projectCredits.creditedAt,
    projectName: projects.name,
    tagline: projects.tagline,
    outcome: projects.outcome,
    completedAt: projects.completedAt,
    demoUrl: projects.demoUrl,
    repositoryUrl: projects.repositoryUrl,
  })
    .from(projectCredits)
    .innerJoin(projects, eq(projects.id, projectCredits.projectId))
    .where(and(eq(projectCredits.userId, userId), eq(projects.projectLanguage, "EN")))
    .orderBy(desc(projects.completedAt), desc(projectCredits.creditedAt))
    .limit(Math.max(1, Math.min(limit, 30)));
}

export async function getDashboardAttention(userId: string) {
  if (!isUuid(userId)) return { unreadMessages: 0, unreadNotifications: 0, pendingApplications: 0, assignedTasks: 0 };

  const ownedProjects = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.ownerId, userId), eq(projects.entryType, "PROJECT"), ne(projects.lifecycleStatus, "COMPLETED")));
  const ownedIds = ownedProjects.map((row) => row.id);

  const [notificationRows, messageRows, applicationRows, taskRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
    db.select({ count: sql<number>`count(*)::int` }).from(messages)
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(and(
        ne(messages.senderId, userId),
        isNull(messages.readAt),
        or(eq(conversations.userLowId, userId), eq(conversations.userHighId, userId)),
      )),
    ownedIds.length
      ? db.select({ count: sql<number>`count(*)::int` }).from(applications)
          .where(and(inArray(applications.projectId, ownedIds), eq(applications.status, "PENDING")))
      : Promise.resolve([{ count: 0 }]),
    db.select({ count: sql<number>`count(*)::int` }).from(projectWorkspaceTasks)
      .where(and(eq(projectWorkspaceTasks.assigneeId, userId), ne(projectWorkspaceTasks.status, "DONE"))),
  ]);

  return {
    unreadMessages: Number(messageRows[0]?.count ?? 0),
    unreadNotifications: Number(notificationRows[0]?.count ?? 0),
    pendingApplications: Number(applicationRows[0]?.count ?? 0),
    assignedTasks: Number(taskRows[0]?.count ?? 0),
  };
}

export async function listRecentCollaborativeProjects(userId: string, limit = 4) {
  if (!isUuid(userId)) return [];
  const memberships = await db.select({ projectId: projectMembers.projectId })
    .from(projectMembers).where(eq(projectMembers.userId, userId));
  const ids = memberships.map((row) => row.projectId);
  if (!ids.length) return [];
  return db.select({
    id: projects.id,
    name: projects.name,
    tagline: projects.tagline,
    lifecycleStatus: projects.lifecycleStatus,
    stage: projects.stage,
    updatedAt: projects.updatedAt,
  }).from(projects).where(inArray(projects.id, ids)).orderBy(desc(projects.updatedAt)).limit(limit);
}

export async function listCompletedProjects(limit = 6) {
  return db.select({
    id: projects.id,
    name: projects.name,
    tagline: projects.tagline,
    outcome: projects.outcome,
    completedAt: projects.completedAt,
    ownerUsername: profiles.username,
    credits: sql<number>`(select count(*)::int from project_credits pc where pc.project_id = ${projects.id})`,
  })
    .from(projects)
    .innerJoin(profiles, eq(profiles.userId, projects.ownerId))
    .innerJoin(users, eq(users.id, projects.ownerId))
    .where(and(eq(projects.entryType, "PROJECT"), eq(projects.lifecycleStatus, "COMPLETED"), eq(users.isSuspended, false)))
    .orderBy(desc(projects.completedAt), desc(projects.updatedAt))
    .limit(Math.max(1, Math.min(limit, 20)));
}
