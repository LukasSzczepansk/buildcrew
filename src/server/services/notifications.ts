import "server-only";
import { db } from "@/db";
import { notifications, type NotificationType } from "@/db/schema";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
) {
  await db.insert(notifications).values({ userId, type, title, body, link });
}
