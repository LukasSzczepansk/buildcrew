import "server-only";

import { and, asc, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  projectMembers,
  projects,
  showcaseComments,
  showcaseEntries,
  showcaseImages,
  showcaseReactions,
  users,
  type LaunchNeed,
  type ShowcaseCategory,
} from "@/db/schema";
import { isUuid, safeHttpUrl } from "@/lib/security";
import type { LaunchTab } from "@/lib/launches";

const PAGE_SIZE = 20;

function effectiveNeeds(row: { needs: LaunchNeed[]; lookingForCollaborators: boolean }) {
  if (row.needs.length) return row.needs;
  return row.lookingForCollaborators ? (["TEAM"] as LaunchNeed[]) : [];
}

function periodStart(tab: LaunchTab) {
  const now = new Date();
  if (tab === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (tab === "week") {
    const start = new Date(now);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return null;
}

const voteCountSql = sql<number>`(select count(*)::int from showcase_reactions sr where sr.entry_id = ${showcaseEntries.id} and sr.reaction = 'APPLAUSE')`;
const commentCountSql = sql<number>`(select count(*)::int from showcase_comments sc where sc.entry_id = ${showcaseEntries.id})`;

function launchSelect() {
  return {
    id: showcaseEntries.id,
    slug: showcaseEntries.slug,
    title: showcaseEntries.title,
    tagline: showcaseEntries.tagline,
    description: showcaseEntries.description,
    liveUrl: showcaseEntries.liveUrl,
    githubUrl: showcaseEntries.githubUrl,
    category: showcaseEntries.category,
    status: showcaseEntries.status,
    technologies: showcaseEntries.technologies,
    needs: showcaseEntries.needs,
    lookingForCollaborators: showcaseEntries.lookingForCollaborators,
    reviewStatus: showcaseEntries.reviewStatus,
    reviewedAt: showcaseEntries.reviewedAt,
    reviewNote: showcaseEntries.reviewNote,
    projectId: showcaseEntries.projectId,
    createdAt: showcaseEntries.createdAt,
    updatedAt: showcaseEntries.updatedAt,
    creatorId: showcaseEntries.creatorId,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
    creatorRole: profiles.role,
    creatorPublicProfile: profiles.publicProfile,
    projectName: projects.name,
    voteCount: voteCountSql,
    commentCount: commentCountSql,
  } as const;
}

export async function listLaunches(input: { tab: LaunchTab; viewerId?: string; page?: number; category?: ShowcaseCategory; need?: LaunchNeed }) {
  const page = Math.max(1, Math.min(input.page ?? 1, 200));
  const start = periodStart(input.tab);
  const conditions = [eq(users.isSuspended, false), eq(showcaseEntries.reviewStatus, "APPROVED")];
  if (start) conditions.push(gte(showcaseEntries.createdAt, start));
  if (input.category) conditions.push(eq(showcaseEntries.category, input.category));
  if (input.need) conditions.push(sql`${input.need} = any(${showcaseEntries.needs})` as unknown as ReturnType<typeof eq>);

  const order = input.tab === "new"
    ? [desc(showcaseEntries.createdAt)]
    : [desc(voteCountSql), desc(showcaseEntries.createdAt)];

  const rows = await db.select(launchSelect())
    .from(showcaseEntries)
    .innerJoin(users, eq(users.id, showcaseEntries.creatorId))
    .innerJoin(profiles, eq(profiles.userId, showcaseEntries.creatorId))
    .leftJoin(projects, eq(projects.id, showcaseEntries.projectId))
    .where(and(...conditions))
    .orderBy(...order)
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  const hasMore = rows.length > PAGE_SIZE;
  const visible = rows.slice(0, PAGE_SIZE);
  if (!visible.length) return { items: [], page, hasMore: false };
  const ids = visible.map((row) => row.id);
  const projectIds = visible.map((row) => row.projectId).filter((value): value is string => Boolean(value));

  const [imageRows, viewerVotes, memberCounts] = await Promise.all([
    db.select({ id: showcaseImages.id, entryId: showcaseImages.entryId, sortOrder: showcaseImages.sortOrder, width: showcaseImages.width, height: showcaseImages.height })
      .from(showcaseImages).where(inArray(showcaseImages.entryId, ids)).orderBy(asc(showcaseImages.sortOrder)),
    input.viewerId && isUuid(input.viewerId)
      ? db.select({ entryId: showcaseReactions.entryId }).from(showcaseReactions)
          .where(and(inArray(showcaseReactions.entryId, ids), eq(showcaseReactions.userId, input.viewerId), eq(showcaseReactions.reaction, "APPLAUSE")))
      : Promise.resolve([]),
    projectIds.length
      ? db.select({ projectId: projectMembers.projectId, count: sql<number>`count(*)::int` }).from(projectMembers)
          .where(inArray(projectMembers.projectId, projectIds)).groupBy(projectMembers.projectId)
      : Promise.resolve([]),
  ]);

  const firstImage = new Map<string, (typeof imageRows)[number]>();
  for (const image of imageRows) if (!firstImage.has(image.entryId)) firstImage.set(image.entryId, image);
  const voted = new Set(viewerVotes.map((row) => row.entryId));
  const members = new Map(memberCounts.map((row) => [row.projectId, row.count]));

  return {
    items: visible.map((row) => ({
      ...row,
      slug: row.slug || row.id,
      liveUrl: safeHttpUrl(row.liveUrl),
      githubUrl: safeHttpUrl(row.githubUrl),
      needs: effectiveNeeds(row),
      coverImage: firstImage.get(row.id) ?? null,
      viewerVoted: voted.has(row.id),
      creatorCount: row.projectId ? Math.max(1, members.get(row.projectId) ?? 1) : 1,
    })),
    page,
    hasMore,
  };
}

export async function getLaunchBySlug(slugOrId: string, viewerId?: string, allowUnapproved = false) {
  const where = isUuid(slugOrId) ? eq(showcaseEntries.id, slugOrId) : eq(showcaseEntries.slug, slugOrId);
  const visibility = allowUnapproved
    ? undefined
    : viewerId && isUuid(viewerId)
      ? or(eq(showcaseEntries.reviewStatus, "APPROVED"), eq(showcaseEntries.creatorId, viewerId))
      : eq(showcaseEntries.reviewStatus, "APPROVED");
  const rows = await db.select(launchSelect())
    .from(showcaseEntries)
    .innerJoin(users, eq(users.id, showcaseEntries.creatorId))
    .innerJoin(profiles, eq(profiles.userId, showcaseEntries.creatorId))
    .leftJoin(projects, eq(projects.id, showcaseEntries.projectId))
    .where(and(where, eq(users.isSuspended, false), visibility)).limit(1);
  const row = rows[0];
  if (!row) return null;

  const [images, comments, voteRows, teamRows] = await Promise.all([
    db.select({ id: showcaseImages.id, width: showcaseImages.width, height: showcaseImages.height, sortOrder: showcaseImages.sortOrder })
      .from(showcaseImages).where(eq(showcaseImages.entryId, row.id)).orderBy(asc(showcaseImages.sortOrder)),
    db.select({
      id: showcaseComments.id,
      parentId: showcaseComments.parentId,
      body: showcaseComments.body,
      createdAt: showcaseComments.createdAt,
      authorId: showcaseComments.authorId,
      username: profiles.username,
      avatarEmoji: profiles.avatarEmoji,
      publicProfile: profiles.publicProfile,
    }).from(showcaseComments)
      .innerJoin(users, eq(users.id, showcaseComments.authorId))
      .innerJoin(profiles, eq(profiles.userId, showcaseComments.authorId))
      .where(and(eq(showcaseComments.entryId, row.id), eq(users.isSuspended, false)))
      .orderBy(asc(showcaseComments.createdAt)).limit(120),
    db.select({ userId: showcaseReactions.userId }).from(showcaseReactions)
      .where(and(eq(showcaseReactions.entryId, row.id), eq(showcaseReactions.reaction, "APPLAUSE"))),
    row.projectId
      ? db.select({ userId: profiles.userId, username: profiles.username, avatarEmoji: profiles.avatarEmoji, role: profiles.role, publicProfile: profiles.publicProfile })
          .from(projectMembers).innerJoin(profiles, eq(profiles.userId, projectMembers.userId)).innerJoin(users, eq(users.id, projectMembers.userId))
          .where(and(eq(projectMembers.projectId, row.projectId), eq(users.isSuspended, false)))
      : Promise.resolve([]),
  ]);

  const creator = { userId: row.creatorId, username: row.username, avatarEmoji: row.avatarEmoji, role: row.creatorRole, publicProfile: row.creatorPublicProfile };
  const team = teamRows.length ? teamRows : [creator];
  if (!team.some((member) => member.userId === row.creatorId)) team.unshift(creator);

  return {
    ...row,
    slug: row.slug || row.id,
    liveUrl: safeHttpUrl(row.liveUrl),
    githubUrl: safeHttpUrl(row.githubUrl),
    needs: effectiveNeeds(row),
    images,
    comments,
    voteCount: voteRows.length,
    viewerVoted: Boolean(viewerId && voteRows.some((vote) => vote.userId === viewerId)),
    team,
  };
}

export async function getLaunchImage(imageId: string, viewerId?: string, allowUnapproved = false) {
  if (!isUuid(imageId)) return null;
  const visibility = allowUnapproved
    ? undefined
    : viewerId && isUuid(viewerId)
      ? or(eq(showcaseEntries.reviewStatus, "APPROVED"), eq(showcaseEntries.creatorId, viewerId))
      : eq(showcaseEntries.reviewStatus, "APPROVED");
  const rows = await db.select({
    id: showcaseImages.id,
    mimeType: showcaseImages.mimeType,
    imageBase64: showcaseImages.imageBase64,
    reviewStatus: showcaseEntries.reviewStatus,
  })
    .from(showcaseImages)
    .innerJoin(showcaseEntries, eq(showcaseEntries.id, showcaseImages.entryId))
    .where(and(eq(showcaseImages.id, imageId), visibility))
    .limit(1);
  return rows[0] ?? null;
}

export async function listLaunchProjectOptions(userId: string) {
  if (!isUuid(userId)) return [];
  return db.select({
    id: projects.id,
    ownerId: projects.ownerId,
    name: projects.name,
    tagline: projects.tagline,
    description: projects.description,
    technologies: projects.interests,
    demoUrl: projects.demoUrl,
    repositoryUrl: projects.repositoryUrl,
  }).from(projects)
    .leftJoin(projectMembers, and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId)))
    .where(and(eq(projects.lifecycleStatus, "ACTIVE"), or(eq(projects.ownerId, userId), eq(projectMembers.userId, userId))))
    .orderBy(desc(projects.updatedAt)).limit(40);
}

