import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Rocket, Search, Sparkles } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { BuilderCard } from "@/components/builders/builder-card";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUserId } from "@/server/data/profiles";
import { listProjects } from "@/server/data/projects";
import { listBuilderProfiles } from "@/server/data/profiles";

export const metadata: Metadata = { title: "Start — BuildCrew" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getProfileByUserId(user.id);
  if (!profile) redirect("/onboarding");

  const allProjects = await listProjects();
  const matchingProjects = allProjects
    .filter((p) => p.ownerId !== user.id)
    .filter((p) => p.openRoles.some((r) => r.roleType === profile.role) || p.interests.some((i) => profile.interests.includes(i)))
    .slice(0, 3);

  const fallbackProjects = matchingProjects.length > 0 ? matchingProjects : allProjects.filter((p) => p.ownerId !== user.id).slice(0, 3);

  const builders = fallbackProjects.length === 0 ? (await listBuilderProfiles(user.id)).slice(0, 3) : [];

  return (
    <div>
      <Topbar />
      <h1 className="text-2xl font-bold tracking-tight">Cześć, {profile.username}! 👋</h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">Co dziś budujemy?</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <BigActionCard
          emoji="🚀"
          title="Mam projekt"
          description="Znajdź osoby, których potrzebujesz."
          cta="Dodaj projekt"
          href="/projects/new"
        />
        <BigActionCard
          emoji="🔎"
          title="Szukam projektu"
          description="Znajdź projekt pasujący do Twoich umiejętności."
          cta="Przeglądaj projekty"
          href="/projects"
        />
        <BigActionCard
          emoji="🤝"
          title="Nie mam pomysłu"
          description="Poznaj ludzi, którzy też chcą coś stworzyć od zera."
          cta="Przejdź do Build Pool"
          href="/build"
        />
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Dla Ciebie</h2>
          <Link href={fallbackProjects.length > 0 ? "/projects" : "/build"} className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">
            Zobacz wszystkie <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {fallbackProjects.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {fallbackProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : builders.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {builders.map((b) => (
              <BuilderCard key={b.userId} builder={b} />
            ))}
          </div>
        ) : (
          <Card className="p-10 text-center text-sm text-neutral-400">
            Jeszcze nic tu nie pasuje. Zajrzyj do Build Pool albo dodaj swój projekt.
          </Card>
        )}
      </div>
    </div>
  );
}

function BigActionCard({
  emoji,
  title,
  description,
  cta,
  href,
}: {
  emoji: string;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  const icon = title.includes("Mam projekt") ? Rocket : title.includes("Szukam") ? Search : Sparkles;
  const Icon = icon;
  return (
    <Card className="flex flex-col justify-between gap-4 bg-gradient-to-br from-white to-violet-50/40 p-6 dark:from-neutral-900 dark:to-violet-950/20">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-xl dark:bg-violet-500/10">
          {emoji}
        </div>
        <h3 className="font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
      <Button asChild className="w-full gap-2">
        <Link href={href}>
          <Icon className="h-4 w-4" /> {cta}
        </Link>
      </Button>
    </Card>
  );
}
