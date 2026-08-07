import "server-only";

import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { conversations, friendRequests, friendships } from "@/db/schema";
import { isUuid } from "@/lib/security";
import { getProfileByUserId } from "@/server/data/profiles";

export function friendPair(userA: string, userB: string) {
  return [userA, userB].sort() as [string, string];
}

export function friendPairKey(userA: string, userB: string) {
  return friendPair(userA, userB).join(":");
}

export async function getFriendshipState(userId: string, targetUserId: string) {
  if (!isUuid(userId) || !isUuid(targetUserId) || userId === targetUserId) return { kind: "NONE" as const };
  const [low, high] = friendPair(userId, targetUserId);
  const [friendRows, requestRows, conversationRows] = await Promise.all([
    db.select({ id: friendships.id }).from(friendships).where(and(eq(friendships.userLowId, low), eq(friendships.userHighId, high))).limit(1),
    db.select().from(friendRequests).where(and(eq(friendRequests.pairKey, friendPairKey(userId, targetUserId)), eq(friendRequests.status, "PENDING"))).limit(1),
    db.select({ id: conversations.id }).from(conversations).where(and(eq(conversations.userLowId, low), eq(conversations.userHighId, high))).limit(1),
  ]);
  if (friendRows[0]) return { kind: "FRIENDS" as const, conversationId: conversationRows[0]?.id ?? null };
  const request = requestRows[0];
  if (!request) return { kind: "NONE" as const };
  if (request.senderId === userId) return { kind: "OUTGOING" as const, requestId: request.id };
  return { kind: "INCOMING" as const, requestId: request.id };
}

export async function listFriends(userId: string) {
  if (!isUuid(userId)) return [];
  const rows = await db
    .select()
    .from(friendships)
    .where(or(eq(friendships.userLowId, userId), eq(friendships.userHighId, userId)))
    .orderBy(desc(friendships.createdAt));

  return Promise.all(rows.map(async (friendship) => {
    const otherId = friendship.userLowId === userId ? friendship.userHighId : friendship.userLowId;
    const [profile, conversation] = await Promise.all([
      getProfileByUserId(otherId),
      db.select({ id: conversations.id }).from(conversations).where(and(eq(conversations.userLowId, friendship.userLowId), eq(conversations.userHighId, friendship.userHighId))).limit(1),
    ]);
    return profile ? { friendshipId: friendship.id, since: friendship.createdAt, profile, conversationId: conversation[0]?.id ?? null } : null;
  })).then((items) => items.filter((item): item is NonNullable<typeof item> => Boolean(item)));
}

export async function listPendingFriendRequests(userId: string) {
  if (!isUuid(userId)) return { incoming: [], outgoing: [] };
  const rows = await db
    .select()
    .from(friendRequests)
    .where(and(eq(friendRequests.status, "PENDING"), or(eq(friendRequests.senderId, userId), eq(friendRequests.receiverId, userId))))
    .orderBy(desc(friendRequests.createdAt));

  const enriched = await Promise.all(rows.map(async (request) => {
    const otherId = request.senderId === userId ? request.receiverId : request.senderId;
    const profile = await getProfileByUserId(otherId);
    return profile ? { ...request, profile } : null;
  }));
  const present = enriched.filter((item): item is NonNullable<typeof item> => Boolean(item));
  return {
    incoming: present.filter((item) => item.receiverId === userId),
    outgoing: present.filter((item) => item.senderId === userId),
  };
}
