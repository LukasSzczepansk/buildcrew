import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notificationPreferences, notifications } from "@/db/schema";

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailProjectApplications: true,
  emailProjectAccepted: true,
  emailBuildPool: true,
  emailCrew: true,
  emailChallenge: true,
  emailShowcaseFeedback: false,
  emailMessages: true,
  emailMatches: true,
  emailWeeklyDigest: true,
};

export async function listNotifications(userId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function unreadCount(userId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(sql`${notifications.userId} = ${userId} and ${notifications.isRead} = false`);
  return rows[0]?.count ?? 0;
}

export async function getNotificationPreferences(userId: string) {
  const rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return rows[0] ?? { userId, ...DEFAULT_NOTIFICATION_PREFERENCES, updatedAt: new Date() };
}
