import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ExternalLink, MessageCircle, Users2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProjectCard } from "@/components/projects/project-card";
import { BuilderCard } from "@/components/builders/builder-card";
import { Button } from "@/components/ui/button";
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
    .filter((project) => project.openRoles.some((role) => role.roleType === profile.role || role.skills.some((skill) => profile.skills.includes(skill))) || project.interests.some((interest) => profile.interests.includes(interest)))
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
      <Topbar title="Start" subtitle={`Dzień dobry, ${profile.username}. Najważniejsze rzeczy masz poniżej.`} />

      <section className="overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
        <div className="grid gap-5 px-5 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="bc-eyebrow-line min-w-0">
            <p className="bc-kicker">Na teraz</p>
            <h2 className="mt-2 max-w-[760px] text-[clamp(24px,2.4vw,32px)] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--bc-ink)]">
              {matchingBuilders.length > 0 || fallbackProjects.length > 0
                ? `Masz ${matchingBuilders.length} ${matchingBuilders.length === 1 ? "osobę" : "osoby"} i ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "projekt" : "projekty"} warte sprawdzenia.`
                : "Brak nowych dopasowań. Zacznij od projektu albo Build Pool."}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button asChild variant="secondary" size="sm"><Link href="/builders"><Users2 className="h-3.5 w-3.5" /> Znajdź ludzi</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/projects">Projekty</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/projects/new">Dodaj projekt</Link></Button>
          </div>
        </div>

        {isAiContestActive() ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-5 py-3 text-[12px] text-[var(--bc-muted)] md:px-6">
            <span><strong className="font-semibold text-[var(--bc-ink)]">{AI_CONTEST.shortTitle}</strong> <span className="mx-1 text-[var(--bc-faint)]">·</span> do {AI_CONTEST.deadlineLabel}</span>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium hover:text-[var(--bc-ink)]">Discord <ExternalLink className="h-3 w-3" /></a>
          </div>
        ) : null}
      </section>

      {matchingBuilders.length > 0 ? (
        <section className="mt-8">
          <SectionHeading title="Ludzie do rozmowy" href="/builders" label="Wszyscy builderzy" />
          <div className="mt-3 space-y-2.5">
            {matchingBuilders.map(({ builder, match }) => (
              <BuilderCard key={builder.userId} matchScore={match.score} matchReasons={match.reasons} builder={{ userId: builder.userId, username: builder.username, avatarEmoji: builder.avatarEmoji, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, skills: builder.skills, interests: builder.interests, lookingFor: builder.lookingFor, lastActiveAt: builder.lastActiveAt }} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeading title="Otwarte projekty" href="/projects" label="Wszystkie projekty" />
        {fallbackProjects.length > 0 ? <div className="mt-3 space-y-2.5">{fallbackProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <div className="mt-3 border-y border-[var(--bc-line)] py-7 text-sm text-[var(--bc-muted)]">Brak otwartych projektów.</div>}
      </section>

      <section className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--bc-line)] pt-5">
        <Link href="/build" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--bc-ink)] hover:underline">Build Pool <ArrowRight className="h-3.5 w-3.5" /></Link>
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline"><MessageCircle className="h-3.5 w-3.5" /> Discord</a>
      </section>
    </div>
  );
}

function SectionHeading({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.018em]">{title}</h2>
      <Link href={href} className="hidden shrink-0 items-center gap-1.5 text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline sm:inline-flex">{label} <ArrowRight className="h-3.5 w-3.5" /></Link>
    </div>
  );
}
