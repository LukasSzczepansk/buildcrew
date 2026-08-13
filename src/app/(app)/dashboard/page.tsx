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
      <Topbar title="Start" />

      <section className="grid gap-6 border-b border-[#d8d8d0] pb-8 dark:border-neutral-700 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
        <div>
          <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">Dzień dobry, {profile.username}</p>
          <h2 className="mt-2 max-w-2xl text-[26px] font-semibold leading-[1.25] tracking-[-0.025em] sm:text-[30px]">
            Wybierz projekt albo człowieka i zacznij rozmowę.
          </h2>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#d8d8d0] border-y border-[#d8d8d0] py-3 text-center dark:divide-neutral-700 dark:border-neutral-700 lg:border-y-0 lg:py-0">
          <Stat value={String(fallbackProjects.length)} label="projekty" />
          <Stat value={String(matchingBuilders.length)} label="osoby" />
          <Stat value="3" label="drogi startu" />
        </div>
      </section>

      <nav className="flex flex-wrap gap-x-6 gap-y-2 border-b border-[#d8d8d0] py-4 text-[13px] font-medium dark:border-neutral-700">
        <Link href="/projects/new" className="underline decoration-[#c8f169] decoration-[3px] underline-offset-4 hover:decoration-neutral-950 dark:hover:decoration-white">Dodaj projekt</Link>
        <Link href="/projects" className="text-neutral-600 hover:text-neutral-950 hover:underline dark:text-neutral-400 dark:hover:text-white">Przeglądaj projekty</Link>
        <Link href="/build" className="text-neutral-600 hover:text-neutral-950 hover:underline dark:text-neutral-400 dark:hover:text-white">Wejdź do Build Pool</Link>
        <Link href="/builders" className="text-neutral-600 hover:text-neutral-950 hover:underline dark:text-neutral-400 dark:hover:text-white">Znajdź ludzi</Link>
      </nav>

      {isAiContestActive() ? (
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="mt-7 flex items-center justify-between gap-4 border-l-2 border-[#c8f169] pl-4 text-[12px] text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">
          <span><strong className="font-semibold text-neutral-800 dark:text-neutral-200">{AI_CONTEST.title}</strong> · do {AI_CONTEST.deadlineLabel}</span>
          <span className="inline-flex items-center gap-1 font-medium">Discord <ExternalLink className="h-3 w-3" /></span>
        </a>
      ) : null}

      {matchingBuilders.length > 0 ? (
        <section className="mt-10">
          <SectionHeading title="Ludzie do rozmowy" description="Najbliższe dopasowania do Twojego profilu." href="/builders" label="Wszyscy builderzy" />
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
        <SectionHeading title="Otwarte projekty" description="Projekty, które aktualnie szukają ludzi." href="/projects" label="Wszystkie projekty" />
        {fallbackProjects.length > 0 ? (
          <div className="mt-4">{fallbackProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
        ) : (
          <div className="mt-4 border-y border-[#d8d8d0] py-8 text-sm text-neutral-500 dark:border-neutral-700">Brak otwartych projektów. Możesz dodać własny albo wejść do Build Pool.</div>
        )}
      </section>

      <section className="mt-10 border-t border-[#d8d8d0] pt-6 dark:border-neutral-700">
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[13px] font-medium text-neutral-600 hover:text-neutral-950 hover:underline dark:text-neutral-400 dark:hover:text-white">
          <MessageCircle className="h-3.5 w-3.5" /> Społeczność na Discordzie <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><p className="text-[18px] font-semibold tabular-nums tracking-[-0.02em]">{value}</p><p className="mt-0.5 text-[10px] text-neutral-400">{label}</p></div>;
}

function SectionHeading({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return (
    <div className="flex items-end justify-between gap-5">
      <div>
        <h2 className="text-[18px] font-semibold tracking-[-0.015em]">{title}</h2>
        <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
      <Link href={href} className="hidden items-center gap-1.5 text-[12px] font-medium text-neutral-600 hover:text-neutral-950 hover:underline sm:inline-flex dark:text-neutral-400 dark:hover:text-white">{label} <ArrowRight className="h-3.5 w-3.5" /></Link>
    </div>
  );
}
