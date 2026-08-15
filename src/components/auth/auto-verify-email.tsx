"use client";

import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthFormState } from "@/server/actions/auth";
import { verifyEmailAction } from "@/server/actions/auth";

export function AutoVerifyEmail({ token, nextPath }: { token: string; nextPath?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(verifyEmailAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => formRef.current?.requestSubmit(), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <div className="border-y border-[var(--bc-line)] py-5">
        <div className="flex items-center gap-2.5 text-[14px] font-medium text-[var(--bc-ink)]">
          <LoaderCircle className="h-4 w-4 animate-spin text-[var(--bc-muted)]" aria-hidden="true" />
          {pending ? "Potwierdzamy adres e-mail…" : state.error ? "Nie udało się potwierdzić adresu" : "Potwierdzamy adres e-mail…"}
        </div>
        <p className="mt-2 text-sm leading-5 text-[var(--bc-muted)]">
          Nie zamykaj tej karty. Po poprawnej weryfikacji przejdziemy dalej automatycznie.
        </p>
      </div>

      {state.error ? (
        <div className="space-y-3">
          <p className="text-sm leading-5 text-red-600 dark:text-red-400">{state.error}</p>
          <Button type="submit" className="w-full" disabled={pending}>
            Spróbuj ponownie
          </Button>
        </div>
      ) : (
        <Button type="submit" className="sr-only" tabIndex={-1} disabled={pending}>
          Potwierdź e-mail
        </Button>
      )}
    </form>
  );
}
