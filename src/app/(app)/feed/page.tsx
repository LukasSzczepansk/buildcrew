import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SocialFeedCard } from "@/components/feed/social-feed-card";
import { SocialPostComposer } from "@/components/feed/social-post-composer";
import { FeedStoryCard } from "@/components/feed/feed-story-card";
import { FeedActivityRow } from "@/components/feed/feed-activity-row";
import { FeedProjectSpotlightCard } from "@/components/feed/feed-project-spotlight-card";
import { FeedRightRail } from "@/components/feed/feed-right-rail";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { labelsFor } from "@/lib/constants-i18n";
import { getProfileByUserId, listBuilderProfiles } from "@/server/data/profiles";
import { listProjects, listProjectsForMember } from "@/server/data/projects";
import { listFollowedProjectUpdates, listRecentGlobalProjectUpdates } from "@/server/data/social-projects";
import { listFollowingSocialPosts, listRecentSocialPosts, listSavedSocialPosts } from "@/server/data/social-posts";
import { listRecentTeamJoinActivity } from "@/server/data/feed";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Feed - BuildCrew" : "Aktualności - BuildCrew" };
}

type FeedFilter = "for-you" | "following" | "saved";
type FeedEvent =
  | { type: "social"; createdAt: Date; item: Awaited<ReturnType<typeof listRecentSocialPosts>>[number] }
  | { type: "update"; createdAt: Date; item: Awaited<ReturnType<typeof listRecentGlobalProjectUpdates>>[number] }
  | { type: "join"; createdAt: Date; item: Awaited<ReturnType<typeof listRecentTeamJoinActivity>>[number] }
  | { type: "project"; createdAt: Date; item: Awaited<ReturnType<typeof listProjects>>[number] };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const locale = await getRequestLocale();
  const en = locale === "en";
  const labels = labelsFor(locale);
  const profile = await getProfileByUserId(user.id);
  if (!profile) redirect("/onboarding");

  const params = await searchParams;
  const filter: FeedFilter = params.filter === "following" ? "following" : params.filter === "saved" ? "saved" : "for-you";
  const followingOnly = filter === "following";
  const savedOnly = filter === "saved";

  const [memberProjects, socialPosts, projectUpdates, joins, allProjects, builders] = await Promise.all([
    listProjectsForMember(user.id),
    savedOnly ? listSavedSocialPosts(user.id, 40) : followingOnly ? listFollowingSocialPosts(user.id, 28) : listRecentSocialPosts(user.id, 28),
    savedOnly ? Promise.resolve([]) : followingOnly ? listFollowedProjectUpdates(user.id, 20) : listRecentGlobalProjectUpdates(20),
    savedOnly ? Promise.resolve([]) : listRecentTeamJoinActivity(user.id, followingOnly, 16),
    savedOnly ? Promise.resolve([]) : listProjects({}, user.id),
    listBuilderProfiles(user.id),
  ]);

  const composerProjects = memberProjects
    .filter((project) => project.lifecycleStatus === "ACTIVE")
    .map((project) => ({ id: project.id, name: project.name, isOwner: project.ownerId === user.id }));

  const realActiveProjects = allProjects
    .filter((project) => !project.owner?.isDemo)
    .filter((project) => !followingOnly || project.viewerFollowing)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const spotlightProjects = realActiveProjects.slice(0, followingOnly ? 3 : 5);

  const events: FeedEvent[] = [
    ...socialPosts.map((item) => ({ type: "social" as const, createdAt: item.createdAt, item })),
    ...projectUpdates.map((item) => ({ type: "update" as const, createdAt: item.createdAt, item })),
    ...joins.map((item) => ({ type: "join" as const, createdAt: item.joinedAt, item })),
    ...spotlightProjects.map((item) => ({ type: "project" as const, createdAt: item.updatedAt, item })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 44);

  const railProjects = realActiveProjects.slice(0, 3);
  const railBuilders = builders
    .filter((builder) => builder.onboardingCompleted && builder.publicProfile && !builder.isDemo)
    .sort((a, b) => (b.lastActiveAt?.getTime() ?? 0) - (a.lastActiveAt?.getTime() ?? 0))
    .slice(0, 4);

  return (
    <div>
      <Topbar
        title={en ? "Feed" : "Aktualności"}
        subtitle={en ? "See what people are building and find your next collaboration." : "Zobacz, co budują ludzie i znajdź kolejną współpracę."}
      />

      <div className="mx-auto w-full max-w-[1140px]">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,760px)_280px]">
          <main className="min-w-0">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-[var(--bc-line)]">
              <nav className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={en ? "Feed filters" : "Filtry aktualności"}>
                <FeedTab active={filter === "for-you"} href="/feed">{en ? "For you" : "Dla Ciebie"}</FeedTab>
                <FeedTab active={filter === "following"} href="/feed?filter=following">{en ? "Following" : "Obserwowani"}</FeedTab>
              </nav>
              <Link
                href="/feed?filter=saved"
                aria-label={en ? "Saved posts" : "Zapisane posty"}
                className={`mb-2 grid h-8 w-8 shrink-0 place-items-center rounded-[7px] border transition-colors ${savedOnly ? "border-[var(--bc-accent-strong)] bg-[color-mix(in_srgb,var(--bc-accent)_10%,transparent)] text-[var(--bc-accent-strong)]" : "border-[var(--bc-line)] text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"}`}
              >
                <Bookmark className="h-3.5 w-3.5" fill={savedOnly ? "currentColor" : "none"} />
              </Link>
            </div>

            {!savedOnly ? <SocialPostComposer projects={composerProjects} viewer={{ username: profile.username, avatarEmoji: profile.avatarEmoji }} /> : null}

            <section className={savedOnly ? "" : "mt-5"}>
              {savedOnly ? (
                <div className="mb-4">
                  <p className="bc-kicker">{en ? "Saved" : "Zapisane"}</p>
                  <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--bc-ink)]">{en ? "Posts you want to come back to" : "Posty, do których chcesz wrócić"}</h2>
                </div>
              ) : null}

              {events.length ? (
                <div className="space-y-3 sm:space-y-4">
                  {events.map((event, index) => {
                    if (event.type === "social") {
                      return <SocialFeedCard key={`social-${event.item.id}`} item={event.item} locale={locale} viewerId={user.id} />;
                    }

                    if (event.type === "project") {
                      return <FeedProjectSpotlightCard key={`project-${event.item.id}-${index}`} project={event.item} locale={locale} />;
                    }

                    if (event.type === "join") {
                      const role = event.item.roleType ? labels.roles[event.item.roleType] : (en ? "Builder" : "Builder");
                      return (
                        <FeedActivityRow
                          key={`join-${event.item.projectId}-${event.item.userId}-${event.item.joinedAt.getTime()}`}
                          href={`/projects/${event.item.projectId}`}
                          username={event.item.username}
                          avatarEmoji={event.item.avatarEmoji}
                          projectName={event.item.projectName}
                          roleLabel={role}
                          joinedAt={event.item.joinedAt}
                          city={event.item.city}
                          country={event.item.country}
                          locale={locale}
                        />
                      );
                    }

                    const eyebrow = (en
                      ? ({ PROGRESS: "Project update", ROLE: "Team update", MILESTONE: "Milestone", LAUNCH: "Launch" } as const)
                      : ({ PROGRESS: "Aktualizacja projektu", ROLE: "Aktualizacja zespołu", MILESTONE: "Kamień milowy", LAUNCH: "Premiera" } as const))[event.item.kind];
                    const visualKind = event.item.kind === "LAUNCH" ? "launch" : event.item.kind === "MILESTONE" ? "milestone" : event.item.kind === "ROLE" ? "people" : "project";
                    return (
                      <FeedStoryCard
                        key={`update-${event.item.updateId}-${index}`}
                        href={`/projects/${event.item.projectId}`}
                        title={event.item.projectName}
                        eyebrow={eyebrow}
                        body={event.item.body}
                        meta={`${event.item.authorUsername ?? (en ? "Team" : "Zespół")} · ${event.item.createdAt.toLocaleDateString(en ? "en-US" : "pl-PL", { day: "2-digit", month: "short" })}`}
                        visualKind={visualKind}
                        showVisual={event.item.kind === "LAUNCH" || event.item.kind === "MILESTONE"}
                        ctaLabel={en ? "View project" : "Zobacz projekt"}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-5 py-10 text-center">
                  <p className="text-[15px] font-semibold">{savedOnly ? (en ? "You have no saved posts yet." : "Nie masz jeszcze zapisanych postów.") : followingOnly ? (en ? "Your following feed is quiet for now." : "Na razie jest tu spokojnie.") : (en ? "No activity yet." : "Brak nowych aktualności.")}</p>
                  <p className="mx-auto mt-1 max-w-[520px] text-[12px] leading-5 text-[var(--bc-muted)]">{savedOnly ? (en ? "Save posts you want to return to." : "Zapisuj posty, do których chcesz wrócić.") : followingOnly ? (en ? "Follow builders and projects and their activity will appear here." : "Obserwuj ludzi i projekty, a ich aktywność pojawi się tutaj.") : (en ? "Explore people and projects to get your feed moving." : "Odkryj ludzi i projekty, żeby rozruszać swój feed.")}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2"><Button asChild variant="outline" size="sm"><Link href="/builders">{en ? "Find people" : "Znajdź ludzi"}</Link></Button><Button asChild size="sm"><Link href="/projects">{en ? "Explore projects" : "Odkryj projekty"}</Link></Button></div>
                </div>
              )}
            </section>
          </main>

          <div className="hidden xl:block">
            <FeedRightRail locale={locale} projects={railProjects} builders={railBuilders} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedTab({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`relative shrink-0 px-3 py-3 text-[12px] font-medium sm:text-[13px] ${active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>
      {children}
      {active ? <span className="absolute inset-x-2 bottom-0 h-[2px] bg-[var(--bc-accent)]" /> : null}
    </Link>
  );
}
