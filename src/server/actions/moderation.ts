"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { blocks, conversations, follows, friendRequests, friendships, reports, users } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit } from "@/lib/security";
import { reportSchema, uuidSchema } from "@/lib/validations";
import { z } from "zod";

export async function blockUser(blockedId: string) {
  if (!uuidSchema.safeParse(blockedId).success) return { error: "Invalid user." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:block", user.id, 100, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  if (user.id === blockedId) return { error: "You cannot block yourself." };
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, blockedId)).limit(1);
  if (!target[0]) return { error: "User not found." };

  const [low, high] = [user.id, blockedId].sort();
  const pairKey = `${low}:${high}`;
  await db.transaction(async (tx) => {
    await tx.insert(blocks).values({ blockerId: user.id, blockedId }).onConflictDoNothing();
    await tx.delete(friendships).where(and(eq(friendships.userLowId, low), eq(friendships.userHighId, high)));
    await tx.delete(conversations).where(and(eq(conversations.userLowId, low), eq(conversations.userHighId, high)));
    await tx.delete(follows).where(and(eq(follows.followerId, user.id), eq(follows.followingId, blockedId)));
    await tx.delete(follows).where(and(eq(follows.followerId, blockedId), eq(follows.followingId, user.id)));
    await tx.update(friendRequests).set({ status: "CANCELLED", updatedAt: new Date() }).where(and(eq(friendRequests.pairKey, pairKey), eq(friendRequests.status, "PENDING")));
  });
  revalidatePath("/builders");
  revalidatePath("/build");
  revalidatePath("/projects");
  revalidatePath("/network");
  revalidatePath("/messages");
  return { success: true };
}

export async function unblockUser(blockedId: string) {
  if (!uuidSchema.safeParse(blockedId).success) return { error: "Invalid user." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  await db.delete(blocks).where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, blockedId)));
  revalidatePath("/builders");
  revalidatePath("/build");
  return { success: true };
}

export async function reportUser(input: z.infer<typeof reportSchema>) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  if (parsed.data.reportedId === user.id) return { error: "You cannot report your own account." };
  const rateError = await enforceUserRateLimit("action:report", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, parsed.data.reportedId)).limit(1);
  if (!target[0]) return { error: "User not found." };
  const duplicate = await db.select({ id: reports.id }).from(reports).where(and(eq(reports.reporterId, user.id), eq(reports.reportedId, parsed.data.reportedId), eq(reports.status, "open"))).limit(1);
  if (duplicate[0]) return { error: "You already have an open report about this person." };

  await db.insert(reports).values({
    reporterId: user.id,
    reportedId: parsed.data.reportedId,
    reason: parsed.data.reason,
    description: parsed.data.description || null,
  });
  return { success: true };
}
