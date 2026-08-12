import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { safeInternalRedirect } from "@/lib/redirects";
import { signupAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Załóż konto — BuildCrew" };

const GOOGLE_ERRORS: Record<string, string> = {
  "account-missing": "Nie masz jeszcze konta BuildCrew. Możesz je utworzyć przez Google poniżej.",
  "access-denied": "Rejestracja przez Google została anulowana.",
  state: "Sesja Google wygasła. Spróbuj ponownie.",
  failed: "Nie udało się utworzyć konta przez Google. Spróbuj ponownie.",
  unverified: "Google nie potwierdził adresu e-mail tego konta.",
  conflict: "Nie udało się bezpiecznie połączyć konta Google z BuildCrew.",
  "not-configured": "Rejestracja przez Google nie jest jeszcze skonfigurowana.",
};

export default async function SignupPage({
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
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Dołącz do BuildCrew</h1>
      <p className="mb-6 text-sm text-neutral-500">Znajdź ludzi i zbuduj z nimi coś od zera.</p>
      <AuthForm
        mode="signup"
        action={signupAction}
        googleEnabled={googleEnabled}
        externalError={googleCode ? GOOGLE_ERRORS[googleCode] : undefined}
        nextPath={nextPath}
      />
    </div>
  );
}
