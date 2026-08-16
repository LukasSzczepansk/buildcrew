import "server-only";

import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  blocks,
  hackathonParticipants,
  hackathons,
  hackathonTeamInvites,
  hackathonTeamMembers,
  hackathonTeamRequests,
  hackathonTeams,
  profiles,
  users,
  type RoleType,
} from "@/db/schema";
import { computeHackathonMatch } from "@/lib/hackathon-matching";
import type { AppLocale } from "@/lib/site-config";
import { getHackathonPhase } from "@/lib/hackathons";
import { isUuid, safeHttpUrl } from "@/lib/security";

function sanitizeHackathon<T extends typeof hackathons.$inferSelect>(row: T) {
  return {
    ...row,
    officialUrl: safeHttpUrl(row.officialUrl) ?? row.officialUrl,
    organizerUrl: safeHttpUrl(row.organizerUrl),
    registrationUrl: safeHttpUrl(row.registrationUrl),
    coverImageUrl: row.mediaRightsConfirmed ? safeHttpUrl(row.coverImageUrl) : null,
  };
}

export async function listPublishedHackathons() {
  const rows = await db.select().from(hackathons).where(eq(hackathons.isPublished, true)).orderBy(asc(hackathons.startsAt));
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const [participantCounts, lookingCounts, teamCounts] = await Promise.all([
    db.select({ hackathonId: hackathonParticipants.hackathonId, count: sql<number>`count(*)::int` })
      .from(hackathonParticipants)
      .where(inArray(hackathonParticipants.hackathonId, ids))
      .groupBy(hackathonParticipants.hackathonId),
    db.select({ hackathonId: hackathonParticipants.hackathonId, count: sql<number>`count(*)::int` })
      .from(hackathonParticipants)
      .where(and(inArray(hackathonParticipants.hackathonId, ids), eq(hackathonParticipants.status, "LOOKING")))
      .groupBy(hackathonParticipants.hackathonId),
    db.select({ hackathonId: hackathonTeams.hackathonId, count: sql<number>`count(*)::int` })
      .from(hackathonTeams)
      .where(and(inArray(hackathonTeams.hackathonId, ids), ne(hackathonTeams.status, "ARCHIVED")))
      .groupBy(hackathonTeams.hackathonId),
  ]);
  const participants = new Map(participantCounts.map((row) => [row.hackathonId, row.count]));
  const looking = new Map(lookingCounts.map((row) => [row.hackathonId, row.count]));
  const teams = new Map(teamCounts.map((row) => [row.hackathonId, row.count]));
  const enriched = rows.map((row) => ({
    ...sanitizeHackathon(row),
    participantCount: participants.get(row.id) ?? 0,
    lookingCount: looking.get(row.id) ?? 0,
    teamCount: teams.get(row.id) ?? 0,
  }));
  const rank = { TEAM_FORMING: 0, ONGOING: 1, REGISTRATION_CLOSED: 2, ENDED: 3, CANCELLED: 4 } as const;
  return enriched.sort((a, b) => rank[getHackathonPhase(a)] - rank[getHackathonPhase(b)] || a.startsAt.getTime() - b.startsAt.getTime());
}

export async function listHackathonsForAdmin() {
  const rows = await db.select().from(hackathons).orderBy(desc(hackathons.startsAt));
  return rows.map(sanitizeHackathon);
}

export async function listHackathonsForSitemap() {
  return db.select({ slug: hackathons.slug, updatedAt: hackathons.updatedAt })
    .from(hackathons)
    .where(eq(hackathons.isPublished, true))
    .orderBy(desc(hackathons.updatedAt));
}

export async function getHackathonBySlug(slug: string, includeUnpublished = false) {
  const conditions = [eq(hackathons.slug, slug)];
  if (!includeUnpublished) conditions.push(eq(hackathons.isPublished, true));
  const rows = await db.select().from(hackathons).where(and(...conditions)).limit(1);
  return rows[0] ? sanitizeHackathon(rows[0]) : null;
}

export async function getHackathonById(id: string) {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(hackathons).where(eq(hackathons.id, id)).limit(1);
  return rows[0] ? sanitizeHackathon(rows[0]) : null;
}

