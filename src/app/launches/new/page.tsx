import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LaunchForm } from "@/components/launches/launch-form";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { listLaunchProjectOptions } from "@/server/data/launches";

export const metadata: Metadata = { title: "Pokaż projekt - BuildCrew", robots: { index: false, follow: false } };
export default async function NewLaunchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/launches/new");
  if (!user.emailVerified) redirect("/verify-email");
  if (!user.onboardingCompleted) redirect("/onboarding");
  const locale = await getRequestLocale();
  const projects = await listLaunchProjectOptions(user.id);
  return <div><Topbar title={locale === "en" ? "Show project" : "Pokaż projekt"} subtitle={locale === "en" ? "Publish what you built and ask the community for useful feedback." : "Pokaż, co zbudowałeś, i poproś społeczność o konkretny feedback."} /><div className="max-w-[1040px]"><Link href="/launches" className="inline-flex items-center gap-1.5 text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"><ArrowLeft className="h-3.5 w-3.5" />{locale === "en" ? "Back to launches" : "Wróć do premier"}</Link><div className="mt-5" /><LaunchForm locale={locale} projects={projects} /></div></div>;
}
