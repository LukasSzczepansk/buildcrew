"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthFormState } from "@/server/actions/auth";
import { logoutAction, resendVerificationAction } from "@/server/actions/auth";

type VerificationStatus = {
  authenticated?: boolean;
  verified?: boolean;
  redirectTo?: string;
};

export function VerificationWaitingRoom({
  email,
  initialCooldown = false,
}: {
  email: string;
  initialCooldown?: boolean;
}) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [cooldown, setCooldown] = useState(initialCooldown ? 60 : 0);
  const redirectTimer = useRef<number | null>(null);
  const [state, resendAction, resendPending] = useActionState<AuthFormState, FormData>(
    async (_previousState, _formData) => resendVerificationAction(),
    {},
  );

  useEffect(() => {
    if (!state.success) return;
    setCooldown(60);
  }, [state.success]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;

    async function checkStatus() {
      try {
        const response = await fetch("/api/auth/verification-status", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (cancelled) return;

        if (response.status === 401) {
          setChecking(false);
          return;
        }

        if (!response.ok) {
          setChecking(false);
          return;
        }

        const data = (await response.json()) as VerificationStatus;
        setChecking(false);

        if (data.verified) {
          setVerified(true);
          if (pollTimer) window.clearTimeout(pollTimer);
          redirectTimer.current = window.setTimeout(() => {
            router.replace(data.redirectTo || "/onboarding");
            router.refresh();
          }, 900);
          return;
        }
      } catch {
        if (!cancelled) setChecking(false);
      }

      if (!cancelled) pollTimer = window.setTimeout(checkStatus, 2500);
    }

    void checkStatus();

    function checkWhenVisible() {
      if (document.visibilityState === "visible" && !cancelled) void checkStatus();
    }

    window.addEventListener("focus", checkWhenVisible);
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
      window.removeEventListener("focus", checkWhenVisible);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [router]);

  if (verified) {
    return (
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Weryfikacja konta</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)]">E-mail zweryfikowany</h1>
        <div className="mt-6 border-y border-[var(--bc-line)] py-5">
          <div className="flex items-center gap-2.5 text-[14px] font-medium text-[var(--bc-ink)]">
            <Check className="h-4 w-4 text-[#2F7D4A]" aria-hidden="true" />
            Adres został potwierdzony.
          </div>
          <p className="mt-2 text-sm leading-5 text-[var(--bc-muted)]">Przechodzimy do konfiguracji Twojego profilu…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Weryfikacja konta</p>
      <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)]">Sprawdź swoją skrzynkę</h1>
      <p className="mt-3 text-[14px] leading-6 text-[var(--bc-muted)]">
        Wysłaliśmy link potwierdzający na <span className="font-medium text-[var(--bc-ink)]">{email}</span>.
      </p>

      <div className="mt-6 border-y border-[var(--bc-line)] py-5">
        <div className="flex items-center gap-2.5 text-[14px] font-medium text-[var(--bc-ink)]">
          <span className="h-2 w-2 shrink-0 bg-[var(--bc-accent)]" aria-hidden="true" />
          Oczekujemy na potwierdzenie
          {checking ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[var(--bc-faint)]" aria-hidden="true" /> : null}
        </div>
        <p className="mt-2 max-w-[360px] text-sm leading-5 text-[var(--bc-muted)]">
          Możesz zostawić tę kartę otwartą. Po kliknięciu linku w e-mailu BuildCrew wykryje weryfikację i automatycznie przejdzie dalej.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <form action={resendAction}>
          <Button type="submit" variant="outline" className="w-full" disabled={resendPending || cooldown > 0}>
            {resendPending
              ? "Wysyłamy…"
              : cooldown > 0
                ? `Wyślij ponownie za ${cooldown}s`
                : "Wyślij link ponownie"}
          </Button>
        </form>

        {state.error ? <p className="text-[13px] leading-5 text-red-600 dark:text-red-400">{state.error}</p> : null}
        {state.success ? <p className="text-[13px] leading-5 text-[#2F7D4A] dark:text-lime-300">{state.success}</p> : null}

        <p className="text-[13px] leading-5 text-[var(--bc-faint)]">
          Nie widzisz wiadomości? Sprawdź folder Spam lub Oferty.
        </p>

        <form action={logoutAction}>
          <button type="submit" className="text-[13px] font-medium text-[var(--bc-muted)] underline-offset-4 hover:text-[var(--bc-ink)] hover:underline">
            Zły adres e-mail? Wróć do logowania
          </button>
        </form>
      </div>
    </div>
  );
}
