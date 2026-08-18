import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, MessageCircle, Users2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { DashboardVisitMarker } from "@/components/dashboard/dashboard-visit-marker";
import { ProjectCard } from "@/components/projects/project-card";
import { BuilderCard } from "@/components/builders/builder-card";
import { Button } from "@/components/ui/button";
import { FeedStoryCard } from "@/components/feed/feed-story-card";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getProfileCompletion } from "@/lib/profile-completion";
import { computeMatch } from "@/lib/matching";
import { computeProjectMatch } from "@/lib/project-matching";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { getDashboardSinceLastVisit } from "@/server/data/dashboard";
import { listNetworkActivity } from "@/server/data/network";
import { getDashboardAttention, listFollowedProjectUpdates, listRecentGlobalProjectUpdates } from "@/server/data/social-projects";
import { listProjects } from "@/server/data/projects";
import type { Commitment, Goal, Level, RoleType } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Home - BuildCrew" : "Start - BuildCrew" };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const locale = await getRequestLocale();
  const en = locale === "en";
  if (!user) redirect("/login");
  const profile = await getProfileByUserId(user.id);
  if (!profile) redirect("/onboarding");

  const [allProjects, allBuilders, attention, followedUpdates, globalUpdates, networkActivity, sinceLastVisit] = await Promise.all([
    listProjects({}, user.id),
    listBuilderProfiles(user.id),
    getDashboardAttention(user.id),
    listFollowedProjectUpdates(user.id, 5),
    listRecentGlobalProjectUpdates(5),
    listNetworkActivity(user.id, 5),
    getDashboardSinceLastVisit(user.id, 6),
  ]);
  const rankedProjects = allProjects
    .filter((project) => project.ownerId !== user.id)
    .map((project) => ({
      project,
      match: computeProjectMatch({
        role: profile.role, level: profile.level, weeklyHours: profile.weeklyHours, skills: profile.skills, interests: profile.interests,
        languages: profile.languages, country: profile.country, workModePreference: profile.workModePreference,
      }, {
        commitment: project.commitment, interests: project.interests, technologies: project.technologies, collaborationMode: project.collaborationMode,
        projectLanguage: project.projectLanguage, country: project.country, marketScope: project.marketScope,
        openRoles: project.openRoles.map((role) => ({ roleType: role.roleType, preferredLevel: role.preferredLevel, skills: role.skills })),
      }, locale),
    }))
    .sort((a, b) => b.match.score - a.match.score);
  const fallbackProjects = rankedProjects.slice(0, 4);
  const matchingBuilders = allBuilders
    .filter((builder) => builder.onboardingCompleted)
    .map((builder) => ({
      builder,
      match: computeMatch(
        { userId: profile.userId, username: profile.username, role: profile.role as RoleType | null, level: profile.level as Level | null, weeklyHours: profile.weeklyHours as Commitment | null, interests: profile.interests, goals: profile.goals as Goal[], skills: profile.skills, lookingFor: profile.lookingFor, languages: profile.languages, country: profile.country, workModePreference: profile.workModePreference, lastActiveAt: profile.lastActiveAt },
        { userId: builder.userId, username: builder.username, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, interests: builder.interests, goals: builder.goals as Goal[], skills: builder.skills, lookingFor: builder.lookingFor, languages: builder.languages, country: builder.country, workModePreference: builder.workModePreference, lastActiveAt: builder.lastActiveAt },
        locale,
      ),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 3);
  const activityUpdates = followedUpdates.length > 0 ? followedUpdates : globalUpdates;
  const completion = getProfileCompletion(profile, locale);

  return (
    <div>
      <Topbar title={en ? "Home" : "Start"} subtitle={en ? `Hi ${profile.username}. Discover people, projects and professional opportunities around what you build.` : `Cześć ${profile.username}. Odkrywaj ludzi, projekty i możliwości wokół tego, co budujesz.`} />
      <DashboardVisitMarker />

      {!completion.complete ? (
        <section className="mb-6 rounded-[8px] border border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] px-4 py-3.5 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-[var(--bc-ink)]">{en ? "Complete your profile for better matches" : "Uzupełnij profil, aby poprawić dopasowania"}</p>
              <span className="text-[12px] font-semibold tabular-nums text-[var(--bc-ink)]">{completion.score}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className="h-full rounded-full bg-[var(--bc-accent-strong)]" style={{ width: `${completion.score}%` }} /></div>
            <p className="mt-2 text-[12px] leading-5 text-[var(--bc-muted)]">{en ? "Still useful to add:" : "Warto jeszcze dodać:"} <span className="font-medium text-[var(--bc-ink)]">{completion.missing.slice(0, 3).join(" · ")}</span></p>
          </div>
          <Button asChild size="sm" className="mt-3 shrink-0 sm:mt-0"><Link href="/profile">{en ? "Complete profile" : "Uzupełnij profil"}</Link></Button>
        </section>
      ) : null}

      {sinceLastVisit.items.length > 0 ? (
        <section className="mb-6 border-y border-[var(--bc-line)] bg-[var(--bc-surface)]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--bc-line)] px-4 py-3.5">
            <div>
              <p className="bc-kicker">{en ? "Since your last visit" : "Od ostatniej wizyty"}</p>
              <h2 className="mt-1 text-[16px] font-semibold text-[var(--bc-ink)]">{sinceLastVisit.count} {en ? (sinceLastVisit.count === 1 ? "new item" : "new items") : (sinceLastVisit.count === 1 ? "nowa rzecz" : "nowe rzeczy")}</h2>
            </div>
            {sinceLastVisit.lastVisitedAt ? <p className="text-[11px] text-[var(--bc-faint)]">{en ? "since" : "od"} {sinceLastVisit.lastVisitedAt.toLocaleString(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p> : null}
          </div>
          <div className="divide-y divide-[var(--bc-line)]">
            {sinceLastVisit.items.slice(0, 4).map((item) => (
              <Link key={item.id} href={item.link ?? "/notifications"} className="grid gap-1 px-4 py-3 transition-colors hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--bc-ink)]">{item.title}</p>
                  {item.body ? <p className="mt-0.5 bc-truncate-2 text-[12px] leading-5 text-[var(--bc-muted)]">{item.body}</p> : null}
                </div>
                <span className="shrink-0 text-[11px] text-[var(--bc-faint)]">{item.createdAt.toLocaleTimeString(en ? "en-US" : "pl-PL", { hour: "2-digit", minute: "2-digit" })}</span>
              </Link>
            ))}
          </div>
          {sinceLastVisit.count > 4 ? <div className="border-t border-[var(--bc-line)] px-4 py-2.5"><Link href="/notifications" className="text-[12px] font-medium text-[var(--bc-ink)] hover:underline">{en ? "View all new items →" : "Zobacz wszystkie nowe →"}</Link></div> : null}
        </section>
      ) : null}

      <section className="mb-6 border-y border-[var(--bc-line)]">
        <div className="grid sm:grid-cols-3">
          <AttentionItem en={en} href="/messages" icon={<MessageCircle className="h-3.5 w-3.5" />} value={attention.unreadMessages} label={en ? "new messages" : "nowe wiadomości"} empty={en ? "No new messages" : "Brak nowych wiadomości"} />
          <AttentionItem en={en} href="/notifications" icon={<Bell className="h-3.5 w-3.5" />} value={attention.unreadNotifications} label={en ? "notifications" : "powiadomienia"} empty={en ? "Notifications checked" : "Powiadomienia sprawdzone"} />
          <AttentionItem en={en} href="/my-projects" icon={<Users2 className="h-3.5 w-3.5" />} value={attention.pendingApplications} label={en ? "new applications" : "nowe zgłoszenia"} empty={en ? "No new applications" : "Brak nowych zgłoszeń"} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
        <div className="grid gap-5 px-5 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="bc-eyebrow-line min-w-0">
            <p className="bc-kicker">{en ? "Right now" : "Na teraz"}</p>
            <h2 className="mt-2 max-w-[760px] text-[clamp(24px,2.4vw,32px)] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--bc-ink)]">
              {matchingBuilders.length > 0 || fallbackProjects.length > 0
                ? (en ? `You have ${matchingBuilders.length} ${matchingBuilders.length === 1 ? "person" : "people"} and ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "project" : "projects"} worth checking.` : `Masz ${matchingBuilders.length} ${matchingBuilders.length === 1 ? "osobę" : "osoby"} i ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "projekt" : "projekty"}, które warto sprawdzić.`)
                : (en ? "No new matches yet. Explore people or create a project." : "Brak nowych dopasowań. Odkryj ludzi albo utwórz projekt.")}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button asChild variant="secondary" size="sm"><Link href="/builders"><Users2 className="h-3.5 w-3.5" /> {en ? "Find people" : "Znajdź ludzi"}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/projects">{en ? "Projects" : "Projekty"}</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/projects/new">{en ? "Create project" : "Dodaj projekt"}</Link></Button>
          </div>
        </div>

      </section>

      {matchingBuilders.length > 0 ? (
        <section className="mt-8">
          <SectionHeading title={en ? "People worth meeting" : "Ludzie, których warto poznać"} href="/builders" label={en ? "All people" : "Wszyscy ludzie"} />
          <div className="mt-3 space-y-2.5">
            {matchingBuilders.map(({ builder, match }) => (
              <BuilderCard locale={locale} key={builder.userId} matchScore={match.score} matchReasons={match.reasons} builder={{ userId: builder.userId, username: builder.username, headline: builder.headline, avatarEmoji: builder.avatarEmoji, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, skills: builder.skills, interests: builder.interests, lookingFor: builder.lookingFor, languages: builder.languages, country: builder.country, city: builder.city, workModePreference: builder.workModePreference, lastActiveAt: builder.lastActiveAt, createdAt: builder.createdAt }} />
            ))}
          </div>
        </section>
      ) : null}

      {(activityUpdates.length > 0 || networkActivity.length > 0) ? (
        <section className="mt-8">
          <SectionHeading title={en ? "Activity" : "Aktywność"} href="/network" label={en ? "My network" : "Moja sieć"} />
          <p className="mt-1 text-[12px] text-[var(--bc-faint)]">{en ? "Project updates and activity from people you follow, presented as a lightweight builder feed." : "Aktualizacje projektów i aktywność osób, które obserwujesz, w lekkim feedzie builderów."}</p>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {activityUpdates.map((item) => <FeedStoryCard key={`update-${item.updateId}`} href={`/projects/${item.projectId}`} title={item.projectName} eyebrow={(en ? ({ PROGRESS: "Progress update", ROLE: "Team update", MILESTONE: "Milestone", LAUNCH: "Launch" } as const) : ({ PROGRESS: "Postęp", ROLE: "Aktualizacja zespołu", MILESTONE: "Kamień milowy", LAUNCH: "Premiera" } as const))[item.kind]} body={item.body} meta={`${item.authorUsername ?? (en ? "Team" : "Zespół")} · ${item.createdAt.toLocaleDateString(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short" })}`} visualKind={item.kind === "LAUNCH" ? "launch" : item.kind === "ROLE" ? "people" : "project"} />)}
            {networkActivity.map((item) => <FeedStoryCard key={`network-${item.id}`} href={`/projects/${item.id}`} title={item.name} eyebrow={en ? `${item.username} is building` : `${item.username} buduje`} body={item.tagline} meta={`${en ? "Updated" : "Aktualizacja"} ${item.updatedAt.toLocaleDateString(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short" })}`} visualKind="project" />)}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeading title={en ? "Open projects" : "Otwarte projekty"} href="/projects" label={en ? "All projects" : "Wszystkie projekty"} />
        {fallbackProjects.length > 0 ? <div className="mt-3 space-y-2.5">{fallbackProjects.map(({ project, match }) => <ProjectCard key={project.id} project={project} locale={locale} matchScore={match.score} matchReasons={match.reasons} />)}</div> : <div className="mt-3 border-y border-[var(--bc-line)] py-7 text-sm text-[var(--bc-muted)]">{en ? "No open projects." : "Brak otwartych projektów."}</div>}
      </section>



      <section className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--bc-line)] pt-5">
        <Link href="/network" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--bc-ink)] hover:underline"><Users2 className="h-3.5 w-3.5" /> {en ? "My network" : "Moja sieć"} <ArrowRight className="h-3.5 w-3.5" /></Link>
        <Link href="/my-projects" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">{en ? "My projects" : "Moje projekty"}</Link>
      </section>
    </div>
  );
}

function AttentionItem({ href, icon, value, label, empty, en }: { href: string; icon: React.ReactNode; value: number; label: string; empty: string; en: boolean }) {
  return (
    <Link href={href} className="flex min-h-[74px] items-center gap-3 border-b border-[var(--bc-line)] px-4 py-3 transition-colors hover:bg-[var(--bc-surface-subtle)] xl:border-b-0 xl:border-r xl:last:border-r-0">
      <span className="text-[var(--bc-muted)]">{icon}</span>
      <div><p className="text-[14px] font-semibold tabular-nums text-[var(--bc-ink)]">{value > 0 ? `${value} ${label}` : empty}</p><p className="mt-0.5 text-[10px] text-[var(--bc-faint)]">{value > 0 ? (en ? "Needs attention" : "Wymaga uwagi") : (en ? "All clear" : "Wszystko ogarnięte")}</p></div>
    </Link>
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