export async function getHackathonStats(hackathonId: string) {
  if (!isUuid(hackathonId)) return { participantCount: 0, lookingCount: 0, teamCount: 0 };
  const [participants, looking, teams] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(hackathonParticipants).where(eq(hackathonParticipants.hackathonId, hackathonId)),
    db.select({ count: sql<number>`count(*)::int` }).from(hackathonParticipants).where(and(eq(hackathonParticipants.hackathonId, hackathonId), eq(hackathonParticipants.status, "LOOKING"))),
    db.select({ count: sql<number>`count(*)::int` }).from(hackathonTeams).where(and(eq(hackathonTeams.hackathonId, hackathonId), ne(hackathonTeams.status, "ARCHIVED"))),
  ]);
  return {
    participantCount: participants[0]?.count ?? 0,
    lookingCount: looking[0]?.count ?? 0,
    teamCount: teams[0]?.count ?? 0,
  };
}

export async function getHackathonRoleCounts(hackathonId: string) {
  if (!isUuid(hackathonId)) return [];
  return db.select({ role: hackathonParticipants.role, count: sql<number>`count(*)::int` })
    .from(hackathonParticipants)
    .where(and(eq(hackathonParticipants.hackathonId, hackathonId), eq(hackathonParticipants.status, "LOOKING")))
    .groupBy(hackathonParticipants.role)
    .orderBy(desc(sql`count(*)`));
}

