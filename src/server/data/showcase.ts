import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  buildChallenges,
  challengeParticipants,
  profiles,
  projectMembers,
  projects,
  showcaseEntries,
  showcaseFeedback,
  showcaseReactions,
  users,
  type ShowcaseCategory,
  type ShowcaseReaction,
} from "@/db/schema";
import { isUuid, safeHttpUrl } from "@/lib/security";
import { computeMatch } from "@/lib/matching";
import { getProfileByUserId } from "@/server/data/profiles";

export type ShowcaseTab = "popular" | "new" | "week" | "month";

function reactionValue(reaction: ShowcaseReaction) {
  if (reaction === "POTENTIAL") return 3;
  if (reaction === "IDEA") return 2;
  return 1;
}

async function enrichEntries(rows: (typeof showcaseEntries.$inferSelect)[], viewerId?: string, freshnessDays?: number) {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const creatorIds = Array.from(new Set(rows.map((row) => row.creatorId)));
  const projectIds = Array.from(new Set(rows.map((row) => row.projectId).filter((id): id is string => Boolean(id))));
  const challengeIds = Array.from(new Set(rows.map((row) => row.challengeId).filter((id): id is string => Boolean(id))));

  const [creatorRows, reactionRows, feedbackRows, memberRows, projectRows, challengeRows] = await Promise.all([
    db.select({ userId: profiles.userId, username: profiles.username, avatarEmoji: profiles.avatarEmoji, role: profiles.role })
      .from(profiles).where(inArray(profiles.userId, creatorIds)),
    db.select().from(showcaseReactions).where(inArray(showcaseReactions.entryId, ids)),
    db.select().from(showcaseFeedback).where(inArray(showcaseFeedback.entryId, ids)),
    projectIds.length
      ? db.select({ projectId: projectMembers.projectId, userId: profiles.userId, username: profiles.username, avatarEmoji: profiles.avatarEmoji, role: profiles.role })
          .from(projectMembers).innerJoin(profiles, eq(profiles.userId, projectMembers.userId)).where(inArray(projectMembers.projectId, projectIds))
      : Promise.resolve([]),
    projectIds.length ? db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, projectIds)) : Promise.resolve([]),
    challengeIds.length ? db.select({ id: buildChallenges.id, title: buildChallenges.title, status: buildChallenges.status }).from(buildChallenges).where(inArray(buildChallenges.id, challengeIds)) : Promise.resolve([]),
  ]);

  const creators = new Map(creatorRows.map((row) => [row.userId, row]));
  const projectMap = new Map(projectRows.map((row) => [row.id, row]));
  const challengeMap = new Map(challengeRows.map((row) => [row.id, row]));
  const teams = new Map<string, typeof memberRows>();
  for (const member of memberRows) teams.set(member.projectId, [...(teams.get(member.projectId) ?? []), member]);

  const freshnessCutoff = freshnessDays ? Date.now() - freshnessDays * 24 * 60 * 60 * 1000 : 0;
  return rows.map((row) => {
    const entryReactions = reactionRows.filter((reaction) => reaction.entryId === row.id);
    const entryFeedback = feedbackRows.filter((feedback) => feedback.entryId === row.id);
    const counts = { APPLAUSE: 0, IDEA: 0, POTENTIAL: 0 } as Record<ShowcaseReaction, number>;
    let score = 0;
    let freshScore = 0;
    for (const reaction of entryReactions) {
      counts[reaction.reaction] += 1;
      const points = reactionValue(reaction.reaction);
      score += points;
      if (!freshnessDays || reaction.createdAt.getTime() >= freshnessCutoff) freshScore += points;
    }
    score += entryFeedback.length * 2;
    freshScore += entryFeedback.filter((feedback) => !freshnessDays || feedback.createdAt.getTime() >= freshnessCutoff).length * 2;
    const yes = entryFeedback.filter((feedback) => feedback.wouldUse === "YES").length;
    const maybe = entryFeedback.filter((feedback) => feedback.wouldUse === "MAYBE").length;
    const positiveUse = yes + maybe;
    const wouldUsePercent = entryFeedback.length ? Math.round((positiveUse / entryFeedback.length) * 100) : null;
    const viewerReactions = new Set(entryReactions.filter((reaction) => reaction.userId === viewerId).map((reaction) => reaction.reaction));
    const creator = creators.get(row.creatorId);
    const team = row.projectId ? teams.get(row.projectId) ?? [] : creator ? [creator] : [];

    return {
      ...row,
      screenshotUrl: safeHttpUrl(row.screenshotUrl),
      liveUrl: safeHttpUrl(row.liveUrl),
      githubUrl: safeHttpUrl(row.githubUrl),
      creator: creators.get(row.creatorId) ?? null,
      team,
      project: row.projectId ? projectMap.get(row.projectId) ?? null : null,
      challenge: row.challengeId ? challengeMap.get(row.challengeId) ?? null : null,
      reactionCounts: counts,
      viewerReactions,
      feedbackCount: entryFeedback.length,
      wouldUsePercent,
      score,
      freshScore,
    };
  });
}

