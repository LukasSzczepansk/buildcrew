import "server-only";

import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  collaborationEndorsements,
  follows,
  friendships,
  profiles,
  projectMembers,
  projects,
  users,
  type CollaborationEndorsementStrength,
} from "@/db/schema";
import { computeMatch } from "@/lib/matching";
import { isOpenToOpportunities } from "@/lib/opportunities";
import { isUuid } from "@/lib/security";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";

export const ENDORSEMENT_STRENGTH_LABELS: Record<CollaborationEndorsementStrength, string> = {
  DELIVERY: "Delivery",
  COMMUNICATION: "Communication",
  TECHNICAL: "Technical skills",
  PRODUCT: "Product thinking",
  DESIGN: "Design",
  RELIABILITY: "Reliability",
};

export async function getFollowState(viewerId: string, targetUserId: string) {
  if (!isUuid(viewerId) || !isUuid(targetUserId) || viewerId === targetUserId) return false;
  const row = await db.select({ followerId: follows.followerId }).from(follows)
    .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, targetUserId))).limit(1);
  return Boolean(row[0]);
}

export async function getNetworkCounts(userId: string) {
  if (!isUuid(userId)) return { followers: 0, following: 0, collaborators: 0, endorsements: 0 };
  const [followersRows, followingRows, collaboratorRows, endorsementRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(follows).where(eq(follows.followingId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(follows).where(eq(follows.followerId, userId)),
    listCollaborators(userId),
    db.select({ count: sql<number>`count(*)::int` }).from(collaborationEndorsements).where(eq(collaborationEndorsements.revieweeId, userId)),
  ]);
  return {
    followers: followersRows[0]?.count ?? 0,
    following: followingRows[0]?.count ?? 0,
    collaborators: collaboratorRows.length,
    endorsements: endorsementRows[0]?.count ?? 0,
  };
}

async function enrichFollowRows(rows: { userId: string; since: Date }[]) {
  const result = await Promise.all(rows.map(async (row) => {
    const profile = await getProfileByUserId(row.userId);
    return profile ? { profile, since: row.since } : null;
  }));
  return result.filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function listFollowing(userId: string) {
  if (!isUuid(userId)) return [];
  const rows = await db.select({ userId: follows.followingId, since: follows.createdAt })
    .from(follows).where(eq(follows.followerId, userId)).orderBy(desc(follows.createdAt));
  return enrichFollowRows(rows);
}

export async function listFollowers(userId: string) {
  if (!isUuid(userId)) return [];
  const rows = await db.select({ userId: follows.followerId, since: follows.createdAt })
    .from(follows).where(eq(follows.followingId, userId)).orderBy(desc(follows.createdAt));
  return enrichFollowRows(rows);
}

export async function listCollaborators(userId: string) {
  if (!isUuid(userId)) return [];
  const myMemberships = await db.select({ projectId: projectMembers.projectId, isOwner: projectMembers.isOwner, collaborationStatus: projectMembers.collaborationStatus })
    .from(projectMembers).where(eq(projectMembers.userId, userId));
  const projectIds = myMemberships.map((row) => row.projectId);
  if (!projectIds.length) return [];

  const [memberRows, projectRows] = await Promise.all([
    db.select({ projectId: projectMembers.projectId, userId: projectMembers.userId, isOwner: projectMembers.isOwner, collaborationStatus: projectMembers.collaborationStatus })
      .from(projectMembers).where(inArray(projectMembers.projectId, projectIds)),
    db.select({ id: projects.id, ownerId: projects.ownerId, name: projects.name, updatedAt: projects.updatedAt })
      .from(projects).where(and(inArray(projects.id, projectIds), eq(projects.entryType, "PROJECT"))),
  ]);

  const myMap = new Map(myMemberships.map((row) => [row.projectId, row]));
  const byUser = new Map<string, { projectIds: Set<string>; latestAt: Date; latestProject: { id: string; name: string } | null }>();
  for (const project of projectRows) {
    const mine = myMap.get(project.id);
    if (!mine) continue;
    const collaborators = project.ownerId === userId
      ? memberRows.filter((row) => row.projectId === project.id && !row.isOwner && row.collaborationStatus === "CONFIRMED").map((row) => row.userId)
      : mine.collaborationStatus === "CONFIRMED" ? [project.ownerId] : [];
    for (const otherId of collaborators) {
      if (otherId === userId) continue;
      const current = byUser.get(otherId) ?? { projectIds: new Set<string>(), latestAt: project.updatedAt, latestProject: null };
      current.projectIds.add(project.id);
      if (!current.latestProject || project.updatedAt >= current.latestAt) {
        current.latestAt = project.updatedAt;
        current.latestProject = { id: project.id, name: project.name };
      }
      byUser.set(otherId, current);
    }
  }

  const result = await Promise.all([...byUser.entries()].map(async ([otherId, value]) => {
    const profile = await getProfileByUserId(otherId);
    return profile ? { profile, sharedProjects: value.projectIds.size, latestProject: value.latestProject, lastCollaboratedAt: value.latestAt } : null;
  }));
  return result.filter((item): item is NonNullable<typeof item> => Boolean(item)).sort((a, b) => b.lastCollaboratedAt.getTime() - a.lastCollaboratedAt.getTime());
}

export async function getCollaborationContext(viewerId: string, targetUserId: string) {
  if (!isUuid(viewerId) || !isUuid(targetUserId) || viewerId === targetUserId) {
    return { sharedProjects: [], existingEndorsements: [], summary: [] as { key: CollaborationEndorsementStrength; label: string; count: number }[] };
  }
  const [mine, theirs, endorsements] = await Promise.all([
    db.select({ projectId: projectMembers.projectId, isOwner: projectMembers.isOwner, collaborationStatus: projectMembers.collaborationStatus }).from(projectMembers).where(eq(projectMembers.userId, viewerId)),
    db.select({ projectId: projectMembers.projectId, isOwner: projectMembers.isOwner, collaborationStatus: projectMembers.collaborationStatus }).from(projectMembers).where(eq(projectMembers.userId, targetUserId)),
    db.select().from(collaborationEndorsements).where(eq(collaborationEndorsements.revieweeId, targetUserId)),
  ]);
  const targetMap = new Map(theirs.map((row) => [row.projectId, row]));
  const candidateIds = mine.map((row) => row.projectId).filter((id) => targetMap.has(id));
  const candidateProjects = candidateIds.length
    ? await db.select({ id: projects.id, name: projects.name, ownerId: projects.ownerId }).from(projects).where(and(inArray(projects.id, candidateIds), eq(projects.entryType, "PROJECT")))
    : [];
  const mineMap = new Map(mine.map((row) => [row.projectId, row]));
  const sharedProjects = candidateProjects.filter((project) => {
    const myMembership = mineMap.get(project.id);
    const theirMembership = targetMap.get(project.id);
    if (!myMembership || !theirMembership) return false;
    if (project.ownerId === viewerId) return theirMembership.collaborationStatus === "CONFIRMED";
    if (project.ownerId === targetUserId) return myMembership.collaborationStatus === "CONFIRMED";
    return false;
  }).map(({ id, name }) => ({ id, name }));
  const sharedIds = sharedProjects.map((project) => project.id);
  const existingEndorsements = endorsements.filter((item) => item.reviewerId === viewerId && sharedIds.includes(item.projectId));
  const counts = new Map<CollaborationEndorsementStrength, number>();
  for (const endorsement of endorsements) for (const strength of endorsement.strengths) counts.set(strength, (counts.get(strength) ?? 0) + 1);
  const summary = [...counts.entries()].map(([key, count]) => ({ key, label: ENDORSEMENT_STRENGTH_LABELS[key], count })).sort((a, b) => b.count - a.count);
  return { sharedProjects, existingEndorsements, summary };
}

export async function listNetworkSuggestions(userId: string, limit = 8) {
  const me = await getProfileByUserId(userId);
  if (!me) return [];
  const [builders, followingRows, friendshipRows] = await Promise.all([
    listBuilderProfiles(userId),
    db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, userId)),
    db.select().from(friendships).where(or(eq(friendships.userLowId, userId), eq(friendships.userHighId, userId))),
  ]);
  const excluded = new Set(followingRows.map((row) => row.followingId));
  for (const friendship of friendshipRows) excluded.add(friendship.userLowId === userId ? friendship.userHighId : friendship.userLowId);

  return builders
    .filter((builder) => builder.onboardingCompleted && !excluded.has(builder.userId))
    .map((builder) => {
      const match = computeMatch(
        { userId: me.userId, username: me.username, role: me.role, level: me.level, weeklyHours: me.weeklyHours, interests: me.interests, goals: me.goals, skills: me.skills, lookingFor: me.lookingFor, languages: me.languages, country: me.country, workModePreference: me.workModePreference, lastActiveAt: me.lastActiveAt },
        { userId: builder.userId, username: builder.username, role: builder.role, level: builder.level, weeklyHours: builder.weeklyHours, interests: builder.interests, goals: builder.goals, skills: builder.skills, lookingFor: builder.lookingFor, languages: builder.languages, country: builder.country, workModePreference: builder.workModePreference, lastActiveAt: builder.lastActiveAt },
      );
      const openBonus = isOpenToOpportunities(builder.lookingFor) ? 8 : 0;
      return { profile: builder, score: Math.min(100, match.score + openBonus), reasons: match.reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function listNetworkActivity(userId: string, limit = 12) {
  const [following, collaborators] = await Promise.all([listFollowing(userId), listCollaborators(userId)]);
  const peopleIds = [...new Set([
    ...following.map((item) => item.profile.userId),
    ...collaborators.map((item) => item.profile.userId),
  ])];
  if (!peopleIds.length) return [];
  const rows = await db.select({ id: projects.id, ownerId: projects.ownerId, name: projects.name, tagline: projects.tagline, stage: projects.stage, updatedAt: projects.updatedAt, createdAt: projects.createdAt })
    .from(projects)
    .where(and(eq(projects.entryType, "PROJECT"), inArray(projects.ownerId, peopleIds)))
    .orderBy(desc(projects.updatedAt))
    .limit(limit);
  const ownerIds = [...new Set(rows.map((row) => row.ownerId))];
  const ownerRows = ownerIds.length ? await db.select({ userId: profiles.userId, username: profiles.username }).from(profiles).where(inArray(profiles.userId, ownerIds)) : [];
  const ownerMap = new Map(ownerRows.map((row) => [row.userId, row.username]));
  return rows.map((row) => ({ ...row, username: ownerMap.get(row.ownerId) ?? "Builder" }));
}

export async function getPublicProfileByUsername(username: string) {
  const normalized = username.trim();
  if (!normalized) return null;
  const rows = await db.select({ userId: profiles.userId })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.username, normalized), eq(profiles.publicProfile, true), eq(users.isSuspended, false)))
    .limit(1);
  if (!rows[0]) return null;
  return getProfileByUserId(rows[0].userId);
}

export async function listPublicProfilesForSitemap() {
  return db.select({ username: profiles.username, updatedAt: profiles.updatedAt })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.publicProfile, true), eq(profiles.onboardingCompleted, true), eq(users.isSuspended, false)))
    .orderBy(desc(profiles.updatedAt));
}

