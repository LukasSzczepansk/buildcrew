"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { buildPoolListings, crewMembers, crews } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit } from "@/lib/security";
import { buildPoolListingSchema, buildPoolListingStatusSchema } from "@/lib/validations";

async function hasActiveCrew(userId: string) {
  const rows = await db
    .select({ id: crews.id })
    .from(crewMembers)
    .innerJoin(crews, eq(crews.id, crewMembers.crewId))
    .where(and(eq(crewMembers.userId, userId), eq(crews.status, "FORMING")))
    .limit(1);
  return Boolean(rows[0]);
}

export async function saveBuildPoolListing(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:build-pool:save", user.id, 20, 60 * 60);
  if (rateError) return { error: rateError };
  if (await hasActiveCrew(user.id)) return { error: "You already have an active crew. You can browse Build Pool and invite people without listing yourself." };

  const parsed = buildPoolListingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data." };

  const now = new Date();
  await db
    .insert(buildPoolListings)
    .values({
      userId: user.id,
      ...parsed.data,
      avoids: parsed.data.avoids || null,
      description: parsed.data.description || null,
      status: "ACTIVE",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: buildPoolListings.userId,
      set: {
        ...parsed.data,
        avoids: parsed.data.avoids || null,
        description: parsed.data.description || null,
        status: "ACTIVE",
        updatedAt: now,
      },
    });

  revalidatePath("/build");
  return { success: true };
}

export async function setBuildPoolListingStatus(status: "ACTIVE" | "PAUSED" | "CLOSED") {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const parsed = buildPoolListingStatusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status." };
  if (parsed.data === "ACTIVE" && await hasActiveCrew(user.id)) return { error: "You already have an active crew, so you cannot activate your own listing." };

  const result = await db
    .update(buildPoolListings)
    .set({ status: parsed.data, updatedAt: new Date() })
    .where(eq(buildPoolListings.userId, user.id))
    .returning({ id: buildPoolListings.id });
  if (!result[0]) return { error: "Create your listing first." };

  revalidatePath("/build");
  return { success: true };
}

export async function deleteBuildPoolListing() {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  await db.delete(buildPoolListings).where(eq(buildPoolListings.userId, user.id));
  revalidatePath("/build");
  return { success: true };
}
