import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  buildChallenges,
  challengeParticipants,
  crewMembers,
  profiles,
  sprintAnnouncements,
  sprintCheckIns,
  type RoleType,
  type SprintParticipantStatus,
} from "@/db/schema";
import { isUuid } from "@/lib/security";

export async function getSprintPublicStats(challengeId: string) {
  if (!isUuid(challengeId)) return { total: 0, accepted: 0, matched: 0, roleCounts: {} as Partial<Record<RoleType, number>> };
  const rows = await db.select({
    role: challengeParticipants.role,
    status: challengeParticipants.participantStatus,
  }).from(challengeParticipants).where(eq(challengeParticipants.challengeId, challengeId));

  const roleCounts: Partial<Record<RoleType, number>> = {};
  for (const row of rows) {
    if (row.role) roleCounts[row.role] = (roleCounts[row.role] ?? 0) + 1;
  }
  return {
    total: rows.length,
    accepted: rows.filter((row) => ["ACCEPTED", "MATCHED", "BUILDING", "COMPLETED"].includes(row.status)).length,
    matched: rows.filter((row) => ["MATCHED", "BUILDING", "COMPLETED"].includes(row.status)).length,
    roleCounts,
  };
}

export async function getSprintAdminData(challengeId: string) {
  if (!isUuid(challengeId)) return null;
  const challengeRows = await db.select().from(buildChallenges).where(eq(buildChallenges.id, challengeId)).limit(1);
  const challenge = challengeRows[0];
  if (!challenge) return null;

  const [applications, checkIns, announcements] = await Promise.all([
    db.select({
      userId: challengeParticipants.userId,
      mode: challengeParticipants.mode,
      crewId: challengeParticipants.crewId,
      role: challengeParticipants.role,
      participantStatus: challengeParticipants.participantStatus,
      adminNote: challengeParticipants.adminNote,
      applicationData: challengeParticipants.applicationData,
      createdAt: challengeParticipants.createdAt,
      updatedAt: challengeParticipants.updatedAt,
      username: profiles.username,
      avatarEmoji: profiles.avatarEmoji,
    }).from(challengeParticipants)
      .innerJoin(profiles, eq(profiles.userId, challengeParticipants.userId))
      .where(eq(challengeParticipants.challengeId, challengeId))
      .orderBy(desc(challengeParticipants.updatedAt)),
    db.select({
      userId: sprintCheckIns.userId,
      weekKey: sprintCheckIns.weekKey,
      health: sprintCheckIns.health,
      note: sprintCheckIns.note,
      updatedAt: sprintCheckIns.updatedAt,
      username: profiles.username,
      avatarEmoji: profiles.avatarEmoji,
    }).from(sprintCheckIns)
      .innerJoin(profiles, eq(profiles.userId, sprintCheckIns.userId))
      .where(eq(sprintCheckIns.challengeId, challengeId))
      .orderBy(desc(sprintCheckIns.updatedAt)),
    db.select().from(sprintAnnouncements)
      .where(eq(sprintAnnouncements.challengeId, challengeId))
      .orderBy(desc(sprintAnnouncements.createdAt))
      .limit(20),
  ]);

  const crewIds = Array.from(new Set(applications.map((item) => item.crewId).filter((id): id is string => Boolean(id))));
  const memberRows = crewIds.length
    ? await db.select({ crewId: crewMembers.crewId, userId: crewMembers.userId }).from(crewMembers).where(inArray(crewMembers.crewId, crewIds))
    : [];

  const applicationMap = new Map(applications.map((entry) => [entry.userId, entry]));
  const crews = crewIds.map((crewId) => ({
    id: crewId,
    members: memberRows
      .filter((member) => member.crewId === crewId)
      .map((member) => applicationMap.get(member.userId))
      .filter((member): member is (typeof applications)[number] => Boolean(member)),
  }));

  const latestCheckInByUser = new Map<string, (typeof checkIns)[number]>();
  for (const checkIn of checkIns) if (!latestCheckInByUser.has(checkIn.userId)) latestCheckInByUser.set(checkIn.userId, checkIn);

  const counts = {
    total: applications.length,
    accepted: applications.filter((item) => ["ACCEPTED", "MATCHED", "BUILDING", "COMPLETED"].includes(item.participantStatus)).length,
    unmatched: applications.filter((item) => !item.crewId && ["APPLIED", "ACCEPTED", "WAITLIST"].includes(item.participantStatus)).length,
    crews: crews.length,
    green: Array.from(latestCheckInByUser.values()).filter((item) => item.health === "GREEN").length,
    yellow: Array.from(latestCheckInByUser.values()).filter((item) => item.health === "YELLOW").length,
    red: Array.from(latestCheckInByUser.values()).filter((item) => item.health === "RED").length,
  };

  const roleCounts = applications.reduce<Partial<Record<RoleType, number>>>((acc, item) => {
    const role = item.applicationData?.role ?? item.role;
    if (role) acc[role] = (acc[role] ?? 0) + 1;
    return acc;
  }, {});

  return {
    challenge,
    applications,
    crews,
    checkIns,
    latestCheckIns: Array.from(latestCheckInByUser.values()),
    announcements,
    counts,
    roleCounts,
  };
}

export async function listSprintAnnouncementsForParticipant(challengeId: string, status: SprintParticipantStatus, crewId: string | null) {
  if (!isUuid(challengeId)) return [];
  const rows = await db.select().from(sprintAnnouncements)
    .where(eq(sprintAnnouncements.challengeId, challengeId))
    .orderBy(desc(sprintAnnouncements.createdAt))
    .limit(12);
  return rows.filter((item) => {
    if (item.audience === "ALL") return true;
    if (item.audience === "UNMATCHED") return !crewId && ["APPLIED", "ACCEPTED", "WAITLIST"].includes(status);
    return ["ACCEPTED", "MATCHED", "BUILDING", "COMPLETED"].includes(status);
  });
}

export async function getLatestSprintCheckIn(challengeId: string, userId: string) {
  if (!isUuid(challengeId) || !isUuid(userId)) return null;
  const rows = await db.select().from(sprintCheckIns)
    .where(eq(sprintCheckIns.challengeId, challengeId))
    .orderBy(desc(sprintCheckIns.updatedAt));
  return rows.find((row) => row.userId === userId) ?? null;
}
