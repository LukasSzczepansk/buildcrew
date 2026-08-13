import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hammer } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Onboarding — BuildCrew" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");
  if (user.onboardingCompleted) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#f7f7f3] px-4 py-10 dark:bg-neutral-950">
      <div className="mb-10 flex justify-center">
        <span className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.04em]">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-lime-300 text-neutral-950"><Hammer className="h-4 w-4" strokeWidth={2.5} /></span>
          BuildCrew
        </span>
      </div>
      <OnboardingWizard />
    </div>
  );
}