export async function listLaunchesForUser(userId: string, limit = 6) {
  if (!isUuid(userId)) return [];
  const rows = await db.select({
    id: showcaseEntries.id,
    slug: showcaseEntries.slug,
    title: showcaseEntries.title,
    tagline: showcaseEntries.tagline,
    category: showcaseEntries.category,
    createdAt: showcaseEntries.createdAt,
    voteCount: voteCountSql,
    commentCount: commentCountSql,
  }).from(showcaseEntries).where(and(eq(showcaseEntries.creatorId, userId), eq(showcaseEntries.reviewStatus, "APPROVED"))).orderBy(desc(showcaseEntries.createdAt)).limit(Math.max(1, Math.min(limit, 20)));
  if (!rows.length) return [];
  const images = await db.select({ id: showcaseImages.id, entryId: showcaseImages.entryId, sortOrder: showcaseImages.sortOrder })
    .from(showcaseImages).where(inArray(showcaseImages.entryId, rows.map((row) => row.id))).orderBy(asc(showcaseImages.sortOrder));
  const covers = new Map<string, string>();
  for (const image of images) if (!covers.has(image.entryId)) covers.set(image.entryId, image.id);
  return rows.map((row) => ({ ...row, slug: row.slug || row.id, coverImageId: covers.get(row.id) ?? null }));
}

