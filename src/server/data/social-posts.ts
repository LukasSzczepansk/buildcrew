import "server-only";

import { and, asc, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  blocks,
  follows,
  profiles,
  projectFollows,
  projects,
  socialPostComments,
  socialPostLikes,
  socialPostSaves,
  socialPosts,
  users,
} from "@/db/schema";
import { isUuid } from "@/lib/security";

const activePostWhere = () => and(
  eq(socialPosts.isActive, true),
  eq(users.isSuspended, false),
  or(isNull(socialPosts.expiresAt), gt(socialPosts.expiresAt, new Date())),
);

async function hydrateViewerState<T extends { id: string; authorId: string }>(rows: T[], viewerId?: string) {
  if (!viewerId || !isUuid(viewerId) || rows.length === 0) {
    return rows.map((row) => ({ ...row, viewerLiked: false, viewerSaved: false }));
  }

  const postIds = rows.map((row) => row.id);
  const [blockedRows, likedRows, savedRows] = await Promise.all([
    db.select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId }).from(blocks)
      .where(sql`${blocks.blockerId} = ${viewerId} or ${blocks.blockedId} = ${viewerId}`),
    db.select({ postId: socialPostLikes.postId }).from(socialPostLikes)
      .where(and(eq(socialPostLikes.userId, viewerId), inArray(socialPostLikes.postId, postIds))),
    db.select({ postId: socialPostSaves.postId }).from(socialPostSaves)
      .where(and(eq(socialPostSaves.userId, viewerId), inArray(socialPostSaves.postId, postIds))),
  ]);

  const blocked = new Set(blockedRows.map((row) => row.blockerId === viewerId ? row.blockedId : row.blockerId));
  const liked = new Set(likedRows.map((row) => row.postId));
  const saved = new Set(savedRows.map((row) => row.postId));
  return rows
    .filter((row) => !blocked.has(row.authorId))
    .map((row) => ({ ...row, viewerLiked: liked.has(row.id), viewerSaved: saved.has(row.id) }));
}

function postSelect() {
  return {
    id: socialPosts.id,
    kind: socialPosts.kind,
    body: socialPosts.body,
    projectId: socialPosts.projectId,
    createdAt: socialPosts.createdAt,
    authorId: socialPosts.authorId,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
    role: profiles.role,
    headline: profiles.headline,
    country: profiles.country,
    city: profiles.city,
    projectName: projects.name,
    projectTagline: projects.tagline,
    likeCount: sql<number>`(select count(*)::int from social_post_likes spl where spl.post_id = ${socialPosts.id})`,
    commentCount: sql<number>`(select count(*)::int from social_post_comments spc where spc.post_id = ${socialPosts.id})`,
  } as const;
}

export async function listRecentSocialPosts(viewerId?: string, limit = 12) {
  const rows = await db.select(postSelect())
    .from(socialPosts)
    .innerJoin(users, eq(users.id, socialPosts.authorId))
    .innerJoin(profiles, eq(profiles.userId, socialPosts.authorId))
    .leftJoin(projects, eq(projects.id, socialPosts.projectId))
    .where(activePostWhere())
    .orderBy(desc(socialPosts.createdAt))
    .limit(Math.max(1, Math.min(limit * 3, 80)));

  const hydrated = await hydrateViewerState(rows, viewerId);
  return hydrated.slice(0, limit);
}

export async function listFollowingSocialPosts(viewerId: string, limit = 20) {
  if (!isUuid(viewerId)) return [];
  const [peopleRows, projectRows] = await Promise.all([
    db.select({ id: follows.followingId }).from(follows).where(eq(follows.followerId, viewerId)),
    db.select({ id: projectFollows.projectId }).from(projectFollows).where(eq(projectFollows.userId, viewerId)),
  ]);
  const peopleIds = peopleRows.map((row) => row.id);
  const projectIds = projectRows.map((row) => row.id);
  if (peopleIds.length === 0 && projectIds.length === 0) return [];

  const audience = or(
    ...(peopleIds.length ? [inArray(socialPosts.authorId, peopleIds)] : []),
    ...(projectIds.length ? [inArray(socialPosts.projectId, projectIds)] : []),
  );
  if (!audience) return [];

  const rows = await db.select(postSelect())
    .from(socialPosts)
    .innerJoin(users, eq(users.id, socialPosts.authorId))
    .innerJoin(profiles, eq(profiles.userId, socialPosts.authorId))
    .leftJoin(projects, eq(projects.id, socialPosts.projectId))
    .where(and(activePostWhere(), audience))
    .orderBy(desc(socialPosts.createdAt))
    .limit(Math.max(1, Math.min(limit * 3, 80)));

  const hydrated = await hydrateViewerState(rows, viewerId);
  return hydrated.slice(0, limit);
}


