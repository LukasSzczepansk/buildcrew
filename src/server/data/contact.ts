import "server-only";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { blocks, crewMembers, profilePrivate, projectMembers } from "@/db/schema";

export async function haveSharedConnection(userA: string, userB: string) {
  if (userA === userB) return true;

  const projectsA = await db.select({ projectId: projectMembers.projectId }).from(projectMembers).where(eq(projectMembers.userId, userA));
  if (projectsA.length > 0) {
    const shared = await db.select({ projectId: projectMembers.projectId }).from(projectMembers).where(eq(projectMembers.userId, userB));
    const setA = new Set(projectsA.map((p) => p.projectId));
    if (shared.some((s) => setA.has(s.projectId))) return true;
  }

  const crewsA = await db.select({ crewId: crewMembers.crewId }).from(crewMembers).where(eq(crewMembers.userId, userA));
  if (crewsA.length > 0) {
    const crewsB = await db.select({ crewId: crewMembers.crewId }).from(crewMembers).where(eq(crewMembers.userId, userB));
    const setA = new Set(crewsA.map((c) => c.crewId));
    if (crewsB.some((c) => setA.has(c.crewId))) return true;
  }
  return false;
}

export async function getRevealedContact(viewerId: string, targetUserId: string) {
  const blocked = await db.select({ id: blocks.id }).from(blocks).where(or(
    and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, targetUserId)),
    and(eq(blocks.blockerId, targetUserId), eq(blocks.blockedId, viewerId)),
  )).limit(1);
  if (blocked.length) return null;

  const connected = await haveSharedConnection(viewerId, targetUserId);
  if (!connected) return null;
  const rows = await db.select().from(profilePrivate).where(eq(profilePrivate.userId, targetUserId)).limit(1);
  return { discordUsername: rows[0]?.discordUsername ?? null };
}
