import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hammer } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Quick setup - BuildCrew" : "Szybki start - BuildCrew",
    robots: { index: false, follow: false },
  };
}

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");
  if (user.onboardingCompleted) redirect("/dashboard");
  const locale = await getRequestLocale();
  const en = locale === "en";

  return (
    <div className="min-h-screen bg-[#f7f7f3] px-4 py-10 dark:bg-neutral-950">
      <div className="mx-auto mb-10 flex w-full max-w-[820px] items-center justify-between">
        <span className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.04em]">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-lime-300 text-neutral-950"><Hammer className="h-4 w-4" strokeWidth={2.5} /></span>
          BuildCrew
        </span>
        <LanguageSwitcher />
      </div>
      <div className="mb-6 text-center">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">{en ? "Three quick steps and you are in" : "Trzy krótkie kroki i jesteś w środku"}</h1>
        <p className="mx-auto mt-2 max-w-[560px] text-sm leading-5 text-[var(--bc-muted)]">
          {en
            ? "Add only the basics now. You can complete your bio, availability, links and portfolio later while using BuildCrew."
            : "Na start podaj tylko podstawy. Bio, dostępność, linki i portfolio uzupełnisz później podczas korzystania z BuildCrew."}
        </p>
      </div>
      <OnboardingWizard />
    </div>
  );
}
