"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/server/actions/auth";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5">
      <path fill="currentColor" d="M21.35 12.18c0-.73-.06-1.27-.2-1.83H12v3.52h5.37a4.7 4.7 0 0 1-1.99 2.99l-.03.12 2.89 2.23.2.02c1.83-1.69 2.91-4.18 2.91-7.05Z" />
      <path fill="currentColor" d="M12 21.7c2.62 0 4.82-.86 6.43-2.47l-3.06-2.37c-.82.56-1.92.95-3.37.95a5.85 5.85 0 0 1-5.53-4.04l-.12.01-3 2.32-.04.11A9.7 9.7 0 0 0 12 21.7Z" opacity=".78" />
      <path fill="currentColor" d="M6.47 13.77A5.98 5.98 0 0 1 6.14 12c0-.62.11-1.22.32-1.77v-.12L3.42 7.75l-.1.05A9.7 9.7 0 0 0 2.3 12c0 1.51.36 2.94 1.01 4.2l3.16-2.43Z" opacity=".58" />
      <path fill="currentColor" d="M12 6.19c1.82 0 3.05.78 3.75 1.43l2.74-2.67C16.81 3.39 14.62 2.3 12 2.3a9.7 9.7 0 0 0-8.69 5.5l3.15 2.43A5.87 5.87 0 0 1 12 6.19Z" opacity=".9" />
    </svg>
  );
}


function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
      <path d="M12 .7A11.3 11.3 0 0 0 8.43 22.72c.57.1.78-.25.78-.55v-2.16c-3.18.69-3.85-1.35-3.85-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.54-.29-5.21-1.27-5.21-5.59 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3 0 0 .96-.31 3.12 1.16A10.8 10.8 0 0 1 12 6.04c.97 0 1.93.13 2.84.38 2.16-1.47 3.11-1.16 3.11-1.16.63 1.55.24 2.71.12 3 .73.79 1.17 1.8 1.17 3.04 0 4.33-2.68 5.3-5.23 5.58.41.36.78 1.06.78 2.13v3.16c0 .3.21.66.79.55A11.3 11.3 0 0 0 12 .7Z"/>
    </svg>
  );
}

export function AuthForm({
  mode,
  action,
  externalError,
  nextPath,
  googleEnabled = true,
  githubEnabled = false,
}: {
  mode: "login" | "signup";
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  googleEnabled?: boolean;
  githubEnabled?: boolean;
  externalError?: string;
  nextPath?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, {});
  const copy = useCopy();
  const locale = useLocale();

  return (
    <div className="space-y-5">
      {externalError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {externalError}
        </p>
      )}

      {(googleEnabled || githubEnabled) ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {googleEnabled ? (
              <Button asChild variant="outline" className="w-full" size="lg">
                <a href={`/api/auth/google?intent=${mode}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`}>
                  <GoogleIcon />
                  Google
                </a>
              </Button>
            ) : null}
            {githubEnabled ? (
              <Button asChild variant="outline" className="w-full" size="lg">
                <a href={`/api/auth/github?intent=${mode}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`}>
                  <GitHubIcon />
                  GitHub
                </a>
              </Button>
            ) : null}
          </div>
          {mode === "signup" ? (
            <p className="-mt-2 text-center text-[13px] leading-5 text-neutral-500">
              {copy("Kontynuując przez Google lub GitHub, akceptujesz", "By continuing with a provider, you accept the")} {" "}
              <Link href="/terms" className="text-lime-600 hover:underline dark:text-lime-400">{copy("Regulamin", "Terms")}</Link>{" "}
              {copy("i potwierdzasz zapoznanie się z", "and acknowledge the")} {" "}
              <Link href="/privacy" className="text-lime-600 hover:underline dark:text-lime-400">{copy("Polityką prywatności", "Privacy Policy")}</Link>.
            </p>
          ) : null}
          <div className="flex items-center gap-3 text-[13px] text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            {copy("lub e-mail i hasło", "or email and password")}
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="flex flex-col gap-5">
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder={copy("ty@przyklad.pl", "you@example.com")} required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{copy("Hasło", "Password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={mode === "signup" ? 12 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          {mode === "signup" && <p className="text-[13px] text-neutral-400">{copy("Minimum 12 znaków.", "At least 12 characters.")}</p>}
        </div>

        {mode === "signup" && (
          <label className="flex items-start gap-2.5 text-[13px] leading-5 text-neutral-600 dark:text-neutral-400">
            <input
              name="acceptTerms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-neutral-300 accent-lime-600"
            />
            <span>
              {copy("Akceptuję", "I accept the")} {" "}
              <Link href={copy("/regulamin", "/terms")} className="font-medium text-lime-600 hover:underline dark:text-lime-400">{copy("Regulamin", "Terms")}</Link>
              {" "}{copy("i potwierdzam zapoznanie się z", "and acknowledge the")} {" "}
              <Link href={copy("/polityka-prywatnosci", "/privacy")} className="font-medium text-lime-600 hover:underline dark:text-lime-400">{copy("Polityką prywatności", "Privacy Policy")}</Link>.
            </span>
          </label>
        )}

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {appMessage(state.error, locale)}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending ? copy("Chwileczkę…", "Please wait…") : mode === "signup" ? copy("Utwórz konto", "Create account") : copy("Zaloguj się", "Log in")}
        </Button>

        {mode === "login" && (
          <p className="-mt-2 text-right text-[13px]">
            <Link href="/forgot-password" className="text-lime-600 hover:underline dark:text-lime-400">{copy("Nie pamiętam hasła", "Forgot password?")}</Link>
          </p>
        )}

        <p className="text-center text-sm text-neutral-500">
          {mode === "signup" ? (
            <>
              {copy("Masz już konto?", "Already have an account?")} {" "}
              <Link href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"} className="font-medium text-lime-600 hover:underline dark:text-lime-400">{copy("Zaloguj się", "Log in")}</Link>
            </>
          ) : (
            <>
              {copy("Nie masz konta?", "Don’t have an account?")} {" "}
              <Link href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"} className="font-medium text-lime-600 hover:underline dark:text-lime-400">{copy("Zarejestruj się", "Sign up")}</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
