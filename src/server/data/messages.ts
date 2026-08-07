import "server-only";

import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { conversations, friendships, messages } from "@/db/schema";
import { isUuid } from "@/lib/security";
import { friendPair } from "@/server/data/friends";
import { isBlockedEitherWay } from "@/server/data/moderation";
import { getProfileByUserId } from "@/server/data/profiles";

export async function getConversationForUser(conversationId: string, userId: string) {
  if (!isUuid(conversationId) || !isUuid(userId)) return null;
  const rows = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  const conversation = rows[0];
  if (!conversation || (conversation.userLowId !== userId && conversation.userHighId !== userId)) return null;
  const otherUserId = conversation.userLowId === userId ? conversation.userHighId : conversation.userLowId;
  if (await isBlockedEitherWay(userId, otherUserId)) return null;
  const [low, high] = friendPair(userId, otherUserId);
  const friendship = await db.select({ id: friendships.id }).from(friendships).where(and(eq(friendships.userLowId, low), eq(friendships.userHighId, high))).limit(1);
  if (!friendship[0]) return null;
  const profile = await getProfileByUserId(otherUserId);
  if (!profile) return null;
  return { conversation, otherUserId, profile };
}

export async function listConversationMessages(conversationId: string) {
  if (!isUuid(conversationId)) return [];
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(100);
  return rows.reverse();
}

export async function markConversationRead(conversationId: string, userId: string) {
  if (!isUuid(conversationId) || !isUuid(userId)) return;
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId), isNull(messages.readAt)));
}

export async function unreadMessagesCount(userId: string) {
  if (!isUuid(userId)) return 0;
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(and(
      ne(messages.senderId, userId),
      isNull(messages.readAt),
      or(eq(conversations.userLowId, userId), eq(conversations.userHighId, userId)),
    ));
  return Number(rows[0]?.count ?? 0);
}

export async function listConversationSummaries(userId: string) {
  if (!isUuid(userId)) return [];
  const rows = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.userLowId, userId), eq(conversations.userHighId, userId)))
    .orderBy(desc(conversations.updatedAt));

  const summaries = await Promise.all(rows.map(async (conversation) => {
    const otherUserId = conversation.userLowId === userId ? conversation.userHighId : conversation.userLowId;
    if (await isBlockedEitherWay(userId, otherUserId)) return null;
    const [low, high] = friendPair(userId, otherUserId);
    const [friendship, profile, lastMessageRows, unreadRows] = await Promise.all([
      db.select({ id: friendships.id }).from(friendships).where(and(eq(friendships.userLowId, low), eq(friendships.userHighId, high))).limit(1),
      getProfileByUserId(otherUserId),
      db.select().from(messages).where(eq(messages.conversationId, conversation.id)).orderBy(desc(messages.createdAt)).limit(1),
      db.select({ count: sql<number>`count(*)::int` }).from(messages).where(and(eq(messages.conversationId, conversation.id), ne(messages.senderId, userId), isNull(messages.readAt))),
    ]);
    if (!friendship[0] || !profile) return null;
    return {
      id: conversation.id,
      updatedAt: conversation.updatedAt,
      profile,
      lastMessage: lastMessageRows[0] ?? null,
      unreadCount: Number(unreadRows[0]?.count ?? 0),
    };
  }));

  return summaries.filter((item): item is NonNullable<typeof item> => Boolean(item));
}