export async function listHomepageLaunches(limit = 3) {
  const result = await listLaunches({ tab: "week", page: 1 });
  if (result.items.length) return result.items.slice(0, limit);
  const fallback = await listLaunches({ tab: "new", page: 1 });
  return fallback.items.slice(0, limit);
}



export async function listPendingLaunchesForAdmin(limit = 30) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const rows = await db.select({
    id: showcaseEntries.id,
    slug: showcaseEntries.slug,
    title: showcaseEntries.title,
    tagline: showcaseEntries.tagline,
    description: showcaseEntries.description,
    category: showcaseEntries.category,
    status: showcaseEntries.status,
    technologies: showcaseEntries.technologies,
    needs: showcaseEntries.needs,
    liveUrl: showcaseEntries.liveUrl,
    githubUrl: showcaseEntries.githubUrl,
    createdAt: showcaseEntries.createdAt,
    creatorId: showcaseEntries.creatorId,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
    coverImageId: sql<string | null>`(
      select si.id::text
      from showcase_images si
      where si.entry_id = ${showcaseEntries.id}
      order by si.sort_order asc
      limit 1
    )`,
  })
    .from(showcaseEntries)
    .innerJoin(users, eq(users.id, showcaseEntries.creatorId))
    .innerJoin(profiles, eq(profiles.userId, showcaseEntries.creatorId))
    .where(and(eq(showcaseEntries.reviewStatus, "PENDING"), eq(users.isSuspended, false)))
    .orderBy(asc(showcaseEntries.createdAt))
    .limit(safeLimit);

  return rows.map((row) => ({
    ...row,
    slug: row.slug || row.id,
    liveUrl: safeHttpUrl(row.liveUrl),
    githubUrl: safeHttpUrl(row.githubUrl),
  }));
}

export async function listLaunchesForSitemap(limit = 500) {
  return db.select({ id: showcaseEntries.id, slug: showcaseEntries.slug, updatedAt: showcaseEntries.updatedAt })
    .from(showcaseEntries).where(eq(showcaseEntries.reviewStatus, "APPROVED")).orderBy(desc(showcaseEntries.updatedAt)).limit(Math.max(1, Math.min(limit, 1000)));
}
