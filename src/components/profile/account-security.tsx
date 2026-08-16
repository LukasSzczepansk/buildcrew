"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { changePasswordAction, deleteAccountAction, type AccountActionState } from "@/server/actions/account";
import { logoutEverywhereAction } from "@/server/actions/auth";

function Message({ state }: { state: AccountActionState }) {
  const locale = useLocale();
  if (state.error) return <p className="text-sm text-red-600 dark:text-red-400">{appMessage(state.error, locale)}</p>;
  if (state.success) return <p className="text-sm text-emerald-600">{locale === "en" ? "Changes saved." : state.success}</p>;
  return null;
}

export function AccountSecurity({ hasPassword }: { hasPassword: boolean }) {
  const copy = useCopy();
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, {});
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccountAction, {});

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="font-semibold">{copy("Account security", "Account security")}</h3>
        {hasPassword ? (
          <>
            <p className="mt-1 text-sm text-neutral-500">{copy("Changing your password will sign you out on all devices.", "Changing your password will sign you out on all devices.")}</p>
            <form action={passwordAction} className="mt-5 space-y-3">
              <div><Label>{copy("Current password", "Current password")}</Label><Input name="currentPassword" type="password" autoComplete="current-password" required /></div>
              <div><Label>{copy("New password", "New password")}</Label><Input name="newPassword" type="password" minLength={12} autoComplete="new-password" required /></div>
              <div><Label>{copy("Confirm new password", "Confirm new password")}</Label><Input name="confirmPassword" type="password" minLength={12} autoComplete="new-password" required /></div>
              <Message state={passwordState} />
              <Button type="submit" disabled={passwordPending}>{passwordPending ? copy("Saving…", "Saving…") : copy("Change password", "Change password")}</Button>
            </form>
          </>
        ) : (
          <div className="mt-4 rounded-[6px] border border-lime-200 bg-lime-50 p-4 text-sm text-lime-900 dark:border-lime-500/20 dark:bg-lime-500/10 dark:text-lime-200">
            <p className="font-medium">{copy("This account was created with Google.", "This account was created with Google.")}</p>
            <p className="mt-1 text-lime-700/80 dark:text-lime-300/80">
              {copy("You do not have a separate BuildCrew password. If you want to add one, use Forgot password and set it through the link sent to your email.", "You do not have a separate BuildCrew password. If you want to add one, use Forgot password and set it through the link sent to your email.")}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/forgot-password">{copy("Set password by email", "Set password by email")}</Link>
            </Button>
          </div>
        )}
        <form action={logoutEverywhereAction} className="mt-4">
          <Button type="submit" variant="outline">{copy("Sign out on all devices", "Sign out on all devices")}</Button>
        </form>
      </Card>

      <Card className="border-red-200 p-6 dark:border-red-900/50">
        <h3 className="font-semibold text-red-700 dark:text-red-400">{copy("Delete account", "Delete account")}</h3>
        <p className="mt-1 text-sm text-neutral-500">
          {copy("This permanently deletes your profile and account data. Projects you own will also be deleted.", "This permanently deletes your profile and account data. Projects you own will also be deleted.")}
        </p>
        {hasPassword ? (
          <form action={deleteAction} className="mt-5 space-y-3">
            <div><Label>{copy("Password", "Password")}</Label><Input name="password" type="password" autoComplete="current-password" required /></div>
            <div><Label>{copy("Confirmation", "Confirmation")}</Label><Input name="confirmation" placeholder={copy("DELETE ACCOUNT", "DELETE ACCOUNT")} required /></div>
            <Message state={deleteState} />
            <Button type="submit" variant="destructive" disabled={deletePending}>{deletePending ? copy("Deleting…", "Deleting…") : copy("Delete account permanently", "Delete account permanently")}</Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">
            {copy("For security, an account created with Google can be deleted after you set a password through the Forgot password flow.", "For security, an account created with Google can be deleted after you set a password through the Forgot password flow.")}
          </p>
        )}
      </Card>
    </div>
  );
}
