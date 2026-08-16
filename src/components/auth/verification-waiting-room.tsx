"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthFormState } from "@/server/actions/auth";
import { logoutAction, resendVerificationAction } from "@/server/actions/auth";
import { useCopy } from "@/components/i18n/locale-provider";

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
  const copy = useCopy();
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
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Weryfikacja konta", "Account verification")}</p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)]">{copy("E-mail zweryfikowany", "Email verified")}</h1>
        <div className="mt-6 border-y border-[var(--bc-line)] py-5">
          <div className="flex items-center gap-2.5 text-[14px] font-medium text-[var(--bc-ink)]">
            <Check className="h-4 w-4 text-[#2F7D4A]" aria-hidden="true" />
            {copy("Adres został potwierdzony.", "Your email address has been confirmed.")}
          </div>
          <p className="mt-2 text-sm leading-5 text-[var(--bc-muted)]">{copy("Przechodzimy do konfiguracji Twojego profilu…", "Taking you to profile setup…")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">{copy("Weryfikacja konta", "Account verification")}</p>
      <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)]">{copy("Sprawdź swoją skrzynkę", "Check your inbox")}</h1>
      <p className="mt-3 text-[14px] leading-6 text-[var(--bc-muted)]">
        {copy("Wysłaliśmy link potwierdzający na", "We sent a confirmation link to")} <span className="font-medium text-[var(--bc-ink)]">{email}</span>.
      </p>

      <div className="mt-6 border-y border-[var(--bc-line)] py-5">
        <div className="flex items-center gap-2.5 text-[14px] font-medium text-[var(--bc-ink)]">
          <span className="h-2 w-2 shrink-0 bg-[var(--bc-accent)]" aria-hidden="true" />
          {copy("Oczekujemy na potwierdzenie", "Waiting for confirmation")}
          {checking ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[var(--bc-faint)]" aria-hidden="true" /> : null}
        </div>
        <p className="mt-2 max-w-[360px] text-sm leading-5 text-[var(--bc-muted)]">
          {copy("Możesz zostawić tę kartę otwartą. Po kliknięciu linku w e-mailu BuildCrew wykryje weryfikację i automatycznie przejdzie dalej.", "You can keep this tab open. After you click the link in the email, BuildCrew will detect the verification and continue automatically.")}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <form action={resendAction}>
          <Button type="submit" variant="outline" className="w-full" disabled={resendPending || cooldown > 0}>
            {resendPending
              ? copy("Wysyłamy…", "Sending…")
              : cooldown > 0
                ? copy(`Wyślij ponownie za ${cooldown}s`, `Send again in ${cooldown}s`)
                : copy("Wyślij link ponownie", "Send link again")}
          </Button>
        </form>

        {state.error ? <p className="text-[13px] leading-5 text-red-600 dark:text-red-400">{state.error}</p> : null}
        {state.success ? <p className="text-[13px] leading-5 text-[#2F7D4A] dark:text-lime-300">{state.success}</p> : null}

        <p className="text-[13px] leading-5 text-[var(--bc-faint)]">
          {copy("Nie widzisz wiadomości? Sprawdź folder Spam lub Oferty.", "Can’t find the message? Check your Spam or Promotions folder.")}
        </p>

        <form action={logoutAction}>
          <button type="submit" className="text-[13px] font-medium text-[var(--bc-muted)] underline-offset-4 hover:text-[var(--bc-ink)] hover:underline">
            {copy("Zły adres e-mail? Wróć do logowania", "Wrong email address? Back to login")}
          </button>
        </form>
      </div>
    </div>
  );
}
