"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { getVerifiedCurrentUser } from "@/lib/auth";
import { notificationPreferencesSchema, uuidSchema } from "@/lib/validations";
import { cancelPendingNotificationEmailsByType, markAllNotificationsReadAndCancel, markNotificationReadAndCancel } from "@/server/services/notifications";

export async function markNotificationRead(id: string) {
  if (!uuidSchema.safeParse(id).success) return;
  const user = await getVerifiedCurrentUser();
  if (!user) return;
  await markNotificationReadAndCancel(user.id, id);
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await getVerifiedCurrentUser();
  if (!user) return;
  await markAllNotificationsReadAndCancel(user.id);
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

export async function saveNotificationPreferences(input: unknown) {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) return { error: "Could not save the settings." };

  await db.insert(notificationPreferences).values({ userId: user.id, ...parsed.data })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: { ...parsed.data, updatedAt: new Date() },
    });
  if (!parsed.data.emailMessages) {
    await cancelPendingNotificationEmailsByType(user.id, "MESSAGE_RECEIVED");
  }
  revalidatePath("/profile");
  return { success: true };
}
