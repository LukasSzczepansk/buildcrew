import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Onboarding — BuildCrew" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");
  if (user.onboardingCompleted) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-4 py-12 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <div className="mb-8 flex justify-center">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30">
            🛠️
          </span>
          BuildCrew
        </span>
      </div>
      <OnboardingWizard />
    </div>
  );
}
