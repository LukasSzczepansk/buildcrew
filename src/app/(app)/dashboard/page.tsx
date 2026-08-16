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
import { AI_CONTEST, DISCORD_INVITE_URL, isAiContestActive } from "@/lib/community";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { getDashboardSinceLastVisit } from "@/server/data/dashboard";
import { listNetworkActivity } from "@/server/data/network";
import { getDashboardAttention, listFollowedProjectUpdates, PROJECT_UPDATE_KIND_LABELS } from "@/server/data/social-projects";
import { listIdeas, listProjects } from "@/server/data/projects";
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

  const [allProjects, allBuilders, allIdeas, attention, followedUpdates, networkActivity, sinceLastVisit] = await Promise.all([
    listProjects({}, user.id),
    listBuilderProfiles(user.id),
    listIdeas(user.id),
    getDashboardAttention(user.id),
    listFollowedProjectUpdates(user.id, 5),
    listNetworkActivity(user.id, 5),
    getDashboardSinceLastVisit(user.id, 6),
  ]);
  const matchingIdeas = allIdeas
    .filter((idea) => idea.ownerId !== user.id)
    .sort((a, b) => {
      const aShared = a.interests.filter((interest) => profile.interests.includes(interest)).length;
      const bShared = b.interests.filter((interest) => profile.interests.includes(interest)).length;
      return bShared - aShared || b.interestedCount - a.interestedCount;
    })
    .slice(0, 3);

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
        locale,
      ),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 3);

  return (
    <div>
      <Topbar title={en ? "Home" : "Start"} subtitle={en ? `Hi ${profile.username}. Come back here for people, projects and things that need your attention.` : `Cześć ${profile.username}. Tu wracasz po ludzi, projekty i rzeczy wymagające Twojej uwagi.`} />
      <DashboardVisitMarker />

      {sinceLastVisit.items.length > 0 ? (
        <section className="mb-6 border-y border-[var(--bc-line)] bg-[var(--bc-surface)]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--bc-line)] px-4 py-3.5">
            <div>
              <p className="bc-kicker">{en ? "Since your last visit" : "Od ostatniej wizyty"}</p>
              <h2 className="mt-1 text-[16px] font-semibold text-[var(--bc-ink)]">{sinceLastVisit.count} {en ? (sinceLastVisit.count === 1 ? "new item" : "new items") : (sinceLastVisit.count === 1 ? "nowa rzecz" : "nowych rzeczy")}</h2>
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
          {sinceLastVisit.count > 4 ? <div className="border-t border-[var(--bc-line)] px-4 py-2.5"><Link href="/notifications" className="text-[12px] font-medium text-[var(--bc-ink)] hover:underline">{en ? "View all new items →" : "Zobacz wszystkie nowe rzeczy →"}</Link></div> : null}
        </section>
      ) : null}

      <section className="mb-6 border-y border-[var(--bc-line)]">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          <AttentionItem en={en} href="/messages" icon={<MessageCircle className="h-3.5 w-3.5" />} value={attention.unreadMessages} label={en ? "new messages" : "nowe wiadomości"} empty={en ? "No new messages" : "Brak nowych wiadomości"} />
          <AttentionItem en={en} href="/notifications" icon={<Bell className="h-3.5 w-3.5" />} value={attention.unreadNotifications} label={en ? "notifications" : "powiadomienia"} empty={en ? "Notifications checked" : "Powiadomienia sprawdzone"} />
          <AttentionItem en={en} href="/my-projects" icon={<Users2 className="h-3.5 w-3.5" />} value={attention.pendingApplications} label={en ? "new applications" : "nowe zgłoszenia"} empty={en ? "No new applications" : "Brak nowych zgłoszeń"} />
          <AttentionItem en={en} href="/my-projects" icon={<FolderCheck className="h-3.5 w-3.5" />} value={attention.assignedTasks} label={en ? "tasks for you" : "zadania dla Ciebie"} empty={en ? "No tasks to handle" : "Brak zadań do ogarnięcia"} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-[var(--bc-line-strong)] bg-[var(--bc-surface)]">
        <div className="grid gap-5 px-5 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="bc-eyebrow-line min-w-0">
            <p className="bc-kicker">{en ? "Right now" : "Na teraz"}</p>
            <h2 className="mt-2 max-w-[760px] text-[clamp(24px,2.4vw,32px)] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--bc-ink)]">
              {matchingBuilders.length > 0 || fallbackProjects.length > 0 || matchingIdeas.length > 0
                ? (en ? `You have ${matchingBuilders.length} ${matchingBuilders.length === 1 ? "person" : "people"}, ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "project" : "projects"} and ${matchingIdeas.length} ${matchingIdeas.length === 1 ? "idea" : "ideas"} worth checking.` : `Masz ${matchingBuilders.length} ${matchingBuilders.length === 1 ? "osobę" : "osoby"}, ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "projekt" : "projekty"} i ${matchingIdeas.length} ${matchingIdeas.length === 1 ? "pomysł" : "pomysły"} warte sprawdzenia.`)
                : (en ? "No new matches. Start with an idea or the Build Pool." : "Brak nowych dopasowań. Zacznij od pomysłu albo Build Pool.")}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button asChild variant="secondary" size="sm"><Link href="/builders"><Users2 className="h-3.5 w-3.5" /> {en ? "Find people" : "Znajdź ludzi"}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/projects">{en ? "Projects" : "Projekty"}</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/ideas">{en ? "Add idea" : "Dodaj pomysł"}</Link></Button>
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
          <SectionHeading title={en ? "People worth talking to" : "Ludzie do rozmowy"} href="/builders" label={en ? "All builders" : "Wszyscy builderzy"} />
          <div className="mt-3 space-y-2.5">
            {matchingBuilders.map(({ builder, match }) => (
              <BuilderCard locale={locale} key={builder.userId} matchScore={match.score} matchReasons={match.reasons} builder={{ userId: builder.userId, username: builder.username, avatarEmoji: builder.avatarEmoji, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, skills: builder.skills, interests: builder.interests, lookingFor: builder.lookingFor, lastActiveAt: builder.lastActiveAt, createdAt: builder.createdAt }} />
            ))}
          </div>
        </section>
      ) : null}

      {(followedUpdates.length > 0 || networkActivity.length > 0) ? (
        <section className="mt-8 grid gap-8 xl:grid-cols-2">
          <div>
            <SectionHeading title={en ? "Followed projects" : "Obserwowane projekty"} href="/projects" label={en ? "Discover projects" : "Odkrywaj projekty"} />
            <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {followedUpdates.length ? followedUpdates.map((item) => (
                <Link key={item.updateId} href={`/projects/${item.projectId}`} className="block py-3.5 hover:bg-[var(--bc-surface-subtle)]">
                  <div className="flex items-center justify-between gap-3"><p className="text-[12px] font-semibold">{item.projectName}</p><span className="text-[9px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? ({ PROGRESS: "Progress", ROLE: "Team", MILESTONE: "Milestone", LAUNCH: "Launch" } as const)[item.kind] : PROJECT_UPDATE_KIND_LABELS[item.kind]}</span></div>
                  <p className="mt-1 bc-truncate-2 text-[11px] leading-4 text-[var(--bc-muted)]">{item.body}</p>
                  <p className="mt-1 text-[9px] text-[var(--bc-faint)]">{item.authorUsername ?? (en ? "Team" : "Zespół")} · {item.createdAt.toLocaleDateString(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short" })}</p>
                </Link>
              )) : <p className="py-5 text-[11px] leading-5 text-[var(--bc-muted)]">{en ? "Follow projects you care about. Their updates will appear here." : "Obserwuj projekty, które Cię interesują. Ich konkretne aktualizacje pojawią się tutaj."}</p>}
            </div>
          </div>
          <div>
            <SectionHeading title={en ? "Your network activity" : "Aktywność Twojej sieci"} href="/network" label={en ? "My network" : "Moja sieć"} />
            <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {networkActivity.length ? networkActivity.map((item) => (
                <Link key={item.id} href={`/projects/${item.id}`} className="block py-3.5 hover:bg-[var(--bc-surface-subtle)]">
                  <p className="text-[10px] text-[var(--bc-faint)]">{item.username}</p>
                  <p className="mt-0.5 text-[12px] font-semibold">{item.name}</p>
                  <p className="mt-1 bc-truncate-2 text-[11px] leading-4 text-[var(--bc-muted)]">{item.tagline}</p>
                </Link>
              )) : <p className="py-5 text-[11px] leading-5 text-[var(--bc-muted)]">{en ? "Follow builders and collaborate on projects. Over time, this becomes your feed of real building activity." : "Obserwuj builderów i współpracuj przy projektach. Z czasem powstanie tu Twój własny feed realnego budowania."}</p>}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeading title={en ? "Open projects" : "Otwarte projekty"} href="/projects" label={en ? "All projects" : "Wszystkie projekty"} />
        {fallbackProjects.length > 0 ? <div className="mt-3 space-y-2.5">{fallbackProjects.map((project) => <ProjectCard key={project.id} project={project} locale={locale} />)}</div> : <div className="mt-3 border-y border-[var(--bc-line)] py-7 text-sm text-[var(--bc-muted)]">{en ? "No open projects." : "Brak otwartych projektów."}</div>}
      </section>

      {matchingIdeas.length > 0 ? (
        <section className="mt-8">
          <SectionHeading title={en ? "Ideas to build together" : "Pomysły do wspólnego rozwinięcia"} href="/ideas" label={en ? "All ideas" : "Wszystkie pomysły"} />
          <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
            {matchingIdeas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`} className="grid gap-2 py-4 hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold">{idea.name}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[var(--bc-muted)]">{idea.tagline}</p>
                  <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{idea.interests.slice(0, 3).join(" · ")} · {idea.interestedCount} {en ? "interested" : "zainteresowanych"}</p>
                </div>
                <span className="text-[12px] font-medium">{en ? "Check it out →" : "Sprawdź →"}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] text-[var(--bc-muted)]">
            <span>{en ? "No project feels right?" : "Żaden projekt Ci nie pasuje?"}</span>
            <Link href="/ideas" className="font-medium text-[var(--bc-ink)] hover:underline">{en ? "Add your own idea" : "Dodaj własny pomysł"}</Link>
            <span>{en ? "or" : "albo"}</span>
            <Link href="/build" className="font-medium text-[var(--bc-ink)] hover:underline">{en ? "find people without a project" : "znajdź ludzi bez projektu"}</Link>
          </div>
        </section>
      ) : null}

      <section className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--bc-line)] pt-5">
        <Link href="/ideas" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--bc-ink)] hover:underline">{en ? "Ideas" : "Pomysły"} <ArrowRight className="h-3.5 w-3.5" /></Link>
        <Link href="/build" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--bc-ink)] hover:underline">Build Pool <ArrowRight className="h-3.5 w-3.5" /></Link>
        <Link href="/network" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline"><Users2 className="h-3.5 w-3.5" /> {en ? "My network" : "Moja sieć"}</Link>
      </section>
    </div>
  );
}

function AttentionItem({ href, icon, value, label, empty, en }: { href: string; icon: React.ReactNode; value: number; label: string; empty: string; en: boolean }) {
  return (
    <Link href={href} className="flex min-h-[74px] items-center gap-3 border-b border-[var(--bc-line)] px-4 py-3 transition-colors hover:bg-[var(--bc-surface-subtle)] xl:border-b-0 xl:border-r xl:last:border-r-0">
      <span className="text-[var(--bc-muted)]">{icon}</span>
      <div><p className="text-[14px] font-semibold tabular-nums text-[var(--bc-ink)]">{value > 0 ? `${value} ${label}` : empty}</p><p className="mt-0.5 text-[10px] text-[var(--bc-faint)]">{value > 0 ? (en ? "Needs attention" : "Wymaga uwagi") : (en ? "All clear" : "Na teraz czysto")}</p></div>
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
