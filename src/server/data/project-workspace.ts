import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  projectMembers,
  projects,
  projectWorkspaceActivity,
  projectWorkspaceLinks,
  projectWorkspaceMessages,
  projectWorkspaces,
  projectWorkspaceTasks,
  users,
} from "@/db/schema";
import { isUuid } from "@/lib/security";

export async function canAccessProjectWorkspace(projectId: string, userId: string) {
  if (!isUuid(projectId) || !isUuid(userId)) return false;

  const projectRows = await db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT")))
    .limit(1);
  const project = projectRows[0];
  if (!project) return false;
  if (project.ownerId === userId) return true;

  const memberRows = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
  return memberRows.some((member) => member.userId === userId);
}

export async function getProjectWorkspace(projectId: string, viewerId: string) {
  if (!isUuid(projectId) || !isUuid(viewerId)) return null;

  const projectRows = await db
    .select({ id: projects.id, name: projects.name, tagline: projects.tagline, ownerId: projects.ownerId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.entryType, "PROJECT")))
    .limit(1);
  const project = projectRows[0];
  if (!project) return null;

  const memberRows = await db
    .select({
      userId: projectMembers.userId,
      roleType: projectMembers.roleType,
      isOwner: projectMembers.isOwner,
      joinedAt: projectMembers.joinedAt,
    })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));

  const memberIds = Array.from(new Set([project.ownerId, ...memberRows.map((row) => row.userId)]));
  if (!memberIds.includes(viewerId)) return null;

  const [profileRows, workspaceRows, messageRowsDesc, taskRows, linkRows, activityRows] = await Promise.all([
    db
      .select({
        userId: profiles.userId,
        username: profiles.username,
        role: profiles.role,
        lastActiveAt: users.lastActiveAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(inArray(profiles.userId, memberIds)),
    db.select().from(projectWorkspaces).where(eq(projectWorkspaces.projectId, projectId)).limit(1),
    db
      .select()
      .from(projectWorkspaceMessages)
      .where(eq(projectWorkspaceMessages.projectId, projectId))
      .orderBy(desc(projectWorkspaceMessages.createdAt))
      .limit(100),
    db
      .select()
      .from(projectWorkspaceTasks)
      .where(eq(projectWorkspaceTasks.projectId, projectId))
      .orderBy(asc(projectWorkspaceTasks.status), asc(projectWorkspaceTasks.createdAt)),
    db
      .select()
      .from(projectWorkspaceLinks)
      .where(eq(projectWorkspaceLinks.projectId, projectId))
      .orderBy(asc(projectWorkspaceLinks.createdAt)),
    db
      .select()
      .from(projectWorkspaceActivity)
      .where(eq(projectWorkspaceActivity.projectId, projectId))
      .orderBy(desc(projectWorkspaceActivity.createdAt))
      .limit(50),
  ]);

  const profileMap = new Map(profileRows.map((profile) => [profile.userId, {
    ...profile,
    lastActiveAt: profile.lastActiveAt ?? profile.lastLoginAt,
  }]));

  const members = memberIds.map((userId) => {
    const relation = memberRows.find((row) => row.userId === userId);
    return {
      userId,
      isOwner: userId === project.ownerId || relation?.isOwner === true,
      roleType: relation?.roleType ?? null,
      joinedAt: relation?.joinedAt ?? null,
      profile: profileMap.get(userId) ?? null,
    };
  });

  const messages = [...messageRowsDesc].reverse().map((message) => ({
    ...message,
    sender: profileMap.get(message.senderId) ?? null,
  }));

  const tasks = taskRows.map((task) => ({
    ...task,
    assignee: task.assigneeId ? profileMap.get(task.assigneeId) ?? null : null,
  }));

  const activity = activityRows.map((item) => ({
    ...item,
    actor: item.actorId ? profileMap.get(item.actorId) ?? null : null,
  }));

  return {
    project,
    workspace: workspaceRows[0] ?? null,
    members,
    messages,
    tasks,
    links: linkRows,
    activity,
  };
}
