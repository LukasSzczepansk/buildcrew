"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { conversations, friendRequests, friendships, profiles, users } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit, isNewAccount } from "@/lib/security";
import { uuidSchema } from "@/lib/validations";
import { friendPair, friendPairKey } from "@/server/data/friends";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { createNotification } from "@/server/services/notifications";

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

export async function sendFriendRequest(targetUserId: string) {
  if (!uuidSchema.safeParse(targetUserId).success) return { error: "Invalid user." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  if (user.id === targetUserId) return { error: "You cannot add yourself." };
  const rateError = await enforceUserRateLimit("action:friend-request", user.id, (await isNewAccount(user.id)) ? 12 : 30, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  if (await isBlockedEitherWay(user.id, targetUserId)) return { error: "You cannot send an invitation to this person." };

  const targetRows = await db
    .select({ id: users.id, suspended: users.isSuspended, role: users.systemRole, onboarding: profiles.onboardingCompleted })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, targetUserId))
    .limit(1);
  const target = targetRows[0];
  if (!target || target.suspended || target.role === "ADMIN" || !target.onboarding) return { error: "This person is not available." };

  const [low, high] = friendPair(user.id, targetUserId);
  const pairKey = friendPairKey(user.id, targetUserId);
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${pairKey}))`);
      const existingFriend = await tx.select({ id: friendships.id }).from(friendships).where(and(eq(friendships.userLowId, low), eq(friendships.userHighId, high))).limit(1);
      if (existingFriend[0]) return { error: "This person is already in your connections." } as const;
      const pending = await tx.select({ id: friendRequests.id }).from(friendRequests).where(and(eq(friendRequests.pairKey, pairKey), eq(friendRequests.status, "PENDING"))).limit(1);
      if (pending[0]) return { error: "There is already a pending connection request between you." } as const;
      const [request] = await tx.insert(friendRequests).values({ senderId: user.id, receiverId: targetUserId, pairKey }).returning({ id: friendRequests.id });
      return { requestId: request.id } as const;
    });
    if ("error" in result) return result;
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "There is already a pending connection request between you." };
    throw error;
  }

  const senderProfile = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  await createNotification(targetUserId, "FRIEND_REQUEST", `${senderProfile[0]?.username ?? "Someone"} sent you a connection request`, undefined, "/network?tab=contacts", { titleEn: `${senderProfile[0]?.username ?? "Someone"} sent you a connection request` });
  revalidatePath("/network?tab=contacts");
  revalidatePath(`/builders/${targetUserId}`);
  return { success: true };
}

export async function respondToFriendRequest(requestId: string, decision: "ACCEPTED" | "REJECTED") {
  if (!uuidSchema.safeParse(requestId).success || !["ACCEPTED", "REJECTED"].includes(decision)) return { error: "Invalid data." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from friend_requests where id = ${requestId} for update`);
    const rows = await tx.select().from(friendRequests).where(eq(friendRequests.id, requestId)).limit(1);
    const request = rows[0];
    if (!request || request.status !== "PENDING") return { error: "The invitation is no longer active." } as const;
    if (request.receiverId !== user.id) return { error: "You do not have permission to do this." } as const;
    if (await isBlockedEitherWay(request.senderId, request.receiverId)) return { error: "This invitation cannot be accepted." } as const;

    if (decision === "REJECTED") {
      await tx.update(friendRequests).set({ status: "REJECTED", updatedAt: new Date() }).where(eq(friendRequests.id, requestId));
      return { request, conversationId: null } as const;
    }

    const [low, high] = friendPair(request.senderId, request.receiverId);
    await tx.insert(friendships).values({ userLowId: low, userHighId: high }).onConflictDoNothing();
    const existingConversation = await tx.select({ id: conversations.id }).from(conversations).where(and(eq(conversations.userLowId, low), eq(conversations.userHighId, high))).limit(1);
    let conversationId = existingConversation[0]?.id;
    if (!conversationId) {
      const [created] = await tx.insert(conversations).values({ userLowId: low, userHighId: high }).returning({ id: conversations.id });
      conversationId = created.id;
    }
    await tx.update(friendRequests).set({ status: "ACCEPTED", updatedAt: new Date() }).where(eq(friendRequests.id, requestId));
    return { request, conversationId } as const;
  });

  if ("error" in result) return result;
  if (decision === "ACCEPTED") {
    const profile = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    await createNotification(result.request.senderId, "FRIEND_ACCEPTED", `${profile[0]?.username ?? "Someone"} accepted your connection request`, "You can now message each other privately on BuildCrew.", result.conversationId ? `/messages/${result.conversationId}` : "/network?tab=contacts", { titleEn: `${profile[0]?.username ?? "Someone"} accepted your connection request`, bodyEn: "You can now message each other privately on BuildCrew." });
  }
  revalidatePath("/network?tab=contacts");
  revalidatePath("/messages");
  revalidatePath(`/builders/${result.request.senderId}`);
  return { success: true, conversationId: result.conversationId };
}

export async function cancelFriendRequest(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: "Invalid invitation." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const result = await db
    .update(friendRequests)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(friendRequests.id, requestId), eq(friendRequests.senderId, user.id), eq(friendRequests.status, "PENDING")))
    .returning({ receiverId: friendRequests.receiverId });
  if (!result[0]) return { error: "This invitation cannot be cancelled." };
  revalidatePath("/network?tab=contacts");
  revalidatePath(`/builders/${result[0].receiverId}`);
  return { success: true };
}

export async function removeFriend(targetUserId: string) {
  if (!uuidSchema.safeParse(targetUserId).success) return { error: "Invalid user." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const [low, high] = friendPair(user.id, targetUserId);
  await db.transaction(async (tx) => {
    await tx.delete(friendships).where(and(eq(friendships.userLowId, low), eq(friendships.userHighId, high)));
    await tx.delete(conversations).where(and(eq(conversations.userLowId, low), eq(conversations.userHighId, high)));
    await tx.update(friendRequests).set({ status: "CANCELLED", updatedAt: new Date() }).where(and(eq(friendRequests.pairKey, friendPairKey(user.id, targetUserId)), eq(friendRequests.status, "PENDING")));
  });
  revalidatePath("/network?tab=contacts");
  revalidatePath("/messages");
  revalidatePath(`/builders/${targetUserId}`);
  return { success: true };
}
