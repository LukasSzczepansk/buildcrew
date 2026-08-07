import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { signupAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Załóż konto — BuildCrew" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(!user.emailVerified ? "/verify-email" : user.onboardingCompleted ? "/dashboard" : "/onboarding");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Dołącz do BuildCrew</h1>
      <p className="mb-6 text-sm text-neutral-500">Znajdź ludzi i zbuduj z nimi coś od zera.</p>
      <AuthForm mode="signup" action={signupAction} />
    </div>
  );
}