export async function getHackathonParticipation(hackathonId: string, userId: string) {
  if (!isUuid(hackathonId) || !isUuid(userId)) return null;
  const rows = await db.select().from(hackathonParticipants)
    .where(and(eq(hackathonParticipants.hackathonId, hackathonId), eq(hackathonParticipants.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getHackathonTeamForUser(hackathonId: string, userId: string) {
  if (!isUuid(hackathonId) || !isUuid(userId)) return null;
  const membershipRows = await db.select({ member: hackathonTeamMembers, team: hackathonTeams })
    .from(hackathonTeamMembers)
    .innerJoin(hackathonTeams, eq(hackathonTeams.id, hackathonTeamMembers.teamId))
    .where(and(eq(hackathonTeamMembers.hackathonId, hackathonId), eq(hackathonTeamMembers.userId, userId)))
    .limit(1);
  const membership = membershipRows[0];
  if (!membership) return null;
  const members = await db.select({
    userId: hackathonTeamMembers.userId,
    role: hackathonTeamMembers.role,
    isLead: hackathonTeamMembers.isLead,
    joinedAt: hackathonTeamMembers.joinedAt,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
  })
    .from(hackathonTeamMembers)
    .innerJoin(profiles, eq(profiles.userId, hackathonTeamMembers.userId))
    .innerJoin(users, eq(users.id, hackathonTeamMembers.userId))
    .where(and(eq(hackathonTeamMembers.teamId, membership.team.id), eq(users.isSuspended, false)))
    .orderBy(desc(hackathonTeamMembers.isLead), asc(hackathonTeamMembers.joinedAt));
  return { ...membership.team, viewerIsLead: membership.member.isLead, members };
}

export async function listHackathonMatches(hackathonId: string, userId: string, locale: AppLocale = "pl") {
  const meRows = await db.select({ participant: hackathonParticipants, level: profiles.level })
    .from(hackathonParticipants)
    .innerJoin(profiles, eq(profiles.userId, hackathonParticipants.userId))
    .where(and(eq(hackathonParticipants.hackathonId, hackathonId), eq(hackathonParticipants.userId, userId)))
    .limit(1);
  const me = meRows[0];
  if (!me || me.participant.status === "PAUSED") return [];

  const rows = await db.select({
    participant: hackathonParticipants,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
    level: profiles.level,
    lastActiveAt: users.lastActiveAt,
    systemRole: users.systemRole,
  })
    .from(hackathonParticipants)
    .innerJoin(profiles, eq(profiles.userId, hackathonParticipants.userId))
    .innerJoin(users, eq(users.id, hackathonParticipants.userId))
    .where(and(
      eq(hackathonParticipants.hackathonId, hackathonId),
      eq(hackathonParticipants.status, "LOOKING"),
      ne(hackathonParticipants.userId, userId),
      eq(users.isSuspended, false),
    ))
    .limit(80);

  const blockedRows = await db.select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId }).from(blocks).where(or(eq(blocks.blockerId, userId), eq(blocks.blockedId, userId)));
  const blockedIds = new Set(blockedRows.map((row) => row.blockerId === userId ? row.blockedId : row.blockerId));

  return rows.filter((row) => row.systemRole === "USER" && !blockedIds.has(row.participant.userId)).map((row) => {
    const match = computeHackathonMatch(
      { ...me.participant, level: me.level },
      { ...row.participant, level: row.level },
      locale,
    );
    return {
      userId: row.participant.userId,
      username: row.username,
      avatarEmoji: row.avatarEmoji,
      role: row.participant.role,
      technologies: row.participant.technologies,
      themes: row.participant.themes,
      goal: row.participant.goal,
      availability: row.participant.availability,
      hasIdea: row.participant.hasIdea,
      ideaSummary: row.participant.ideaSummary,
      lastActiveAt: row.lastActiveAt,
      ...match,
    };
  }).sort((a, b) => b.score - a.score).slice(0, 12);
}

export async function listHackathonTeams(hackathonId: string, viewerId?: string) {
  if (!isUuid(hackathonId)) return [];
  const teamRows = await db.select().from(hackathonTeams)
    .where(and(eq(hackathonTeams.hackathonId, hackathonId), ne(hackathonTeams.status, "ARCHIVED")))
    .orderBy(desc(hackathonTeams.createdAt));
  if (!teamRows.length) return [];
  const teamIds = teamRows.map((team) => team.id);
  const [memberRows, requestRows] = await Promise.all([
    db.select({
      teamId: hackathonTeamMembers.teamId,
      userId: hackathonTeamMembers.userId,
      role: hackathonTeamMembers.role,
      isLead: hackathonTeamMembers.isLead,
      username: profiles.username,
      avatarEmoji: profiles.avatarEmoji,
    })
      .from(hackathonTeamMembers)
      .innerJoin(profiles, eq(profiles.userId, hackathonTeamMembers.userId))
      .innerJoin(users, eq(users.id, hackathonTeamMembers.userId))
      .where(and(inArray(hackathonTeamMembers.teamId, teamIds), eq(users.isSuspended, false))),
    viewerId
      ? db.select({ teamId: hackathonTeamRequests.teamId, status: hackathonTeamRequests.status })
          .from(hackathonTeamRequests)
          .where(and(inArray(hackathonTeamRequests.teamId, teamIds), eq(hackathonTeamRequests.applicantId, viewerId)))
      : Promise.resolve([]),
  ]);
  const members = new Map<string, typeof memberRows>();
  for (const row of memberRows) members.set(row.teamId, [...(members.get(row.teamId) ?? []), row]);
  const requests = new Map(requestRows.map((row) => [row.teamId, row.status]));
  return teamRows.map((team) => ({ ...team, members: members.get(team.id) ?? [], viewerRequestStatus: requests.get(team.id) ?? null }));
}

export async function listIncomingHackathonInvites(hackathonId: string, userId: string) {
  if (!isUuid(hackathonId) || !isUuid(userId)) return [];
  return db.select({
    id: hackathonTeamInvites.id,
    teamId: hackathonTeamInvites.teamId,
    message: hackathonTeamInvites.message,
    createdAt: hackathonTeamInvites.createdAt,
    teamName: hackathonTeams.name,
    inviterUsername: profiles.username,
  })
    .from(hackathonTeamInvites)
    .innerJoin(hackathonTeams, eq(hackathonTeams.id, hackathonTeamInvites.teamId))
    .innerJoin(profiles, eq(profiles.userId, hackathonTeamInvites.inviterId))
    .where(and(
      eq(hackathonTeamInvites.hackathonId, hackathonId),
      eq(hackathonTeamInvites.inviteeId, userId),
      eq(hackathonTeamInvites.status, "PENDING"),
    ))
    .orderBy(desc(hackathonTeamInvites.createdAt));
}

export async function listPendingHackathonTeamRequests(teamId: string, viewerId: string) {
  if (!isUuid(teamId) || !isUuid(viewerId)) return [];
  const lead = await db.select({ userId: hackathonTeamMembers.userId }).from(hackathonTeamMembers)
    .where(and(eq(hackathonTeamMembers.teamId, teamId), eq(hackathonTeamMembers.userId, viewerId), eq(hackathonTeamMembers.isLead, true))).limit(1);
  if (!lead[0]) return [];
  return db.select({
    id: hackathonTeamRequests.id,
    applicantId: hackathonTeamRequests.applicantId,
    message: hackathonTeamRequests.message,
    createdAt: hackathonTeamRequests.createdAt,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
    role: hackathonParticipants.role,
  })
    .from(hackathonTeamRequests)
    .innerJoin(profiles, eq(profiles.userId, hackathonTeamRequests.applicantId))
    .leftJoin(hackathonParticipants, and(
      eq(hackathonParticipants.hackathonId, hackathonTeamRequests.hackathonId),
      eq(hackathonParticipants.userId, hackathonTeamRequests.applicantId),
    ))
    .where(and(eq(hackathonTeamRequests.teamId, teamId), eq(hackathonTeamRequests.status, "PENDING")))
    .orderBy(asc(hackathonTeamRequests.createdAt));
}

export async function getHackathonParticipantProfileDefaults(userId: string) {
  if (!isUuid(userId)) return null;
  const rows = await db.select({ role: profiles.role, weeklyHours: profiles.weeklyHours })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export function teamMissingRoles(members: { role: RoleType | null }[]) {
  const roles = new Set(members.map((member) => member.role).filter(Boolean));
  const preferred: RoleType[] = ["FRONTEND", "BACKEND", "UI_UX", "AI_ML", "PRODUCT", "FULLSTACK", "MOBILE", "MARKETING"];
  return preferred.filter((role) => !roles.has(role));
}

export async function getPublicHackathonTeam(hackathonId: string, teamId: string) {
  if (!isUuid(hackathonId) || !isUuid(teamId)) return null;
  const teamRows = await db.select().from(hackathonTeams)
    .where(and(eq(hackathonTeams.id, teamId), eq(hackathonTeams.hackathonId, hackathonId), ne(hackathonTeams.status, "ARCHIVED")))
    .limit(1);
  const team = teamRows[0];
  if (!team) return null;
  const members = await db.select({
    userId: hackathonTeamMembers.userId,
    role: hackathonTeamMembers.role,
    isLead: hackathonTeamMembers.isLead,
    username: profiles.username,
    avatarEmoji: profiles.avatarEmoji,
    publicProfile: profiles.publicProfile,
  })
    .from(hackathonTeamMembers)
    .innerJoin(profiles, eq(profiles.userId, hackathonTeamMembers.userId))
    .innerJoin(users, eq(users.id, hackathonTeamMembers.userId))
    .where(and(eq(hackathonTeamMembers.teamId, teamId), eq(users.isSuspended, false)))
    .orderBy(desc(hackathonTeamMembers.isLead), asc(hackathonTeamMembers.joinedAt));
  return { ...team, members };
}

export async function getHackathonOrganizerSnapshot(hackathonId: string) {
  if (!isUuid(hackathonId)) return null;
  const event = await getHackathonById(hackathonId);
  if (!event) return null;
  const [stats, roleCounts, teams] = await Promise.all([
    getHackathonStats(hackathonId),
    getHackathonRoleCounts(hackathonId),
    listHackathonTeams(hackathonId),
  ]);
  const openTeams = teams.filter((team) => team.members.length < team.targetSize);
  const fullTeams = teams.filter((team) => team.members.length >= team.targetSize);
  return {
    event,
    stats: {
      ...stats,
      openTeamCount: openTeams.length,
      fullTeamCount: fullTeams.length,
    },
    roleCounts,
    teams: teams.map((team) => ({
      ...team,
      missingRoles: teamMissingRoles(team.members),
      missingSeats: Math.max(0, team.targetSize - team.members.length),
    })),
  };
}
