import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { buildPoolListings } from "@/db/schema";
import { isUuid } from "@/lib/security";
import { listBuilderProfiles } from "@/server/data/profiles";

export async function getBuildPoolListingForUser(userId: string) {
  if (!isUuid(userId)) return null;
  const rows = await db
    .select()
    .from(buildPoolListings)
    .where(eq(buildPoolListings.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listActiveBuildPoolListings(viewerId: string) {
  if (!isUuid(viewerId)) return [];
  const [listingRows, builders] = await Promise.all([
    db
      .select()
      .from(buildPoolListings)
      .where(eq(buildPoolListings.status, "ACTIVE"))
      .orderBy(desc(buildPoolListings.updatedAt)),
    listBuilderProfiles(viewerId),
  ]);

  const builderById = new Map(builders.map((builder) => [builder.userId, builder]));
  return listingRows.flatMap((listing) => {
    const profile = builderById.get(listing.userId);
    if (!profile || !profile.onboardingCompleted) return [];
    return [{ ...listing, profile }];
  });
}
