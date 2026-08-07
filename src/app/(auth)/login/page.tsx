import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { loginAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Zaloguj się — BuildCrew" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(!user.emailVerified ? "/verify-email" : user.onboardingCompleted ? "/dashboard" : "/onboarding");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Witaj z powrotem</h1>
      <p className="mb-6 text-sm text-neutral-500">Zaloguj się, aby wrócić do budowania.</p>
      <AuthForm mode="login" action={loginAction} />
    </div>
  );
}