export async function getEndorsementSummary(userId: string) {
  if (!isUuid(userId)) return { total: 0, wouldAgain: 0, strengths: [] as { key: CollaborationEndorsementStrength; label: string; count: number }[] };
  const rows = await db.select().from(collaborationEndorsements).where(eq(collaborationEndorsements.revieweeId, userId));
  const counts = new Map<CollaborationEndorsementStrength, number>();
  let wouldAgain = 0;
  for (const row of rows) {
    if (row.wouldCollaborateAgain) wouldAgain += 1;
    for (const strength of row.strengths) counts.set(strength, (counts.get(strength) ?? 0) + 1);
  }
  return {
    total: rows.length,
    wouldAgain,
    strengths: [...counts.entries()].map(([key, count]) => ({ key, label: ENDORSEMENT_STRENGTH_LABELS[key], count })).sort((a, b) => b.count - a.count),
  };
}

export async function listFollowerIds(userId: string) {
  if (!isUuid(userId)) return [];
  const rows = await db.select({ userId: follows.followerId }).from(follows).where(eq(follows.followingId, userId));
  return rows.map((row) => row.userId);
}

export async function getMutualCollaborators(viewerId: string, targetUserId: string) {
  if (!isUuid(viewerId) || !isUuid(targetUserId) || viewerId === targetUserId) return [];
  const [mine, theirs] = await Promise.all([listCollaborators(viewerId), listCollaborators(targetUserId)]);
  const theirIds = new Set(theirs.map((item) => item.profile.userId));
  return mine
    .filter((item) => theirIds.has(item.profile.userId))
    .map((item) => item.profile)
    .slice(0, 6);
}
