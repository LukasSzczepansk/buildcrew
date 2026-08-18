import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobListings, profiles, users } from "@/db/schema";
import { isUuid } from "@/lib/security";

export async function listActiveJobs(limit = 60) {
  return db.select({
    id: jobListings.id,
    companyName: jobListings.companyName,
    title: jobListings.title,
    description: jobListings.description,
    location: jobListings.location,
    remote: jobListings.remote,
    employmentType: jobListings.employmentType,
    skills: jobListings.skills,
    applyUrl: jobListings.applyUrl,
    contactEmail: jobListings.contactEmail,
    createdAt: jobListings.createdAt,
    ownerId: jobListings.ownerId,
    ownerUsername: profiles.username,
  })
    .from(jobListings)
    .innerJoin(users, eq(users.id, jobListings.ownerId))
    .leftJoin(profiles, eq(profiles.userId, jobListings.ownerId))
    .where(and(eq(jobListings.status, "ACTIVE"), eq(users.isSuspended, false)))
    .orderBy(desc(jobListings.createdAt))
    .limit(Math.max(1, Math.min(limit, 100)));
}

export async function getJobById(id: string) {
  if (!isUuid(id)) return null;
  const rows = await db.select({ job: jobListings, ownerUsername: profiles.username }).from(jobListings)
    .innerJoin(users, eq(users.id, jobListings.ownerId))
    .leftJoin(profiles, eq(profiles.userId, jobListings.ownerId))
    .where(and(eq(jobListings.id, id), eq(jobListings.status, "ACTIVE"), eq(users.isSuspended, false))).limit(1);
  return rows[0] ? { ...rows[0].job, ownerUsername: rows[0].ownerUsername } : null;
}
