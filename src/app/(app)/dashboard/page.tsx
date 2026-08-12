import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ExternalLink, MessageCircle, Rocket, Search, Sparkles, Trophy, Users } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { BuilderCard } from "@/components/builders/builder-card";
import { getCurrentUser } from "@/lib/auth";
import { computeMatch } from "@/lib/matching";
import { AI_CONTEST, DISCORD_INVITE_URL, isAiContestActive } from "@/lib/community";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { listProjects } from "@/server/data/projects";
import type { Commitment, Goal, Level, RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Start — BuildCrew" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getProfileByUserId(user.id);
  if (!profile) redirect("/onboarding");

  const [allProjects, allBuilders] = await Promise.all([listProjects(), listBuilderProfiles(user.id)]);

  const matchingProjects = allProjects
    .filter((p) => p.ownerId !== user.id)
    .filter((p) => p.openRoles.some((r) => r.roleType === profile.role) || p.interests.some((i) => profile.interests.includes(i)))
    .slice(0, 3);
  const fallbackProjects = matchingProjects.length > 0 ? matchingProjects : allProjects.filter((p) => p.ownerId !== user.id).slice(0, 3);

  const matchingBuilders = allBuilders
    .filter((builder) => builder.onboardingCompleted)
    .map((builder) => ({
      builder,
      match: computeMatch(
        { userId: profile.userId, username: profile.username, role: profile.role as RoleType | null, level: profile.level as Level | null, weeklyHours: profile.weeklyHours as Commitment | null, interests: profile.interests, goals: profile.goals as Goal[] },
        { userId: builder.userId, username: builder.username, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, interests: builder.interests, goals: builder.goals as Goal[] },
      ),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 3);

  return (
    <div>
      <Topbar />
      <div className="flex flex-col gap-5 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-neutral-950 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">Cześć, {profile.username}! 👋</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Nie potrzebujesz gotowego projektu. Potrzebujesz ludzi, z którymi możesz go stworzyć.</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">Wybierz, na jakim etapie jesteś. BuildCrew ma pomóc Ci dojść od „chcę coś zrobić” do małej ekipy, która naprawdę zaczyna budować.</p>
        </div>
        <Button asChild size="lg" className="shrink-0 gap-2"><Link href="/build"><Users className="h-4 w-4" /> Znajdź mi ekipę</Link></Button>
      </div>

      {isAiContestActive() ? (
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Trophy className="h-4 w-4" /></span>
            <div><p className="text-sm font-semibold">Konkurs: projekt z AI · {AI_CONTEST.prize}</p><p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">Masz czas do {AI_CONTEST.deadlineLabel}. Szczegóły, zasady i zgłoszenia znajdziesz na Discordzie BuildCrew.</p></div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-amber-900 dark:text-amber-200"><MessageCircle className="h-4 w-4" /> Discord <ExternalLink className="h-3.5 w-3.5" /></span>
        </a>
      ) : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <BigActionCard emoji="💡" title="Mam pomysł" description="Znajdź współtwórców, nie wykonawców." cta="Dodaj projekt" href="/projects/new" />
        <BigActionCard emoji="🔎" title="Chcę dołączyć" description="Znajdź ekipę, której kierunek Ci odpowiada." cta="Przeglądaj projekty" href="/projects" />
        <BigActionCard emoji="🤝" title="Chcę coś zbudować" description="Nie musisz mieć pomysłu. Zacznij od ludzi." cta="Wejdź do Build Pool" href="/build" />
      </div>

      {matchingBuilders.length > 0 ? (
        <div className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Sparkles className="h-4 w-4 text-violet-600" /> Ludzie, z którymi możesz coś zacząć</h2>
              <p className="mt-1 text-sm text-neutral-400">Dopasowanie z obecnych danych Twojego profilu.</p>
            </div>
            <Link href="/builders" className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">Zobacz wszystkich <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matchingBuilders.map(({ builder: b, match }) => (
              <BuilderCard
                key={b.userId}
                matchScore={match.score}
                matchReasons={match.reasons}
                builder={{ userId: b.userId, username: b.username, avatarEmoji: b.avatarEmoji, role: b.role as RoleType | null, level: b.level as Level | null, weeklyHours: b.weeklyHours as Commitment | null, skills: b.skills, interests: b.interests, lookingFor: b.lookingFor, lastActiveAt: b.lastActiveAt }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-lg font-semibold tracking-tight">Projekty, do których możesz dołączyć</h2><p className="mt-1 text-sm text-neutral-400">Jeśli wolisz zacząć od czegoś, co już powstaje.</p></div>
          <Link href="/projects" className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">Zobacz wszystkie <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        {fallbackProjects.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{fallbackProjects.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
        ) : (
          <Card className="p-10 text-center text-sm text-neutral-400">Nie ma jeszcze projektu dla Ciebie. To dobry moment, żeby wejść do Build Pool i zacząć od znalezienia ludzi.</Card>
        )}
      </div>
    </div>
  );
}

function BigActionCard({ emoji, title, description, cta, href }: { emoji: string; title: string; description: string; cta: string; href: string }) {
  const icon = title.includes("Mam pomysł") ? Rocket : title.includes("dołączyć") ? Search : Sparkles;
  const Icon = icon;
  return (
    <Card className="flex flex-col justify-between gap-4 bg-gradient-to-br from-white to-violet-50/40 p-6 transition-all hover:-translate-y-0.5 hover:shadow-md dark:from-neutral-900 dark:to-violet-950/20">
      <div><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-xl dark:bg-violet-500/10">{emoji}</div><h3 className="font-semibold tracking-tight">{title}</h3><p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p></div>
      <Button asChild className="w-full gap-2"><Link href={href}><Icon className="h-4 w-4" /> {cta}</Link></Button>
    </Card>
  );
}
