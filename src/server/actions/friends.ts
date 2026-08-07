"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { conversations, friendRequests, friendships, profiles, users } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { enforceUserRateLimit } from "@/lib/security";
import { uuidSchema } from "@/lib/validations";
import { friendPair, friendPairKey } from "@/server/data/friends";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { createNotification } from "@/server/services/notifications";

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

export async function sendFriendRequest(targetUserId: string) {
  if (!uuidSchema.safeParse(targetUserId).success) return { error: "Nieprawidłowy użytkownik." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  if (user.id === targetUserId) return { error: "Nie możesz dodać samego siebie." };
  const rateError = await enforceUserRateLimit("action:friend-request", user.id, 30, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  if (await isBlockedEitherWay(user.id, targetUserId)) return { error: "Nie można wysłać zaproszenia tej osobie." };

  const targetRows = await db
    .select({ id: users.id, suspended: users.isSuspended, role: users.systemRole, onboarding: profiles.onboardingCompleted })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, targetUserId))
    .limit(1);
  const target = targetRows[0];
  if (!target || target.suspended || target.role === "ADMIN" || !target.onboarding) return { error: "Ta osoba nie jest dostępna." };

  const [low, high] = friendPair(user.id, targetUserId);
  const pairKey = friendPairKey(user.id, targetUserId);
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${pairKey}))`);
      const existingFriend = await tx.select({ id: friendships.id }).from(friendships).where(and(eq(friendships.userLowId, low), eq(friendships.userHighId, high))).limit(1);
      if (existingFriend[0]) return { error: "Jesteście już znajomymi." } as const;
      const pending = await tx.select({ id: friendRequests.id }).from(friendRequests).where(and(eq(friendRequests.pairKey, pairKey), eq(friendRequests.status, "PENDING"))).limit(1);
      if (pending[0]) return { error: "Między Wami jest już oczekujące zaproszenie." } as const;
      const [request] = await tx.insert(friendRequests).values({ senderId: user.id, receiverId: targetUserId, pairKey }).returning({ id: friendRequests.id });
      return { requestId: request.id } as const;
    });
    if ("error" in result) return result;
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Między Wami jest już oczekujące zaproszenie." };
    throw error;
  }

  const senderProfile = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  await createNotification(targetUserId, "FRIEND_REQUEST", `${senderProfile[0]?.username ?? "Ktoś"} wysłał Ci zaproszenie do znajomych`, undefined, "/friends");
  revalidatePath("/friends");
  revalidatePath(`/builders/${targetUserId}`);
  return { success: true };
}

export async function respondToFriendRequest(requestId: string, decision: "ACCEPTED" | "REJECTED") {
  if (!uuidSchema.safeParse(requestId).success || !["ACCEPTED", "REJECTED"].includes(decision)) return { error: "Nieprawidłowe dane." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from friend_requests where id = ${requestId} for update`);
    const rows = await tx.select().from(friendRequests).where(eq(friendRequests.id, requestId)).limit(1);
    const request = rows[0];
    if (!request || request.status !== "PENDING") return { error: "Zaproszenie nie jest już aktywne." } as const;
    if (request.receiverId !== user.id) return { error: "Brak uprawnień." } as const;
    if (await isBlockedEitherWay(request.senderId, request.receiverId)) return { error: "Nie można zaakceptować tego zaproszenia." } as const;

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
    await createNotification(result.request.senderId, "FRIEND_ACCEPTED", `${profile[0]?.username ?? "Ktoś"} zaakceptował Twoje zaproszenie`, "Możecie teraz pisać do siebie w BuildCrew.", result.conversationId ? `/messages/${result.conversationId}` : "/friends");
  }
  revalidatePath("/friends");
  revalidatePath("/messages");
  revalidatePath(`/builders/${result.request.senderId}`);
  return { success: true, conversationId: result.conversationId };
}

export async function cancelFriendRequest(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: "Nieprawidłowe zaproszenie." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const result = await db
    .update(friendRequests)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(and(eq(friendRequests.id, requestId), eq(friendRequests.senderId, user.id), eq(friendRequests.status, "PENDING")))
    .returning({ receiverId: friendRequests.receiverId });
  if (!result[0]) return { error: "Nie można anulować tego zaproszenia." };
  revalidatePath("/friends");
  revalidatePath(`/builders/${result[0].receiverId}`);
  return { success: true };
}

export async function removeFriend(targetUserId: string) {
  if (!uuidSchema.safeParse(targetUserId).success) return { error: "Nieprawidłowy użytkownik." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const [low, high] = friendPair(user.id, targetUserId);
  await db.transaction(async (tx) => {
    await tx.delete(friendships).where(and(eq(friendships.userLowId, low), eq(friendships.userHighId, high)));
    await tx.delete(conversations).where(and(eq(conversations.userLowId, low), eq(conversations.userHighId, high)));
    await tx.update(friendRequests).set({ status: "CANCELLED", updatedAt: new Date() }).where(and(eq(friendRequests.pairKey, friendPairKey(user.id, targetUserId)), eq(friendRequests.status, "PENDING")));
  });
  revalidatePath("/friends");
  revalidatePath("/messages");
  revalidatePath(`/builders/${targetUserId}`);
  return { success: true };
}
