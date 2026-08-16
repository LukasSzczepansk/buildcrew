import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  projectMembers,
  projects,
  projectTechnologies,
  projectWorkspaceActivity,
  projectWorkspaceLinks,
  projectWorkspaceMessageReactions,
  projectWorkspaceMessages,
  projectWorkspaceReads,
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
    .select({
      id: projects.id,
      name: projects.name,
      tagline: projects.tagline,
      ownerId: projects.ownerId,
      stage: projects.stage,
      projectType: projects.projectType,
      commitment: projects.commitment,
    })
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

  const [profileRows, workspaceRows, messageRowsDesc, taskRows, linkRows, activityRows, technologyRows, readRows] = await Promise.all([
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
      .limit(150),
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
      .limit(80),
    db
      .select({ name: projectTechnologies.name })
      .from(projectTechnologies)
      .where(eq(projectTechnologies.projectId, projectId))
      .orderBy(asc(projectTechnologies.id)),
    db
      .select({ lastReadAt: projectWorkspaceReads.lastReadAt })
      .from(projectWorkspaceReads)
      .where(and(eq(projectWorkspaceReads.projectId, projectId), eq(projectWorkspaceReads.userId, viewerId)))
      .limit(1),
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

  const rawMessages = [...messageRowsDesc].reverse();
  const messageIds = rawMessages.map((message) => message.id);
  const reactionRows = messageIds.length
    ? await db
        .select()
        .from(projectWorkspaceMessageReactions)
        .where(inArray(projectWorkspaceMessageReactions.messageId, messageIds))
    : [];

  const reactionMap = new Map<string, { reaction: "CHECK" | "LIKE"; userId: string }[]>();
  for (const reaction of reactionRows) {
    const current = reactionMap.get(reaction.messageId) ?? [];
    current.push({ reaction: reaction.reaction, userId: reaction.userId });
    reactionMap.set(reaction.messageId, current);
  }

  const rawMessageMap = new Map(rawMessages.map((message) => [message.id, message]));
  const messages = rawMessages.map((message) => {
    const reply = message.replyToId ? rawMessageMap.get(message.replyToId) : null;
    return {
      ...message,
      sender: profileMap.get(message.senderId) ?? null,
      replyTo: reply ? {
        id: reply.id,
        senderId: reply.senderId,
        body: reply.deletedAt ? "Message deleted." : reply.body,
        deletedAt: reply.deletedAt,
        sender: profileMap.get(reply.senderId) ?? null,
      } : null,
      reactions: reactionMap.get(message.id) ?? [],
    };
  });

  const tasks = taskRows.map((task) => ({
    ...task,
    assignee: task.assigneeId ? profileMap.get(task.assigneeId) ?? null : null,
  }));

  const activity = activityRows.map((item) => ({
    ...item,
    actor: item.actorId ? profileMap.get(item.actorId) ?? null : null,
  }));

  const lastReadAt = readRows[0]?.lastReadAt ?? null;
  const unreadCount = rawMessages.filter((message) => {
    if (message.senderId === viewerId || message.deletedAt) return false;
    if (!lastReadAt) return true;
    return message.createdAt > lastReadAt;
  }).length;

  const pinnedMessages = messages.filter((message) => Boolean(message.pinnedAt) && !message.deletedAt).slice(-8).reverse();

  return {
    project,
    technologies: technologyRows.map((row) => row.name),
    workspace: workspaceRows[0] ?? null,
    members,
    messages,
    pinnedMessages,
    unreadCount,
    lastReadAt,
    tasks,
    links: linkRows,
    activity,
  };
}

export async function getWorkspaceSignalsForProjects(projectIds: string[], userId: string) {
  const validProjectIds = projectIds.filter(isUuid);
  if (!validProjectIds.length || !isUuid(userId)) return new Map<string, { unreadMessages: number; assignedTasks: number }>();

  const [readRows, messageRows, taskRows] = await Promise.all([
    db
      .select({ projectId: projectWorkspaceReads.projectId, lastReadAt: projectWorkspaceReads.lastReadAt })
      .from(projectWorkspaceReads)
      .where(and(inArray(projectWorkspaceReads.projectId, validProjectIds), eq(projectWorkspaceReads.userId, userId))),
    db
      .select({
        projectId: projectWorkspaceMessages.projectId,
        senderId: projectWorkspaceMessages.senderId,
        createdAt: projectWorkspaceMessages.createdAt,
        deletedAt: projectWorkspaceMessages.deletedAt,
      })
      .from(projectWorkspaceMessages)
      .where(inArray(projectWorkspaceMessages.projectId, validProjectIds)),
    db
      .select({ projectId: projectWorkspaceTasks.projectId, assigneeId: projectWorkspaceTasks.assigneeId, status: projectWorkspaceTasks.status })
      .from(projectWorkspaceTasks)
      .where(inArray(projectWorkspaceTasks.projectId, validProjectIds)),
  ]);

  const readMap = new Map(readRows.map((row) => [row.projectId, row.lastReadAt]));
  const result = new Map<string, { unreadMessages: number; assignedTasks: number }>();
  for (const projectId of validProjectIds) result.set(projectId, { unreadMessages: 0, assignedTasks: 0 });

  for (const message of messageRows) {
    if (message.senderId === userId || message.deletedAt) continue;
    const lastReadAt = readMap.get(message.projectId);
    if (!lastReadAt || message.createdAt > lastReadAt) {
      const current = result.get(message.projectId);
      if (current) current.unreadMessages += 1;
    }
  }

  for (const task of taskRows) {
    if (task.assigneeId !== userId || task.status === "DONE") continue;
    const current = result.get(task.projectId);
    if (current) current.assignedTasks += 1;
  }

  return result;
}
