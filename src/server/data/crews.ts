import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { isUuid } from "@/lib/security";
import { crewMembers, crews, profiles } from "@/db/schema";

export async function getCrewById(id: string) {
  if (!isUuid(id)) return null;
  const rows = await db.select().from(crews).where(eq(crews.id, id)).limit(1);
  const crew = rows[0];
  if (!crew) return null;

  const members = await db
    .select({ userId: crewMembers.userId, joinedAt: crewMembers.joinedAt, profile: profiles })
    .from(crewMembers)
    .innerJoin(profiles, eq(profiles.userId, crewMembers.userId))
    .where(eq(crewMembers.crewId, id));

  return { ...crew, members };
}

export async function getMembershipCrewForUser(userId: string) {
  const rows = await db
    .select({ crewId: crewMembers.crewId })
    .from(crewMembers)
    .innerJoin(crews, eq(crews.id, crewMembers.crewId))
    .where(and(eq(crewMembers.userId, userId), eq(crews.status, "FORMING")));
  return rows[0]?.crewId ?? null;
}

export async function isUserInCrew(crewId: string, userId: string) {
  const rows = await db
    .select()
    .from(crewMembers)
    .where(and(eq(crewMembers.crewId, crewId), eq(crewMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}
