import "server-only";

import { and, desc, eq, inArray, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { blocks, follows, profiles, projectFollows, projectMembers, projects, users } from "@/db/schema";
import { isUuid } from "@/lib/security";

export async function listRecentTeamJoinActivity(viewerId: string, followingOnly = false, limit = 10) {
  if (!isUuid(viewerId)) return [];

  const blockRows = await db.select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId }).from(blocks)
    .where(sql`${blocks.blockerId} = ${viewerId} or ${blocks.blockedId} = ${viewerId}`);
  const blockedIds = blockRows.map((row) => row.blockerId === viewerId ? row.blockedId : row.blockerId);

  let audience: ReturnType<typeof or> = undefined;
  if (followingOnly) {
    const [peopleRows, projectRows] = await Promise.all([
      db.select({ id: follows.followingId }).from(follows).where(eq(follows.followerId, viewerId)),
      db.select({ id: projectFollows.projectId }).from(projectFollows).where(eq(projectFollows.userId, viewerId)),
    ]);
    const peopleIds = peopleRows.map((row) => row.id);
    const projectIds = projectRows.map((row) => row.id);
    if (!peopleIds.length && !projectIds.length) return [];
    audience = or(
      ...(peopleIds.length ? [inArray(projectMembers.userId, peopleIds)] : []),
      ...(projectIds.length ? [inArray(projectMembers.projectId, projectIds)] : []),
    );
  }

  return db.select({
    projectId: projects.id,
    projectName: projects.name,
    projectTagline: projects.tagline,
    userId: projectMembers.userId,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
    country: profiles.country,
    city: profiles.city,
    roleType: projectMembers.roleType,
    joinedAt: projectMembers.joinedAt,
  })
    .from(projectMembers)
    .innerJoin(projects, eq(projects.id, projectMembers.projectId))
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .innerJoin(profiles, eq(profiles.userId, projectMembers.userId))
    .where(and(
      eq(projectMembers.isOwner, false),
      eq(projects.entryType, "PROJECT"),
      eq(projects.lifecycleStatus, "ACTIVE"),
      eq(users.isSuspended, false),
      ...(blockedIds.length ? [notInArray(projectMembers.userId, blockedIds)] : []),
      ...(audience ? [audience] : []),
    ))
    .orderBy(desc(projectMembers.joinedAt))
    .limit(Math.max(1, Math.min(limit, 30)));
}
