import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { DashboardVisitMarker } from "@/components/dashboard/dashboard-visit-marker";
import { AttentionList, NextActionCard, ProfileProgress, QuickLinks } from "@/components/dashboard/dashboard-blocks";
import { ProjectCard } from "@/components/projects/project-card";
import { BuilderCard } from "@/components/builders/builder-card";
import { SocialFeedCard } from "@/components/feed/social-feed-card";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getProfileCompletion } from "@/lib/profile-completion";
import { computeMatch } from "@/lib/matching";
import { computeProjectMatch } from "@/lib/project-matching";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { getDashboardSinceLastVisit } from "@/server/data/dashboard";
import { getDashboardAttention } from "@/server/data/social-projects";
import { listProjects } from "@/server/data/projects";
import { listRecentSocialPosts } from "@/server/data/social-posts";
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

  const [allProjects, allBuilders, attention, sinceLastVisit, socialFeed] = await Promise.all([
    listProjects({}, user.id),
    listBuilderProfiles(user.id),
    getDashboardAttention(user.id),
    getDashboardSinceLastVisit(user.id, 6),
    listRecentSocialPosts(user.id, 3),
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
  const completion = getProfileCompletion(profile, locale);

  // One headline for the whole page: the most urgent thing first, matches last.
  const next = (() => {
    if (attention.pendingApplications > 0) {
      const n = attention.pendingApplications;
      return {
        title: en ? `${n} ${n === 1 ? "person is" : "people are"} waiting for your decision` : `${n} ${n === 1 ? "osoba czeka" : "osoby czekają"} na Twoją decyzję`,
        description: en ? "Review the applications to your projects and build your team." : "Przejrzyj zgłoszenia do swoich projektów i zbuduj zespół.",
        primary: { href: "/my-projects", label: en ? "Review applications" : "Zobacz zgłoszenia" },
      };
    }
    if (attention.unreadMessages > 0) {
      const n = attention.unreadMessages;
      return {
        title: en ? `You have ${n} unread ${n === 1 ? "message" : "messages"}` : `Masz ${n} ${n === 1 ? "nieprzeczytaną wiadomość" : "nieprzeczytane wiadomości"}`,
        description: en ? "Someone is waiting for your reply." : "Ktoś czeka na Twoją odpowiedź.",
        primary: { href: "/messages", label: en ? "Open messages" : "Otwórz wiadomości" },
      };
    }
    if (!completion.complete && completion.score < 80) {
      return {
        title: en ? "Finish your profile to get better matches" : "Dokończ profil, żeby dostać lepsze dopasowania",
        description: en ? `Your profile is ${completion.score}% ready. It takes a minute and helps people find you.` : `Profil jest gotowy w ${completion.score}%. To minuta, a dzięki temu łatwiej Cię znaleźć.`,
        primary: { href: "/profile", label: en ? "Complete profile" : "Dokończ profil" },
      };
    }
    if (matchingBuilders.length > 0 || fallbackProjects.length > 0) {
      return {
        title: en
          ? `${matchingBuilders.length} ${matchingBuilders.length === 1 ? "person" : "people"} and ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "project" : "projects"} match you`
          : `${matchingBuilders.length} ${matchingBuilders.length === 1 ? "osoba" : "osoby"} i ${fallbackProjects.length} ${fallbackProjects.length === 1 ? "projekt" : "projekty"} pasują do Ciebie`,
        description: en ? "Picked from your skills, availability and interests." : "Dobrane po Twoich umiejętnościach, dostępności i zainteresowaniach.",
        primary: { href: "/builders", label: en ? "Find people" : "Znajdź ludzi" },
      };
    }
    return {
      title: en ? "No matches yet. Explore people or add a project." : "Brak dopasowań. Odkryj ludzi albo dodaj projekt.",
      description: undefined,
      primary: { href: "/builders", label: en ? "Find people" : "Znajdź ludzi" },
    };
  })();

  return (
    <div>
      <Topbar title={en ? "Home" : "Start"} subtitle={en ? `Hi ${profile.username}. Here is what is new around you.` : `Cześć ${profile.username}. Oto co nowego wokół Ciebie.`} />
      <DashboardVisitMarker />

      <NextActionCard
        eyebrow={en ? "Right now" : "Na teraz"}
        title={next.title}
        description={next.description}
        primary={next.primary}
        secondary={next.primary.href === "/projects/new" ? undefined : { href: "/projects/new", label: en ? "Add project" : "Dodaj projekt" }}
      />

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-10">
          {sinceLastVisit.items.length > 0 ? (
            <section className="rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] shadow-[var(--bc-shadow-xs)]">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--bc-line)] px-5 py-4">
                <div>
                  <p className="bc-kicker">{en ? "Since your last visit" : "Od ostatniej wizyty"}</p>
                  <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.01em] text-[var(--bc-ink)]">{sinceLastVisit.count} {en ? (sinceLastVisit.count === 1 ? "new item" : "new items") : (sinceLastVisit.count === 1 ? "nowa rzecz" : "nowe rzeczy")}</h2>
                </div>
                {sinceLastVisit.lastVisitedAt ? <p className="text-[12px] text-[var(--bc-faint)]">{en ? "since" : "od"} {sinceLastVisit.lastVisitedAt.toLocaleString(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p> : null}
              </div>
              <div className="divide-y divide-[var(--bc-line)]">
                {sinceLastVisit.items.slice(0, 4).map((item) => (
                  <Link key={item.id} href={item.link ?? "/notifications"} className="grid gap-1 px-5 py-3.5 transition-colors hover:bg-[var(--bc-surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[var(--bc-ink)]">{item.title}</p>
                      {item.body ? <p className="mt-0.5 bc-truncate-2 text-[13px] leading-5 text-[var(--bc-muted)]">{item.body}</p> : null}
                    </div>
                    <span className="shrink-0 text-[12px] text-[var(--bc-faint)]">{item.createdAt.toLocaleTimeString(en ? "en-US" : "pl-PL", { hour: "2-digit", minute: "2-digit" })}</span>
                  </Link>
                ))}
              </div>
              {sinceLastVisit.count > 4 ? <div className="border-t border-[var(--bc-line)] px-5 py-3"><Link href="/notifications" className="text-[13px] font-medium text-[var(--bc-ink)] hover:underline">{en ? "View all new items →" : "Zobacz wszystkie nowe →"}</Link></div> : null}
            </section>
          ) : null}

          {matchingBuilders.length > 0 ? (
            <section>
              <SectionHeading title={en ? "People worth meeting" : "Ludzie, których warto poznać"} href="/builders" label={en ? "All people" : "Wszyscy ludzie"} />
              <div className="mt-4 space-y-3">
                {matchingBuilders.map(({ builder, match }) => (
                  <BuilderCard locale={locale} key={builder.userId} matchScore={match.score} matchReasons={match.reasons} builder={{ userId: builder.userId, username: builder.username, headline: builder.headline, avatarEmoji: builder.avatarEmoji, role: builder.role as RoleType | null, level: builder.level as Level | null, weeklyHours: builder.weeklyHours as Commitment | null, skills: builder.skills, interests: builder.interests, lookingFor: builder.lookingFor, languages: builder.languages, country: builder.country, city: builder.city, workModePreference: builder.workModePreference, lastActiveAt: builder.lastActiveAt, createdAt: builder.createdAt }} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeading title={en ? "Open projects" : "Otwarte projekty"} href="/projects" label={en ? "All projects" : "Wszystkie projekty"} />
            {fallbackProjects.length > 0 ? (
              <div className="mt-4 space-y-3">{fallbackProjects.map(({ project, match }) => <ProjectCard key={project.id} project={project} locale={locale} matchScore={match.score} matchReasons={match.reasons} />)}</div>
            ) : (
              <p className="mt-4 rounded-[var(--bc-radius-lg)] border border-dashed border-[var(--bc-line-strong)] px-5 py-8 text-center text-sm text-[var(--bc-muted)]">{en ? "No open projects yet." : "Brak otwartych projektów."}</p>
            )}
          </section>

          {socialFeed.length > 0 ? (
            <section>
              <SectionHeading title={en ? "Latest from the community" : "Najnowsze w społeczności"} href="/feed" label={en ? "Open community" : "Zobacz społeczność"} />
              <div className="mt-4 space-y-3">
                {socialFeed.map((item) => <SocialFeedCard key={`social-${item.id}`} item={item} locale={locale} viewerId={user.id} />)}
              </div>
            </section>
          ) : null}
        </div>

        {/* Side rail: sits above the lists on small screens, beside them on wide ones */}
        <aside className="order-first space-y-4 xl:sticky xl:top-6 xl:order-none">
          <AttentionList
            title={en ? "Inbox" : "Do ogarnięcia"}
            allClear={en ? "All clear" : "Wszystko ogarnięte"}
            rows={[
              { href: "/messages", icon: "messages", label: en ? "Messages" : "Wiadomości", value: attention.unreadMessages },
              { href: "/notifications", icon: "notifications", label: en ? "Notifications" : "Powiadomienia", value: attention.unreadNotifications },
              { href: "/my-projects", icon: "applications", label: en ? "Applications" : "Zgłoszenia", value: attention.pendingApplications },
            ]}
          />
          {!completion.complete ? (
            <ProfileProgress
              title={en ? "Your profile" : "Twój profil"}
              score={completion.score}
              missing={completion.missing}
              cta={en ? "Continue profile" : "Dokończ profil"}
              hint={completion.score <= 40 ? (en ? "Optional, but it improves recommendations and makes it easier for others to contact you." : "Opcjonalne, ale poprawia dopasowania i ułatwia innym kontakt.") : undefined}
            />
          ) : null}
          <QuickLinks
            links={[
              { href: "/network", label: en ? "My network" : "Moja sieć" },
              { href: "/my-projects", label: en ? "My projects" : "Moje projekty" },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}

function SectionHeading({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-[22px] font-semibold leading-7 tracking-[-0.02em]">{title}</h2>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-[var(--bc-muted)] transition-colors hover:text-[var(--bc-ink)]">{label} <ArrowRight className="h-3.5 w-3.5" /></Link>
    </div>
  );
}
