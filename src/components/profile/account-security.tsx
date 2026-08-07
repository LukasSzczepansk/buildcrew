"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction, deleteAccountAction, type AccountActionState } from "@/server/actions/account";
import { logoutEverywhereAction } from "@/server/actions/auth";

function Message({ state }: { state: AccountActionState }) {
  if (state.error) return <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>;
  if (state.success) return <p className="text-sm text-emerald-600">{state.success}</p>;
  return null;
}

export function AccountSecurity({ hasPassword }: { hasPassword: boolean }) {
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, {});
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccountAction, {});

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="font-semibold">Bezpieczeństwo konta</h3>
        {hasPassword ? (
          <>
            <p className="mt-1 text-sm text-neutral-500">Zmiana hasła wyloguje wszystkie urządzenia.</p>
            <form action={passwordAction} className="mt-5 space-y-3">
              <div><Label>Aktualne hasło</Label><Input name="currentPassword" type="password" autoComplete="current-password" required /></div>
              <div><Label>Nowe hasło</Label><Input name="newPassword" type="password" minLength={12} autoComplete="new-password" required /></div>
              <div><Label>Powtórz nowe hasło</Label><Input name="confirmPassword" type="password" minLength={12} autoComplete="new-password" required /></div>
              <Message state={passwordState} />
              <Button type="submit" disabled={passwordPending}>Zmień hasło</Button>
            </form>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
            <p className="font-medium">To konto zostało utworzone przez Google.</p>
            <p className="mt-1 text-violet-700/80 dark:text-violet-300/80">
              Nie masz osobnego hasła BuildCrew. Jeśli chcesz je dodać, użyj opcji „Nie pamiętam hasła” i ustaw je przez link wysłany na Twój e-mail.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/forgot-password">Ustaw hasło przez e-mail</Link>
            </Button>
          </div>
        )}
        <form action={logoutEverywhereAction} className="mt-4">
          <Button type="submit" variant="outline">Wyloguj wszystkie urządzenia</Button>
        </form>
      </Card>

      <Card className="border-red-200 p-6 dark:border-red-900/50">
        <h3 className="font-semibold text-red-700 dark:text-red-400">Usuń konto</h3>
        <p className="mt-1 text-sm text-neutral-500">
          To działanie usuwa profil i dane powiązane z kontem. Projekty, których jesteś właścicielem, również zostaną usunięte.
        </p>
        {hasPassword ? (
          <form action={deleteAction} className="mt-5 space-y-3">
            <div><Label>Hasło</Label><Input name="password" type="password" autoComplete="current-password" required /></div>
            <div><Label>Potwierdzenie</Label><Input name="confirmation" placeholder="USUŃ KONTO" required /></div>
            <Message state={deleteState} />
            <Button type="submit" variant="destructive" disabled={deletePending}>Usuń konto na zawsze</Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">
            Ze względów bezpieczeństwa konto utworzone przez Google można usunąć po ustawieniu hasła przez link „Nie pamiętam hasła”.
          </p>
        )}
      </Card>
    </div>
  );
}
