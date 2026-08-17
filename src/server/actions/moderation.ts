"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { blocks, conversations, follows, friendRequests, friendships, messages, projects, reports, users } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { enforceUserRateLimit } from "@/lib/security";
import { contentReportSchema, reportSchema, uuidSchema } from "@/lib/validations";
import { z } from "zod";

export async function blockUser(blockedId: string) {
  if (!uuidSchema.safeParse(blockedId).success) return { error: "Invalid user." };
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:block", user.id, 50, 24 * 60 * 60);
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
  revalidatePath("/projects");
  return { success: true };
}

export async function reportUser(input: z.infer<typeof reportSchema>) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  if (parsed.data.reportedId === user.id) return { error: "You cannot report your own account." };
  const rateError = await enforceUserRateLimit("action:report:user", user.id, 20, 24 * 60 * 60);
  if (rateError) return { error: rateError };
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, parsed.data.reportedId)).limit(1);
  if (!target[0]) return { error: "User not found." };
  const duplicate = await db.select({ id: reports.id }).from(reports).where(and(eq(reports.reporterId, user.id), eq(reports.targetType, "USER"), eq(reports.reportedId, parsed.data.reportedId), eq(reports.status, "open"))).limit(1);
  if (duplicate[0]) return { error: "You already have an open report about this person." };

  await db.insert(reports).values({ reporterId: user.id, reportedId: parsed.data.reportedId, targetType: "USER", targetId: parsed.data.reportedId, reason: parsed.data.reason, description: parsed.data.description || null });
  await logEvent("content_reported", user.id, { targetType: "USER", targetId: parsed.data.reportedId });
  return { success: true };
}

export async function reportContent(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const parsed = contentReportSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid report." };
  const hourly = await enforceUserRateLimit("action:report:content:hour", user.id, 8, 60 * 60);
  if (hourly) return { error: hourly };
  const daily = await enforceUserRateLimit("action:report:content:day", user.id, 25, 24 * 60 * 60);
  if (daily) return { error: daily };

  let reportedId: string | null = null;
  if (parsed.data.targetType === "PROJECT") {
    if (!uuidSchema.safeParse(parsed.data.targetId).success) return { error: "Invalid project." };
    const row = await db.select({ ownerId: projects.ownerId }).from(projects).where(eq(projects.id, parsed.data.targetId)).limit(1);
    if (!row[0]) return { error: "Project not found." };
    reportedId = row[0].ownerId;
  } else if (parsed.data.targetType === "MESSAGE") {
    if (!uuidSchema.safeParse(parsed.data.targetId).success) return { error: "Invalid message." };
    const row = await db.select({ senderId: messages.senderId, conversationId: messages.conversationId }).from(messages).where(eq(messages.id, parsed.data.targetId)).limit(1);
    if (!row[0]) return { error: "Message not found." };
    const conversation = await db.select().from(conversations).where(eq(conversations.id, row[0].conversationId)).limit(1);
    if (!conversation[0] || (conversation[0].userLowId !== user.id && conversation[0].userHighId !== user.id)) return { error: "You cannot report this message." };
    reportedId = row[0].senderId;
  }
  if (!reportedId || reportedId === user.id) return { error: "You cannot report your own content." };

  const duplicate = await db.select({ id: reports.id }).from(reports).where(and(eq(reports.reporterId, user.id), eq(reports.targetType, parsed.data.targetType), eq(reports.targetId, parsed.data.targetId), eq(reports.status, "open"))).limit(1);
  if (duplicate[0]) return { error: "You already have an open report for this content." };

  await db.insert(reports).values({ reporterId: user.id, reportedId, targetType: parsed.data.targetType, targetId: parsed.data.targetId, reason: parsed.data.reason, description: parsed.data.description || null });
  await logEvent("content_reported", user.id, { targetType: parsed.data.targetType, targetId: parsed.data.targetId });
  return { success: true };
}
