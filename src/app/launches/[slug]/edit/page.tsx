import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LaunchForm } from "@/components/launches/launch-form";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getLaunchBySlug, listLaunchProjectOptions } from "@/server/data/launches";

export const metadata: Metadata = { title: "Edytuj premierę - BuildCrew", robots: { index: false, follow: false } };
export default async function EditLaunchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/launches/${slug}/edit`)}`);
  const [locale, launch, projects] = await Promise.all([getRequestLocale(), getLaunchBySlug(slug, user.id), listLaunchProjectOptions(user.id)]);
  if (!launch) notFound();
  if (launch.creatorId !== user.id) redirect(`/launches/${launch.slug}`);
  return <div><Topbar title={locale === "en" ? "Edit launch" : "Edytuj premierę"} subtitle={locale === "en" ? "Update your project presentation without changing the underlying BuildCrew project." : "Zaktualizuj prezentację projektu bez zmieniania samego projektu BuildCrew."} /><div className="max-w-[1040px]"><Link href={`/launches/${launch.slug}`} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"><ArrowLeft className="h-3.5 w-3.5" />{locale === "en" ? "Back to project" : "Wróć do projektu"}</Link><div className="mt-5" /><LaunchForm locale={locale} projects={projects} initial={{ id: launch.id, slug: launch.slug, projectId: launch.projectId, title: launch.title, tagline: launch.tagline, description: launch.description, liveUrl: launch.liveUrl, githubUrl: launch.githubUrl, category: launch.category, status: launch.status, technologies: launch.technologies, needs: launch.needs, images: launch.images.map((image) => ({ id: image.id })) }} /></div></div>;
}
