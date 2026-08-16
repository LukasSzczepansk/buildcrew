import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { safeInternalRedirect } from "@/lib/redirects";
import { loginAction } from "@/server/actions/auth";
import { getRequestLocale } from "@/lib/site-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Log in - BuildCrew" : "Log in - BuildCrew" };
}

const GOOGLE_ERRORS: Record<string, string> = {
  "access-denied": "Google sign-in was canceled.",
  state: "The Google sign-in session expired. Try again.",
  failed: "Could not sign in with Google. Try again.",
  unverified: "Google did not verify the email address for this account.",
  conflict: "Could not securely connect the Google account to BuildCrew.",
  suspended: "This account has been suspended by an administrator.",
  "admin-email": "Administrator sign-in requires email delivery to be configured.",
  "not-configured": "Google sign-in is not configured yet.",
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const locale = await getRequestLocale();
  const en = locale === "en";
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = rawNext ? safeInternalRedirect(rawNext, "/dashboard") : undefined;

  const user = await getCurrentUser();
  if (user) redirect(!user.emailVerified ? "/verify-email" : user.onboardingCompleted ? (nextPath ?? "/dashboard") : "/onboarding");

  const googleCode = Array.isArray(params.google) ? params.google[0] : params.google;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">{en ? "Welcome back" : "Welcome back"}</h1>
      <p className="mb-6 text-sm text-neutral-500">{en ? "Log in to get back to building." : "Log in to get back to building."}</p>
      <AuthForm
        mode="login"
        action={loginAction}
        googleEnabled={googleEnabled}
        externalError={googleCode ? (en ? GOOGLE_ERRORS_EN[googleCode] : GOOGLE_ERRORS[googleCode]) : undefined}
        nextPath={nextPath}
      />
    </div>
  );
}
