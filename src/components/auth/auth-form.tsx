"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/server/actions/auth";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="ty@przyklad.pl" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={mode === "signup" ? 12 : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        {mode === "signup" && (
          <p className="text-xs text-neutral-400">Minimum 12 znaków.</p>
        )}
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Chwileczkę…" : mode === "signup" ? "Utwórz konto" : "Zaloguj się"}
      </Button>

      {mode === "login" && <p className="-mt-2 text-right text-xs"><Link href="/forgot-password" className="text-violet-600 hover:underline dark:text-violet-400">Nie pamiętam hasła</Link></p>}

      <p className="text-center text-sm text-neutral-500">
        {mode === "signup" ? (
          <>
            Masz już konto?{" "}
            <Link href="/login" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
              Zaloguj się
            </Link>
          </>
        ) : (
          <>
            Nie masz konta?{" "}
            <Link href="/signup" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
              Zarejestruj się
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