export async function listShowcaseEntries(input: { tab?: ShowcaseTab; category?: string; viewerId?: string; challengeId?: string } = {}) {
  const tab = input.tab ?? "popular";
  const conditions = [] as ReturnType<typeof eq>[];
  if (input.category) conditions.push(eq(showcaseEntries.category, input.category as ShowcaseCategory));
  if (input.challengeId) conditions.push(eq(showcaseEntries.challengeId, input.challengeId));
  const rows = await db.select().from(showcaseEntries)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(showcaseEntries.createdAt)).limit(120);
  const freshnessDays = tab === "week" ? 7 : tab === "month" ? 30 : undefined;
  const enriched = await enrichEntries(rows, input.viewerId, freshnessDays);
  if (tab === "new") return enriched;
  return enriched.sort((a, b) => (freshnessDays ? b.freshScore - a.freshScore : b.score - a.score) || b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getShowcaseEntry(id: string, viewerId?: string) {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(showcaseEntries).where(eq(showcaseEntries.id, id)).limit(1);
  if (!rows[0]) return null;
  return (await enrichEntries(rows, viewerId))[0] ?? null;
}

export async function listShowcaseFeedback(entryId: string) {
  if (!isUuid(entryId)) return [];
  return db.select({
    id: showcaseFeedback.id,
    liked: showcaseFeedback.liked,
    improve: showcaseFeedback.improve,
    wouldUse: showcaseFeedback.wouldUse,
    createdAt: showcaseFeedback.createdAt,
    userId: profiles.userId,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
  }).from(showcaseFeedback)
    .innerJoin(profiles, eq(profiles.userId, showcaseFeedback.userId))
    .where(eq(showcaseFeedback.entryId, entryId))
    .orderBy(desc(showcaseFeedback.createdAt)).limit(40);
}

export async function listShowcaseForUser(userId: string) {
  if (!isUuid(userId)) return [];
  const owned = await db.select().from(showcaseEntries).where(eq(showcaseEntries.creatorId, userId)).orderBy(desc(showcaseEntries.createdAt));
  const projectMemberships = await db.select({ projectId: projectMembers.projectId }).from(projectMembers).where(eq(projectMembers.userId, userId));
  const projectIds = projectMemberships.map((row) => row.projectId);
  const memberEntries = projectIds.length ? await db.select().from(showcaseEntries).where(inArray(showcaseEntries.projectId, projectIds)) : [];
  const unique = new Map([...owned, ...memberEntries].map((entry) => [entry.id, entry]));
  return enrichEntries(Array.from(unique.values()));
}

export async function getBuilderBadges(userId: string) {
  const entries = await listShowcaseForUser(userId);
  const badges: { key: string; label: string; emoji: string }[] = [];
  if (entries.length) badges.push({ key: "shipped", label: "Shipped", emoji: "🚀" });
  if (entries.some((entry) => entry.crewId)) badges.push({ key: "crew-builder", label: "Crew Builder", emoji: "🤝" });
  if (entries.some((entry) => entry.challengeId)) badges.push({ key: "challenge-builder", label: "Challenge Builder", emoji: "🏁" });
  if (entries.some((entry) => entry.reactionCounts.POTENTIAL >= 5)) badges.push({ key: "community-pick", label: "Community Pick", emoji: "💡" });

  const userRows = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);
  if (userRows[0]) {
    const rankRows = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(sql`${users.createdAt} <= ${userRows[0].createdAt}`);
    if ((rankRows[0]?.count ?? 999) <= 100) badges.unshift({ key: "founding", label: "Founding Builder", emoji: "🟣" });
  }
  return badges;
}

export async function listChallenges() {
  return db.select().from(buildChallenges).orderBy(desc(buildChallenges.startsAt));
}

export async function getChallenge(id: string) {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(buildChallenges).where(eq(buildChallenges.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getChallengeParticipation(challengeId: string, userId: string) {
  if (!isUuid(challengeId) || !isUuid(userId)) return null;
  const rows = await db.select().from(challengeParticipants).where(and(eq(challengeParticipants.challengeId, challengeId), eq(challengeParticipants.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function getChallengeParticipantCount(challengeId: string) {
  const rows = await db.select({ count: sql<number>`count(*)::int` }).from(challengeParticipants).where(eq(challengeParticipants.challengeId, challengeId));
  return rows[0]?.count ?? 0;
}

export async function listChallengeMatches(challengeId: string, userId: string) {
  const me = await getProfileByUserId(userId);
  if (!me) return [];
  const participantRows = await db.select({ userId: challengeParticipants.userId, crewId: challengeParticipants.crewId })
    .from(challengeParticipants)
    .where(and(eq(challengeParticipants.challengeId, challengeId), eq(challengeParticipants.mode, "FIND_CREW")));
  const candidates = participantRows.filter((row) => row.userId !== userId && !row.crewId).slice(0, 50);
  const profilesList = (await Promise.all(candidates.map((row) => getProfileByUserId(row.userId)))).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
  return profilesList.map((profile) => ({
    profile,
    ...computeMatch({ userId: me.userId, username: me.username, role: me.role, level: me.level, weeklyHours: me.weeklyHours, interests: me.interests, goals: me.goals }, { userId: profile.userId, username: profile.username, role: profile.role, level: profile.level, weeklyHours: profile.weeklyHours, interests: profile.interests, goals: profile.goals }),
  })).sort((a, b) => b.score - a.score).slice(0, 8);
}
