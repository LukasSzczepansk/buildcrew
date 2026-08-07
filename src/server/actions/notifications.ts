"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { uuidSchema } from "@/lib/validations";

export async function markNotificationRead(id: string) {
  if (!uuidSchema.safeParse(id).success) return;
  const user = await getVerifiedCurrentUser();
  if (!user) return;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const user = await getVerifiedCurrentUser();
  if (!user) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));
  revalidatePath("/", "layout");
}
