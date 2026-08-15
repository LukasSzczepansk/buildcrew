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
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:password:change", user.id, 5, 60 * 60);
  if (rateError) return { error: rateError };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź dane." };
  const rows = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!rows[0] || !(await verifyPassword(parsed.data.currentPassword, rows[0].passwordHash))) return { error: "Aktualne hasło jest nieprawidłowe." };
  if (await verifyPassword(parsed.data.newPassword, rows[0].passwordHash)) return { error: "Nowe hasło musi różnić się od obecnego." };
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash, passwordChangedAt: new Date() }).where(eq(users.id, user.id));
  await destroyAllSessionsForUser(user.id);
  redirect("/login?password=changed");
}

export async function deleteAccountAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const user = await getVerifiedCurrentUser();
  if (!user) return { error: "Musisz być zalogowany." };
  const rateError = await enforceUserRateLimit("action:account:delete", user.id, 5, 60 * 60);
  if (rateError) return { error: rateError };
  const parsed = deleteAccountSchema.safeParse({ password: formData.get("password"), confirmation: formData.get("confirmation") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Sprawdź dane." };
  const rows = await db.select({ passwordHash: users.passwordHash, systemRole: users.systemRole }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!rows[0] || !(await verifyPassword(parsed.data.password, rows[0].passwordHash))) return { error: "Hasło jest nieprawidłowe." };
  if (rows[0].systemRole === "ADMIN") return { error: "Konto administratora usuń dopiero po odebraniu mu roli ADMIN." };
  await markAllNotificationsReadAndCancel(user.id);
  await destroyAllSessionsForUser(user.id);
  await db.delete(users).where(eq(users.id, user.id));
  redirect("/?account=deleted");
}
