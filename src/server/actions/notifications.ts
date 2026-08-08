"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPreferences, notifications } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { notificationPreferencesSchema, uuidSchema } from "@/lib/validations";

export async function markNotificationRead(id: string) {
  if (!uuidSchema.safeParse(id).success) return;
  const user = await getVerifiedCurrentUser();
  if (!user) return;
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await getVerifiedCurrentUser();
  if (!user) return;
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.userId, user.id));
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

export async function saveNotificationPreferences(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) return { error: "Nie udało się zapisać ustawień." };

  await db.insert(notificationPreferences).values({ userId: user.id, ...parsed.data })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: { ...parsed.data, updatedAt: new Date() },
    });
  revalidatePath("/profile");
  return { success: true };
}
