import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { safeInternalRedirect } from "@/lib/redirects";
import { loginAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Zaloguj się - BuildCrew" };

const GOOGLE_ERRORS: Record<string, string> = {
  "access-denied": "Logowanie przez Google zostało anulowane.",
  state: "Sesja logowania Google wygasła. Spróbuj ponownie.",
  failed: "Nie udało się zalogować przez Google. Spróbuj ponownie.",
  unverified: "Google nie potwierdził adresu e-mail tego konta.",
  conflict: "Nie udało się bezpiecznie połączyć konta Google z BuildCrew.",
  suspended: "To konto zostało zawieszone przez administrację.",
  "admin-email": "Logowanie administratora wymaga działającej wysyłki e-mail.",
  "not-configured": "Logowanie Google nie jest jeszcze skonfigurowane.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = rawNext ? safeInternalRedirect(rawNext, "/dashboard") : undefined;

  const user = await getCurrentUser();
  if (user) redirect(!user.emailVerified ? "/verify-email" : user.onboardingCompleted ? (nextPath ?? "/dashboard") : "/onboarding");

  const googleCode = Array.isArray(params.google) ? params.google[0] : params.google;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Witaj z powrotem</h1>
      <p className="mb-6 text-sm text-neutral-500">Zaloguj się, aby wrócić do budowania.</p>
      <AuthForm
        mode="login"
        action={loginAction}
        googleEnabled={googleEnabled}
        externalError={googleCode ? GOOGLE_ERRORS[googleCode] : undefined}
        nextPath={nextPath}
      />
    </div>
  );
}
