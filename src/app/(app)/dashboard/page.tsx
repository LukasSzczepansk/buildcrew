import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ExternalLink, MessageCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
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
    .filter((project) => project.ownerId !== user.id)
    .filter((project) => project.openRoles.some((role) => role.roleType === profile.role) || project.interests.some((interest) => profile.interests.includes(interest)))
    .slice(0, 4);
  const fallbackProjects = matchingProjects.length > 0 ? matchingProjects : allProjects.filter((project) => project.ownerId !== user.id).slice(0, 4);

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
      <Topbar title="Start" subtitle={`Dzień dobry, ${profile.username}. Tu masz najważniejsze rzeczy do sprawdzenia.`} />

      <section className="grid gap-5 border-b border-[var(--bc-line)] pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Na teraz</p>
          <h2 className="mt-2 max-w-2xl text-[22px] font-semibold leading-7 tracking-[-0.018em] sm:text-[24px]">
            {matchingBuilders.length > 0 || fallbackProjects.length > 0
              ? `Masz ${matchingBuilders.length} ${matchingBuilders.length === 1 ? "osobę" : "osoby"} i ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "projekt" : "projekty"} warte sprawdzenia.`
              : "Nie ma teraz nowych dopasowań. Możesz rozpocząć od własnego projektu albo Build Pool."}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium">
          <Link href="/builders" className="underline decoration-[#c8f169] decoration-[3px] underline-offset-4 hover:decoration-[var(--bc-ink)]">Znajdź ludzi</Link>
          <Link href="/projects" className="text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">Przeglądaj projekty</Link>
          <Link href="/projects/new" className="text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">Dodaj projekt</Link>
        </div>
      </section>

      {isAiContestActive() ? (
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center justify-between gap-4 border-l-2 border-[#c8f169] pl-4 text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">
          <span><strong className="font-semibold text-[var(--bc-ink)]">{AI_CONTEST.title}</strong> · do {AI_CONTEST.deadlineLabel}</span>
          <span className="inline-flex items-center gap-1 font-medium">Discord <ExternalLink className="h-3 w-3" /></span>
        </a>
      ) : null}

      {matchingBuilders.length > 0 ? (
        <section className="mt-10">
          <SectionHeading title="Ludzie do rozmowy" description="Najbliższe dopasowania do Twojego profilu — wraz z powodem, dlaczego warto się odezwać." href="/builders" label="Wszyscy builderzy" />
          <div className="mt-4">
            {matchingBuilders.map(({ builder, match }) => (
              <BuilderCard
                key={builder.userId}
                matchScore={match.score}
                matchReasons={match.reasons}
                builder={{ userId: builder.userId, username: builder.username, avatarEmoji: builder.avatarEmoji, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, skills: builder.skills, interests: builder.interests, lookingFor: builder.lookingFor, lastActiveAt: builder.lastActiveAt }}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <SectionHeading title="Otwarte projekty" description="Projekty, które aktualnie szukają ludzi i pasują do Twojego profilu." href="/projects" label="Wszystkie projekty" />
        {fallbackProjects.length > 0 ? (
          <div className="mt-4">{fallbackProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
        ) : (
          <div className="mt-4 border-y border-[var(--bc-line)] py-8 text-sm text-[var(--bc-muted)]">Brak otwartych projektów. Możesz dodać własny albo wejść do Build Pool.</div>
        )}
      </section>

      <section className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--bc-line)] pt-6">
        <Link href="/build" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--bc-ink)] hover:underline">
          Build Pool <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">
          <MessageCircle className="h-3.5 w-3.5" /> Discord
        </a>
      </section>
    </div>
  );
}

function SectionHeading({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return (
    <div className="flex items-end justify-between gap-5">
      <div>
        <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.015em]">{title}</h2>
        <p className="mt-1 max-w-[680px] text-[12px] leading-5 text-[var(--bc-muted)]">{description}</p>
      </div>
      <Link href={href} className="hidden shrink-0 items-center gap-1.5 text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline sm:inline-flex">{label} <ArrowRight className="h-3.5 w-3.5" /></Link>
    </div>
  );
}
