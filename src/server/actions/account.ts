"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { destroyAllSessionsForUser, getVerifiedCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { enforceUserRateLimit } from "@/lib/security";
import { changePasswordSchema, deleteAccountSchema } from "@/lib/validations";
import { markAllNotificationsReadAndCancel } from "@/server/services/notifications";

export type AccountActionState = { error?: string; success?: string };

export async function changePasswordAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:password:change", user.id, 5, 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the provided data." };
  const rows = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!rows[0] || !(await verifyPassword(parsed.data.currentPassword, rows[0].passwordHash))) return { error: "Your current password is incorrect." };
  if (await verifyPassword(parsed.data.newPassword, rows[0].passwordHash)) return { error: "Your new password must be different from the current password." };
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash, passwordChangedAt: new Date() }).where(eq(users.id, user.id));
  await destroyAllSessionsForUser(user.id);
  redirect("/login?password=changed");
}

export async function deleteAccountAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "You must be logged in." };
  const rateError = await enforceUserRateLimit("action:account:delete", user.id, 5, 60 * 60);
  if (rateError) return { error: rateError };
  const parsed = deleteAccountSchema.safeParse({ password: formData.get("password"), confirmation: formData.get("confirmation") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the provided data." };
  const rows = await db.select({ passwordHash: users.passwordHash, systemRole: users.systemRole }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!rows[0] || !(await verifyPassword(parsed.data.password, rows[0].passwordHash))) return { error: "The password is incorrect." };
  if (rows[0].systemRole === "ADMIN") return { error: "Remove the ADMIN role before deleting an administrator account." };
  await markAllNotificationsReadAndCancel(user.id);
  await destroyAllSessionsForUser(user.id);
  await db.delete(users).where(eq(users.id, user.id));
  redirect("/?account=deleted");
}
