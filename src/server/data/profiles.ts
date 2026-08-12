import "server-only";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { isAdmin } from "@/lib/auth";
import { isUuid, safeHttpUrl } from "@/lib/security";
import {
  blocks,
  interests,
  profileInterests,
  profilePrivate,
  profileSkills,
  profiles,
  skills,
  users,
} from "@/db/schema";

export type ProfileSummary = Awaited<ReturnType<typeof getProfileByUserId>>;

export async function getProfileByUserId(userId: string) {
  if (!isUuid(userId)) return null;
  const rows = await db
    .select({ profile: profiles, email: users.email, lastActiveAt: users.lastActiveAt, lastLoginAt: users.lastLoginAt })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.userId, userId), eq(users.isSuspended, false)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const [skillRows, interestRows] = await Promise.all([
    db
      .select({ name: skills.name })
      .from(profileSkills)
      .innerJoin(skills, eq(skills.id, profileSkills.skillId))
      .where(eq(profileSkills.userId, userId)),
    db
      .select({ name: interests.name })
      .from(profileInterests)
      .innerJoin(interests, eq(interests.id, profileInterests.interestId))
      .where(eq(profileInterests.userId, userId)),
  ]);

  return {
    ...row.profile,
    lastActiveAt: row.lastActiveAt ?? row.lastLoginAt,
    isDemo: row.email.toLowerCase().endsWith(".invalid"),
    githubUrl: safeHttpUrl(row.profile.githubUrl),
    portfolioUrl: safeHttpUrl(row.profile.portfolioUrl),
    linkedinUrl: safeHttpUrl(row.profile.linkedinUrl),
    skills: skillRows.map((s) => s.name),
    interests: interestRows.map((i) => i.name),
  };
}

export async function getPrivateContact(userId: string) {
  if (!isUuid(userId)) return null;
  const rows = await db.select().from(profilePrivate).where(eq(profilePrivate.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function listBuilderProfiles(excludeUserId?: string) {
  const rows = await db
    .select({ profile: profiles, email: users.email, systemRole: users.systemRole, lastActiveAt: users.lastActiveAt, lastLoginAt: users.lastLoginAt })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(
      and(
        eq(users.isSuspended, false),
        excludeUserId ? ne(profiles.userId, excludeUserId) : sql`true`,
      ),
    );

  const userIds = rows.map((r) => r.profile.userId);
  if (userIds.length === 0) return [];

  const [skillRows, interestRows, blockedRows] = await Promise.all([
    db
      .select({ userId: profileSkills.userId, name: skills.name })
      .from(profileSkills)
      .innerJoin(skills, eq(skills.id, profileSkills.skillId))
      .where(inArray(profileSkills.userId, userIds)),
    db
      .select({ userId: profileInterests.userId, name: interests.name })
      .from(profileInterests)
      .innerJoin(interests, eq(interests.id, profileInterests.interestId))
      .where(inArray(profileInterests.userId, userIds)),
    excludeUserId
      ? db.select().from(blocks).where(sql`${blocks.blockerId} = ${excludeUserId} or ${blocks.blockedId} = ${excludeUserId}`)
      : Promise.resolve([]),
  ]);

  const blockedIds = new Set(blockedRows.map((b) => b.blockerId === excludeUserId ? b.blockedId : b.blockerId));
  const skillMap = new Map<string, string[]>();
  for (const s of skillRows) {
    skillMap.set(s.userId, [...(skillMap.get(s.userId) ?? []), s.name]);
  }
  const interestMap = new Map<string, string[]>();
  for (const i of interestRows) {
    interestMap.set(i.userId, [...(interestMap.get(i.userId) ?? []), i.name]);
  }

  return rows
    .filter((r) => !blockedIds.has(r.profile.userId) && !isAdmin(r.email, r.systemRole))
    .map((r) => ({
      ...r.profile,
      lastActiveAt: r.lastActiveAt ?? r.lastLoginAt,
      isDemo: r.email.toLowerCase().endsWith(".invalid"),
      skills: skillMap.get(r.profile.userId) ?? [],
      interests: interestMap.get(r.profile.userId) ?? [],
    }));
}
