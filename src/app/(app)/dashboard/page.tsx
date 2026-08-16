import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, ExternalLink, FolderCheck, MessageCircle, Users2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { DashboardVisitMarker } from "@/components/dashboard/dashboard-visit-marker";
import { ProjectCard } from "@/components/projects/project-card";
import { BuilderCard } from "@/components/builders/builder-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { computeMatch } from "@/lib/matching";
import { computeProjectMatch } from "@/lib/project-matching";
import { AI_CONTEST, DISCORD_INVITE_URL, isAiContestActive } from "@/lib/community";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { getDashboardSinceLastVisit } from "@/server/data/dashboard";
import { listNetworkActivity } from "@/server/data/network";
import { getDashboardAttention, listFollowedProjectUpdates, PROJECT_UPDATE_KIND_LABELS } from "@/server/data/social-projects";
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

  const [allProjects, allBuilders, attention, followedUpdates, networkActivity, sinceLastVisit] = await Promise.all([
    listProjects({}, user.id),
    listBuilderProfiles(user.id),
    getDashboardAttention(user.id),
    listFollowedProjectUpdates(user.id, 5),
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
        { userId: profile.userId, username: profile.username, role: profile.role as RoleType | null, level: profile.level as Level | null, weeklyHours: profile.weeklyHours as Commitment | null, interests: profile.interests, goals: profile.goals as Goal[], languages: profile.languages, country: profile.country, workModePreference: profile.workModePreference },
        { userId: builder.userId, username: builder.username, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, interests: builder.interests, goals: builder.goals as Goal[], languages: builder.languages, country: builder.country, workModePreference: builder.workModePreference },
        locale,
      ),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 3);

  return (
    <div>
      <Topbar title="Home" subtitle={`Hi ${profile.username}. Come back here for people, projects and things that need your attention.`} />
      <DashboardVisitMarker />

      {profile.languages.length === 0 || !profile.country ? (
        <section className="mb-6 rounded-[8px] border border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] px-4 py-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-[13px] font-semibold text-[var(--bc-ink)]">{en ? "Make your profile visible to international matches" : "Complete your profile for global matching"}</p>
            <p className="mt-0.5 text-[12px] leading-5 text-[var(--bc-muted)]">{en ? "Add collaboration languages and your country. This helps us recommend projects and people you can actually work with." : "Add your collaboration languages and country so we can better match you with projects and people you can realistically work with."}</p>
          </div>
          <Button asChild size="sm" className="mt-3 shrink-0 sm:mt-0"><Link href="/profile">{en ? "Complete profile" : "Complete profile"}</Link></Button>
        </section>
      ) : null}

      {sinceLastVisit.items.length > 0 ? (
        <section className="mb-6 border-y border-[var(--bc-line)] bg-[var(--bc-surface)]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--bc-line)] px-4 py-3.5">
            <div>
              <p className="bc-kicker">{en ? "Since your last visit" : "Since your last visit"}</p>
              <h2 className="mt-1 text-[16px] font-semibold text-[var(--bc-ink)]">{sinceLastVisit.count} {en ? (sinceLastVisit.count === 1 ? "new item" : "new items") : (sinceLastVisit.count === 1 ? "new item" : "new items")}</h2>
            </div>
            {sinceLastVisit.lastVisitedAt ? <p className="text-[11px] text-[var(--bc-faint)]">{"since"} {sinceLastVisit.lastVisitedAt.toLocaleString(en ? "en-US" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p> : null}
          </div>
          <div className="divide-y divide-[var(--bc-line)]">
            {sinceLastVisit.items.slice(0, 4).map((item) => (
              <Link key={item.id} href={item.link ?? "/notifications"} className="grid gap-1 px-4 py-3 transition-colors hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--bc-ink)]">{item.title}</p>
                  {item.body ? <p className="mt-0.5 bc-truncate-2 text-[12px] leading-5 text-[var(--bc-muted)]">{item.body}</p> : null}
                </div>
                <span className="shrink-0 text-[11px] text-[var(--bc-faint)]">{item.createdAt.toLocaleTimeString(en ? "en-US" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              </Link>
            ))}
          </div>
          {sinceLastVisit.count > 4 ? <div className="border-t border-[var(--bc-line)] px-4 py-2.5"><Link href="/notifications" className="text-[12px] font-medium text-[var(--bc-ink)] hover:underline">{en ? "View all new items →" : "See everything new →"}</Link></div> : null}
        </section>
      ) : null}

      <section className="mb-6 border-y border-[var(--bc-line)]">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          <AttentionItem en={en} href="/messages" icon={<MessageCircle className="h-3.5 w-3.5" />} value={attention.unreadMessages} label={en ? "new messages" : "new messages"} empty={en ? "No new messages" : "No new messages"} />
          <AttentionItem en={en} href="/notifications" icon={<Bell className="h-3.5 w-3.5" />} value={attention.unreadNotifications} label={en ? "notifications" : "notifications"} empty={en ? "Notifications checked" : "Notifications checked"} />
          <AttentionItem en={en} href="/my-projects" icon={<Users2 className="h-3.5 w-3.5" />} value={attention.pendingApplications} label={en ? "new applications" : "new applications"} empty={en ? "No new applications" : "No new applications"} />
          <AttentionItem en={en} href="/my-projects" icon={<FolderCheck className="h-3.5 w-3.5" />} value={attention.assignedTasks} label={en ? "tasks for you" : "tasks for you"} empty={en ? "No tasks to handle" : "No tasks waiting for you"} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
        <div className="grid gap-5 px-5 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="bc-eyebrow-line min-w-0">
            <p className="bc-kicker">{en ? "Right now" : "Right now"}</p>
            <h2 className="mt-2 max-w-[760px] text-[clamp(24px,2.4vw,32px)] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--bc-ink)]">
              {matchingBuilders.length > 0 || fallbackProjects.length > 0
                ? (en ? `You have ${matchingBuilders.length} ${matchingBuilders.length === 1 ? "person" : "people"} and ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "project" : "projects"} worth checking.` : `You have ${matchingBuilders.length} ${matchingBuilders.length === 1 ? "person" : "people"} i ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "project" : "projects"} worth checking.`)
                : (en ? "No new matches yet. Explore people or create a project." : "No new matches yet. Discover people or create a project.")}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button asChild variant="secondary" size="sm"><Link href="/builders"><Users2 className="h-3.5 w-3.5" /> {en ? "Find people" : "Find people"}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/projects">{en ? "Projects" : "Projects"}</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/projects/new">{en ? "Create project" : "Create project"}</Link></Button>
          </div>
        </div>

        {isAiContestActive() ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-5 py-3 text-[12px] text-[var(--bc-muted)] md:px-6">
            <span><strong className="font-semibold text-[var(--bc-ink)]">{AI_CONTEST.shortTitle}</strong> <span className="mx-1 text-[var(--bc-faint)]">·</span> until {AI_CONTEST.deadlineLabel}</span>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium hover:text-[var(--bc-ink)]">Discord <ExternalLink className="h-3 w-3" /></a>
          </div>
        ) : null}
      </section>

      {matchingBuilders.length > 0 ? (
        <section className="mt-8">
          <SectionHeading title={en ? "People worth talking to" : "People worth talking to"} href="/builders" label={en ? "All builders" : "All builders"} />
          <div className="mt-3 space-y-2.5">
            {matchingBuilders.map(({ builder, match }) => (
              <BuilderCard locale={locale} key={builder.userId} matchScore={match.score} matchReasons={match.reasons} builder={{ userId: builder.userId, username: builder.username, avatarEmoji: builder.avatarEmoji, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, skills: builder.skills, interests: builder.interests, lookingFor: builder.lookingFor, languages: builder.languages, country: builder.country, city: builder.city, workModePreference: builder.workModePreference, lastActiveAt: builder.lastActiveAt, createdAt: builder.createdAt }} />
            ))}
          </div>
        </section>
      ) : null}

      {(followedUpdates.length > 0 || networkActivity.length > 0) ? (
        <section className="mt-8 grid gap-8 xl:grid-cols-2">
          <div>
            <SectionHeading title={en ? "Followed projects" : "Followed projects"} href="/projects" label={en ? "Discover projects" : "Discover projects"} />
            <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {followedUpdates.length ? followedUpdates.map((item) => (
                <Link key={item.updateId} href={`/projects/${item.projectId}`} className="block py-3.5 hover:bg-[var(--bc-surface-subtle)]">
                  <div className="flex items-center justify-between gap-3"><p className="text-[12px] font-semibold">{item.projectName}</p><span className="text-[9px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? ({ PROGRESS: "Progress", ROLE: "Team", MILESTONE: "Milestone", LAUNCH: "Launch" } as const)[item.kind] : PROJECT_UPDATE_KIND_LABELS[item.kind]}</span></div>
                  <p className="mt-1 bc-truncate-2 text-[11px] leading-4 text-[var(--bc-muted)]">{item.body}</p>
                  <p className="mt-1 text-[9px] text-[var(--bc-faint)]">{item.authorUsername ?? (en ? "Team" : "Team")} · {item.createdAt.toLocaleDateString(en ? "en-US" : "en-US", { day: "2-digit", month: "short" })}</p>
                </Link>
              )) : <p className="py-5 text-[11px] leading-5 text-[var(--bc-muted)]">{en ? "Follow projects you care about. Their updates will appear here." : "Follow projects you care about. Their meaningful updates will appear here."}</p>}
            </div>
          </div>
          <div>
            <SectionHeading title={en ? "Your network activity" : "Your network activity"} href="/network" label={en ? "My network" : "My Network"} />
            <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {networkActivity.length ? networkActivity.map((item) => (
                <Link key={item.id} href={`/projects/${item.id}`} className="block py-3.5 hover:bg-[var(--bc-surface-subtle)]">
                  <p className="text-[10px] text-[var(--bc-faint)]">{item.username}</p>
                  <p className="mt-0.5 text-[12px] font-semibold">{item.name}</p>
                  <p className="mt-1 bc-truncate-2 text-[11px] leading-4 text-[var(--bc-muted)]">{item.tagline}</p>
                </Link>
              )) : <p className="py-5 text-[11px] leading-5 text-[var(--bc-muted)]">{en ? "Follow builders and collaborate on projects. Over time, this becomes your feed of real building activity." : "Follow builders and collaborate on projects. Over time, this becomes your feed of real building activity."}</p>}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeading title={en ? "Open projects" : "Open projects"} href="/projects" label={en ? "All projects" : "All projects"} />
        {fallbackProjects.length > 0 ? <div className="mt-3 space-y-2.5">{fallbackProjects.map(({ project, match }) => <ProjectCard key={project.id} project={project} locale={locale} matchScore={match.score} matchReasons={match.reasons} />)}</div> : <div className="mt-3 border-y border-[var(--bc-line)] py-7 text-sm text-[var(--bc-muted)]">{en ? "No open projects." : "No open projects."}</div>}
      </section>



      <section className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--bc-line)] pt-5">
        <Link href="/build" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--bc-ink)] hover:underline">Build Pool <ArrowRight className="h-3.5 w-3.5" /></Link>
        <Link href="/network" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline"><Users2 className="h-3.5 w-3.5" /> {en ? "My network" : "My Network"}</Link>
      </section>
    </div>
  );
}

function AttentionItem({ href, icon, value, label, empty, en }: { href: string; icon: React.ReactNode; value: number; label: string; empty: string; en: boolean }) {
  return (
    <Link href={href} className="flex min-h-[74px] items-center gap-3 border-b border-[var(--bc-line)] px-4 py-3 transition-colors hover:bg-[var(--bc-surface-subtle)] xl:border-b-0 xl:border-r xl:last:border-r-0">
      <span className="text-[var(--bc-muted)]">{icon}</span>
      <div><p className="text-[14px] font-semibold tabular-nums text-[var(--bc-ink)]">{value > 0 ? `${value} ${label}` : empty}</p><p className="mt-0.5 text-[10px] text-[var(--bc-faint)]">{value > 0 ? (en ? "Needs attention" : "Needs attention") : (en ? "All clear" : "Nothing needs your attention right now")}</p></div>
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
