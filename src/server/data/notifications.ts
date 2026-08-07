import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function listNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(30);
}

export async function unreadCount(userId: string) {
  const rows = await listNotifications(userId);
  return rows.filter((n) => !n.isRead).length;
}
