import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/network/follow-button";
import { FriendRelationActions } from "@/components/friends/friend-relation-actions";
import { labelsFor } from "@/lib/constants-i18n";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { timeAgo } from "@/lib/utils";
import { isOpenToOpportunities } from "@/lib/opportunities";
import { locationLabel } from "@/lib/countries";
import { listFriends, listPendingFriendRequests } from "@/server/data/friends";
import {
  getNetworkCounts,
  listCollaborators,
  listFollowers,
  listFollowing,
  listNetworkActivity,
  listNetworkSuggestions,
} from "@/server/data/network";
import type { RoleType } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "My Network - BuildCrew" : "My Network - BuildCrew" }; }

type Tab = "collaborators" | "following" | "followers" | "contacts";

export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getRequestLocale();
  const en = locale === "en";
  const labels = labelsFor(locale);
  const params = await searchParams;
  const tab: Tab = ["collaborators", "following", "followers", "contacts"].includes(params.tab ?? "") ? params.tab as Tab : "collaborators";

  const [counts, collaborators, following, followers, friends, requests, suggestions, activity] = await Promise.all([
    getNetworkCounts(user.id),
    listCollaborators(user.id),
    listFollowing(user.id),
    listFollowers(user.id),
    listFriends(user.id),
    listPendingFriendRequests(user.id),
    listNetworkSuggestions(user.id, 5),
    listNetworkActivity(user.id, 8),
  ]);
  const followingIds = new Set(following.map((item) => item.profile.userId));

  return (
    <div>
      <Topbar title={en ? "My Network" : "My Network"} subtitle={en ? "People you build with, talk to and would work with again." : "People you build with, talk to, and would work with again."} />

      <section className="grid border-y border-[var(--bc-line)] sm:grid-cols-4">
        <Metric value={counts.collaborators} label={en ? "collaborators" : "collaborators"} />
        <Metric value={counts.following} label={"following"} />
        <Metric value={counts.followers} label={"followers"} />
        <Metric value={counts.endorsements} label="endorsements" />
      </section>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--bc-line)]" aria-label={en ? "My network" : "My Network"}>
        <NetworkTab active={tab === "collaborators"} href="/network?tab=collaborators">{en ? "Collaborators" : "Collaborations"} <span>{collaborators.length}</span></NetworkTab>
        <NetworkTab active={tab === "following"} href="/network?tab=following">{en ? "Following" : "Following"} <span>{following.length}</span></NetworkTab>
        <NetworkTab active={tab === "followers"} href="/network?tab=followers">{en ? "Followers" : "Followers"} <span>{followers.length}</span></NetworkTab>
        <NetworkTab active={tab === "contacts"} href="/network?tab=contacts">{"Connections"} <span>{friends.length}</span></NetworkTab>
      </nav>

      <div className="mt-6 grid gap-9 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          {tab === "collaborators" ? (
            <NetworkSection title={en ? "People you actually built with" : "People you have actually built with"} description={en ? "This relationship is verified automatically when you are members of the same project." : "This relationship is created automatically when you are members of the same project."}>
              {collaborators.length ? collaborators.map((item) => (
                <PersonRow locale={locale} key={item.profile.userId} profile={item.profile} meta={`${item.sharedProjects} shared ${item.sharedProjects === 1 ? "project" : "projects"}${item.latestProject ? ` · latest ${item.latestProject.name}` : ""}`} openToBuild={isOpenToOpportunities(item.profile.lookingFor)}>
                  <FollowButton targetUserId={item.profile.userId} initialFollowing={followingIds.has(item.profile.userId)} compact />
                  <Button asChild variant="outline" size="sm"><Link href={`/builders/${item.profile.userId}`}>{en ? "Profile" : "Profile"}</Link></Button>
                </PersonRow>
              )) : <EmptyNetwork title={en ? "No collaboration history yet" : "You do not have collaboration history yet"} text={en ? "Join a project or create your own team. Shared projects will automatically start building your network." : "Join a project or create your own team. Shared projects will automatically start building your network."} href="/projects" cta={en ? "Find a project" : "Find a project"} />}
            </NetworkSection>
          ) : null}

          {tab === "following" ? (
            <NetworkSection title="Following" description={en ? "Following does not require approval. You will get a signal when this person publishes a new project." : "Following does not require approval. You will be notified when this person publishes a new project."}>
              {following.length ? following.map((item) => (
                <PersonRow locale={locale} key={item.profile.userId} profile={item.profile} meta={`Following since ${timeAgo(item.since, locale)}`} openToBuild={isOpenToOpportunities(item.profile.lookingFor)}>
                  <FollowButton targetUserId={item.profile.userId} initialFollowing compact />
                  <Button asChild variant="outline" size="sm"><Link href={`/builders/${item.profile.userId}`}>{en ? "Profile" : "Profile"}</Link></Button>
                </PersonRow>
              )) : <EmptyNetwork title={en ? "You are not following anyone yet" : "You are not following anyone yet"} text={en ? "Follow people you might want to build with. You do not need to send a connection request right away." : "Follow people you may want to build with. You do not need to send a contact request right away."} href="/builders" cta={en ? "Find people" : "Find people"} />}
            </NetworkSection>
          ) : null}

          {tab === "followers" ? (
            <NetworkSection title={en ? "Followers" : "People following you"} description={en ? "People who want to see your new projects and collaboration availability." : "These people want to see your new projects and collaboration availability."}>
              {followers.length ? followers.map((item) => (
                <PersonRow locale={locale} key={item.profile.userId} profile={item.profile} meta={`Following you since ${timeAgo(item.since, locale)}`} openToBuild={isOpenToOpportunities(item.profile.lookingFor)}>
                  <FollowButton targetUserId={item.profile.userId} initialFollowing={followingIds.has(item.profile.userId)} compact />
                  <Button asChild variant="outline" size="sm"><Link href={`/builders/${item.profile.userId}`}>{en ? "Profile" : "Profile"}</Link></Button>
                </PersonRow>
              )) : <EmptyNetwork title={en ? "No followers yet" : "No followers yet"} text={en ? "Complete your profile, say what you are looking for and take part in projects. Your network should grow from real activity, not random invites." : "Complete your profile, say what you are looking for, and take part in projects. Your network should grow from real activity, not random requests."} href="/profile" cta={en ? "Complete profile" : "Complete profile"} />}
            </NetworkSection>
          ) : null}

          {tab === "contacts" ? (
            <div className="space-y-8">
              <NetworkSection title={"Connections"} description={en ? "Accepted connections can message each other privately on BuildCrew." : "Accepted contacts can message each other privately on BuildCrew."}>
                {friends.length ? friends.map((item) => (
                  <PersonRow locale={locale} key={item.friendshipId} profile={item.profile} meta={`Connected since ${timeAgo(item.since, locale)}`} openToBuild={isOpenToOpportunities(item.profile.lookingFor)}>
                    <FriendRelationActions targetUserId={item.profile.userId} state={{ kind: "FRIENDS", conversationId: item.conversationId }} compact />
                  </PersonRow>
                )) : <EmptyNetwork title={en ? "No accepted connections yet" : "No accepted contacts"} text={en ? "Connections are useful when you want to talk one-on-one. Follow people when you only want to keep up with them." : "Use contacts when you want to talk one-to-one. Use following to keep up with interesting people."} href="/builders" cta={en ? "Find people" : "Find people"} />}
              </NetworkSection>

              {(requests.incoming.length || requests.outgoing.length) ? (
                <section>
                  <h2 className="text-[15px] font-semibold">{en ? "Requests" : "Invitations"}</h2>
                  <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
                    {requests.incoming.map((request) => (
                      <div key={request.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                        <Link href={`/builders/${request.profile.userId}`} className="flex min-w-0 flex-1 items-center gap-3"><Avatar username={request.profile.username} seed={request.profile.userId} size="sm" /><div><p className="text-sm font-medium">{request.profile.username}</p><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Wants to connect" : "Wants to add you as a contact"} · {timeAgo(request.createdAt, locale)}</p></div></Link>
                        <FriendRelationActions targetUserId={request.profile.userId} state={{ kind: "INCOMING", requestId: request.id }} compact />
                      </div>
                    ))}
                    {requests.outgoing.map((request) => (
                      <div key={request.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                        <Link href={`/builders/${request.profile.userId}`} className="flex min-w-0 flex-1 items-center gap-3"><Avatar username={request.profile.username} seed={request.profile.userId} size="sm" /><div><p className="text-sm font-medium">{request.profile.username}</p><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Pending request" : "Pending request"} · {timeAgo(request.createdAt, locale)}</p></div></Link>
                        <FriendRelationActions targetUserId={request.profile.userId} state={{ kind: "OUTGOING", requestId: request.id }} compact />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </main>

        <aside className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold">{en ? "Worth talking to" : "Worth talking to"}</h2><Link href="/builders" className="text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">{en ? "All" : "All"}</Link></div>
            <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {suggestions.map((item) => (
                <div key={item.profile.userId} className="py-3">
                  <Link href={`/builders/${item.profile.userId}`} className="flex items-center gap-3"><Avatar username={item.profile.username} seed={item.profile.userId} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.profile.username}</p><p className="truncate text-[12px] text-[var(--bc-faint)]">{item.profile.role ? labels.roles[item.profile.role as RoleType] : "Builder"} · {item.score}% {en ? "match" : "matches"}</p></div></Link>
                  <div className="mt-2 flex items-center justify-between gap-2"><p className="bc-truncate-1 text-[11px] text-[var(--bc-muted)]">{item.reasons.slice(0, 2).join(" · ") || (en ? "Similar building direction" : "Similar building direction")}</p><FollowButton targetUserId={item.profile.userId} initialFollowing={false} compact /></div>
                </div>
              ))}
              {!suggestions.length ? <p className="py-4 text-[12px] text-[var(--bc-faint)]">{en ? "New suggestions will appear as the community becomes more active." : "New suggestions will appear as the community becomes more active."}</p> : null}
            </div>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold">{en ? "Your network activity" : "Your network activity"}</h2>
            <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {activity.map((item) => (
                <Link key={item.id} href={`/projects/${item.id}`} className="block py-3 hover:bg-[var(--bc-surface-subtle)]">
                  <p className="text-[12px] text-[var(--bc-faint)]">{item.username} · {timeAgo(item.updatedAt, locale)}</p>
                  <p className="mt-1 text-sm font-medium text-[var(--bc-ink)]">{item.name}</p>
                  <p className="bc-truncate-2 mt-0.5 text-[12px] leading-4 text-[var(--bc-muted)]">{item.tagline}</p>
                </Link>
              ))}
              {!activity.length ? <p className="py-4 text-[12px] leading-4 text-[var(--bc-faint)]">{en ? "Follow builders and collaborate on projects. Their new projects will appear here." : "Follow builders and collaborate on projects. Their new projects will appear here."}</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="border-b border-[var(--bc-line)] px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]">{value}</p><p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">{label}</p></div>;
}

function NetworkTab({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return <Link href={href} className={`relative shrink-0 px-3 py-3 text-[13px] font-medium ${active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>{children}{active ? <span className="absolute inset-x-2 bottom-0 h-[2px] bg-[var(--bc-accent)]" /> : null}</Link>;
}

function NetworkSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section><div className="mb-3"><h2 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h2><p className="mt-1 text-[12px] leading-4 text-[var(--bc-muted)]">{description}</p></div><div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{children}</div></section>;
}

function PersonRow({ profile, meta, openToBuild, children, locale }: { profile: { userId: string; username: string; role: RoleType | null; skills: string[]; country?: string | null; city?: string | null }; meta: string; openToBuild: boolean; children: React.ReactNode; locale: "pl" | "en" }) {
  return (
    <div className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <Link href={`/builders/${profile.userId}`} className="flex min-w-0 items-center gap-3">
        <Avatar username={profile.username} seed={profile.userId} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{profile.username}</p>{openToBuild ? <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--bc-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--bc-accent-strong)]" />Open to opportunities</span> : null}</div>
          <p className="mt-0.5 text-[12px] text-[var(--bc-muted)]">{profile.role ? labelsFor(locale)["roles"][profile.role] : "Builder"}{profile.skills.length ? ` · ${profile.skills.slice(0, 3).join(" · ")}` : ""}</p>
          {(profile.city || profile.country) ? <p className="mt-1 text-[12px] font-medium text-[var(--bc-ink)]">{locationLabel(profile.city, profile.country)}</p> : null}
          <p className="mt-1 text-[11px] text-[var(--bc-faint)]">{meta}</p>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 md:justify-end">{children}</div>
    </div>
  );
}

function EmptyNetwork({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return <div className="py-8"><p className="text-sm font-medium">{title}</p><p className="mt-1 max-w-[620px] text-[12px] leading-5 text-[var(--bc-muted)]">{text}</p><Button asChild variant="outline" size="sm" className="mt-3 gap-2"><Link href={href}>{cta}<ArrowRight className="h-3.5 w-3.5" /></Link></Button></div>;
}