export async function listSavedSocialPosts(viewerId: string, limit = 30) {
  if (!isUuid(viewerId)) return [];
  const rows = await db.select(postSelect())
    .from(socialPostSaves)
    .innerJoin(socialPosts, eq(socialPosts.id, socialPostSaves.postId))
    .innerJoin(users, eq(users.id, socialPosts.authorId))
    .innerJoin(profiles, eq(profiles.userId, socialPosts.authorId))
    .leftJoin(projects, eq(projects.id, socialPosts.projectId))
    .where(and(eq(socialPostSaves.userId, viewerId), activePostWhere()))
    .orderBy(desc(socialPostSaves.createdAt))
    .limit(Math.max(1, Math.min(limit, 60)));
  return hydrateViewerState(rows, viewerId);
}

export async function listSocialPostsForProject(projectId: string, viewerId?: string, limit = 12) {
  if (!isUuid(projectId)) return [];
  const rows = await db.select(postSelect())
    .from(socialPosts)
    .innerJoin(users, eq(users.id, socialPosts.authorId))
    .innerJoin(profiles, eq(profiles.userId, socialPosts.authorId))
    .leftJoin(projects, eq(projects.id, socialPosts.projectId))
    .where(and(activePostWhere(), eq(socialPosts.projectId, projectId)))
    .orderBy(desc(socialPosts.createdAt))
    .limit(Math.max(1, Math.min(limit, 30)));
  return hydrateViewerState(rows, viewerId);
}

export async function getSocialPostById(id: string) {
  if (!isUuid(id)) return null;
  const rows = await db.select({
    id: socialPosts.id,
    kind: socialPosts.kind,
    body: socialPosts.body,
    projectId: socialPosts.projectId,
    createdAt: socialPosts.createdAt,
    expiresAt: socialPosts.expiresAt,
    isActive: socialPosts.isActive,
    authorId: socialPosts.authorId,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
    role: profiles.role,
    headline: profiles.headline,
    country: profiles.country,
    city: profiles.city,
    publicProfile: profiles.publicProfile,
    projectName: projects.name,
    projectTagline: projects.tagline,
    likeCount: sql<number>`(select count(*)::int from social_post_likes spl where spl.post_id = ${socialPosts.id})`,
    commentCount: sql<number>`(select count(*)::int from social_post_comments spc where spc.post_id = ${socialPosts.id})`,
  })
    .from(socialPosts)
    .innerJoin(users, eq(users.id, socialPosts.authorId))
    .innerJoin(profiles, eq(profiles.userId, socialPosts.authorId))
    .leftJoin(projects, eq(projects.id, socialPosts.projectId))
    .where(and(eq(socialPosts.id, id), eq(users.isSuspended, false)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listSocialPostComments(postId: string, limit = 40) {
  if (!isUuid(postId)) return [];
  return db.select({
    id: socialPostComments.id,
    body: socialPostComments.body,
    createdAt: socialPostComments.createdAt,
    authorId: socialPostComments.authorId,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
  })
    .from(socialPostComments)
    .innerJoin(users, eq(users.id, socialPostComments.authorId))
    .innerJoin(profiles, eq(profiles.userId, socialPostComments.authorId))
    .where(and(eq(socialPostComments.postId, postId), eq(users.isSuspended, false)))
    .orderBy(asc(socialPostComments.createdAt))
    .limit(Math.max(1, Math.min(limit, 80)));
}
