import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AnalyticsEvent } from "@/components/analytics/analytics-event";
import { getCurrentUser } from "@/lib/auth";
import { safeInternalRedirect } from "@/lib/redirects";
import { signupAction } from "@/server/actions/auth";
import { getRequestLocale } from "@/lib/site-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Create account - BuildCrew" : "Załóż konto - BuildCrew" };
}

const GOOGLE_ERRORS: Record<string, string> = {
  "account-missing": "Nie masz jeszcze konta BuildCrew. Możesz utworzyć je przez Google poniżej.",
  "access-denied": "Rejestracja przez Google została anulowana.",
  state: "Sesja Google wygasła. Spróbuj ponownie.",
  failed: "Nie udało się utworzyć konta przez Google. Spróbuj ponownie.",
  unverified: "Google nie potwierdził adresu e-mail tego konta.",
  conflict: "Nie udało się bezpiecznie połączyć konta Google z BuildCrew.",
  "not-configured": "Rejestracja przez Google nie jest jeszcze skonfigurowana.",
};

const GOOGLE_ERRORS_EN: Record<string, string> = {
  "account-missing": "You do not have a BuildCrew account yet. Create one with Google below.",
  "access-denied": "Google sign-in was cancelled.",
  state: "Your Google sign-in session expired. Please try again.",
  failed: "Google sign-in failed. Please try again.",
  unverified: "Google did not verify the email address for this account.",
  conflict: "We could not safely link this Google account to BuildCrew.",
  suspended: "This account has been suspended.",
  "admin-email": "Admin login requires working email delivery.",
  "not-configured": "Google sign-in is not configured yet.",
};

const GITHUB_ERRORS_PL: Record<string, string> = {
  "account-missing": "Nie masz jeszcze konta BuildCrew. Możesz utworzyć je przez GitHub poniżej.",
  "access-denied": "Rejestracja przez GitHub została anulowana.",
  state: "Sesja GitHub wygasła. Spróbuj ponownie.",
  failed: "Nie udało się utworzyć konta przez GitHub. Spróbuj ponownie.",
  email: "GitHub nie udostępnił zweryfikowanego adresu e-mail dla tego konta.",
  conflict: "Nie udało się bezpiecznie połączyć konta GitHub z BuildCrew.",
  suspended: "To konto zostało zawieszone.",
  "admin-email": "Logowanie administratora wymaga działającej wysyłki e-mail.",
  "not-configured": "Rejestracja przez GitHub nie jest jeszcze skonfigurowana.",
};

const GITHUB_ERRORS: Record<string, string> = {
  "account-missing": "You do not have a BuildCrew account yet. Create one with GitHub below.",
  "access-denied": "GitHub sign-in was cancelled.",
  state: "Your GitHub sign-in session expired. Please try again.",
  failed: "GitHub sign-in failed. Please try again.",
  email: "GitHub did not provide a verified email address for this account.",
  conflict: "We could not safely link this GitHub account to BuildCrew.",
  suspended: "This account has been suspended.",
  "admin-email": "Admin login requires working email delivery.",
  "not-configured": "GitHub sign-in is not configured yet.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string | string[]; github?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const locale = await getRequestLocale();
  const en = locale === "en";
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = rawNext ? safeInternalRedirect(rawNext, "/dashboard") : undefined;

  const user = await getCurrentUser();
  if (user) redirect(!user.emailVerified ? "/verify-email" : user.onboardingCompleted ? (nextPath ?? "/dashboard") : "/onboarding");

  const googleCode = Array.isArray(params.google) ? params.google[0] : params.google;
  const githubCode = Array.isArray(params.github) ? params.github[0] : params.github;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
  // Keep GitHub visible in the UI. The OAuth route itself handles missing configuration
  // and returns a clear error until GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are set.
  const githubEnabled = true;

  return (
    <div>
      <AnalyticsEvent name="signup_view" params={{ locale }} />
      <h1 className="mb-1 text-2xl font-bold tracking-tight">{en ? "Join BuildCrew" : "Dołącz do BuildCrew"}</h1>
      <p className="mb-6 text-sm text-neutral-500">{en ? "Find people and build something together from scratch." : "Znajdź ludzi i zbudujcie coś razem od zera."}</p>
      <AuthForm
        mode="signup"
        action={signupAction}
        googleEnabled={googleEnabled}
        githubEnabled={githubEnabled}
        externalError={googleCode ? (en ? GOOGLE_ERRORS_EN[googleCode] : GOOGLE_ERRORS[googleCode]) : githubCode ? (en ? GITHUB_ERRORS[githubCode] : GITHUB_ERRORS_PL[githubCode]) : undefined}
        nextPath={nextPath}
      />
    </div>
  );
}
