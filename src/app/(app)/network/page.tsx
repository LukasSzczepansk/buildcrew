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

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "My Network - BuildCrew" : "Moja sieć - BuildCrew" }; }

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
      <Topbar title={en ? "My Network" : "Moja sieć"} subtitle={en ? "People you build with, talk to and would work with again." : "Ludzie, z którymi budujesz, rozmawiasz i chcesz pracować ponownie."} />

      <section className="grid border-y border-[var(--bc-line)] sm:grid-cols-4">
        <Metric value={counts.collaborators} label={en ? "collaborators" : "współpracowników"} />
        <Metric value={counts.following} label={en ? "following" : "obserwujesz"} />
        <Metric value={counts.followers} label={en ? "followers" : "obserwuje Ciebie"} />
        <Metric value={counts.endorsements} label={en ? "endorsements" : "rekomendacji"} />
      </section>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--bc-line)]" aria-label={en ? "My network" : "Moja sieć"}>
        <NetworkTab active={tab === "collaborators"} href="/network?tab=collaborators">{en ? "Collaborators" : "Współprace"} <span>{collaborators.length}</span></NetworkTab>
        <NetworkTab active={tab === "following"} href="/network?tab=following">{en ? "Following" : "Obserwuję"} <span>{following.length}</span></NetworkTab>
        <NetworkTab active={tab === "followers"} href="/network?tab=followers">{en ? "Followers" : "Obserwują mnie"} <span>{followers.length}</span></NetworkTab>
        <NetworkTab active={tab === "contacts"} href="/network?tab=contacts">{en ? "Connections" : "Kontakty"} <span>{friends.length}</span></NetworkTab>
      </nav>

      <div className="mt-6 grid gap-9 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          {tab === "collaborators" ? (
            <NetworkSection title={en ? "People you actually built with" : "Osoby, z którymi naprawdę budowałeś"} description={en ? "This relationship is verified automatically when you are members of the same project." : "Relacja powstaje automatycznie, gdy jesteście członkami tego samego projektu."}>
              {collaborators.length ? collaborators.map((item) => (
                <PersonRow locale={locale} key={item.profile.userId} profile={item.profile} meta={en ? `${item.sharedProjects} shared ${item.sharedProjects === 1 ? "project" : "projects"}${item.latestProject ? ` · latest ${item.latestProject.name}` : ""}` : `${item.sharedProjects} ${item.sharedProjects === 1 ? "wspólny projekt" : "wspólne projekty"}${item.latestProject ? ` · ostatnio ${item.latestProject.name}` : ""}`} openToBuild={item.profile.lookingFor.includes("OPEN_TO_BUILD") || item.profile.lookingFor.includes("WANTS_PROJECT")}>
                  <FollowButton targetUserId={item.profile.userId} initialFollowing={followingIds.has(item.profile.userId)} compact />
                  <Button asChild variant="outline" size="sm"><Link href={`/builders/${item.profile.userId}`}>{en ? "Profile" : "Profil"}</Link></Button>
                </PersonRow>
              )) : <EmptyNetwork title={en ? "No collaboration history yet" : "Jeszcze nie masz historii współpracy"} text={en ? "Join a project or create your own team. Shared projects will automatically start building your network." : "Dołącz do projektu albo stwórz własny zespół. Wspólne projekty automatycznie zaczną budować Twoją sieć."} href="/projects" cta={en ? "Find a project" : "Znajdź projekt"} />}
            </NetworkSection>
          ) : null}

          {tab === "following" ? (
            <NetworkSection title={en ? "Following" : "Obserwujesz"} description={en ? "Following does not require approval. You will get a signal when this person publishes a new project." : "Obserwowanie nie wymaga akceptacji. Dostaniesz sygnał, gdy ta osoba opublikuje nowy projekt."}>
              {following.length ? following.map((item) => (
                <PersonRow locale={locale} key={item.profile.userId} profile={item.profile} meta={en ? `Following since ${timeAgo(item.since, locale)}` : `Obserwujesz od ${timeAgo(item.since, locale)}`} openToBuild={item.profile.lookingFor.includes("OPEN_TO_BUILD") || item.profile.lookingFor.includes("WANTS_PROJECT")}>
                  <FollowButton targetUserId={item.profile.userId} initialFollowing compact />
                  <Button asChild variant="outline" size="sm"><Link href={`/builders/${item.profile.userId}`}>{en ? "Profile" : "Profil"}</Link></Button>
                </PersonRow>
              )) : <EmptyNetwork title={en ? "You are not following anyone yet" : "Nikogo jeszcze nie obserwujesz"} text={en ? "Follow people you might want to build with. You do not need to send a connection request right away." : "Obserwuj osoby, z którymi potencjalnie chciałbyś coś zbudować. Nie musisz od razu wysyłać zaproszenia do kontaktów."} href="/builders" cta={en ? "Find people" : "Znajdź ludzi"} />}
            </NetworkSection>
          ) : null}

          {tab === "followers" ? (
            <NetworkSection title={en ? "Followers" : "Obserwują Cię"} description={en ? "People who want to see your new projects and collaboration availability." : "To osoby, które chcą widzieć Twoje nowe projekty i dostępność do współpracy."}>
              {followers.length ? followers.map((item) => (
                <PersonRow locale={locale} key={item.profile.userId} profile={item.profile} meta={en ? `Following you since ${timeAgo(item.since, locale)}` : `Obserwuje Cię od ${timeAgo(item.since, locale)}`} openToBuild={item.profile.lookingFor.includes("OPEN_TO_BUILD") || item.profile.lookingFor.includes("WANTS_PROJECT")}>
                  <FollowButton targetUserId={item.profile.userId} initialFollowing={followingIds.has(item.profile.userId)} compact />
                  <Button asChild variant="outline" size="sm"><Link href={`/builders/${item.profile.userId}`}>{en ? "Profile" : "Profil"}</Link></Button>
                </PersonRow>
              )) : <EmptyNetwork title={en ? "No followers yet" : "Brak obserwujących"} text={en ? "Complete your profile, say what you are looking for and take part in projects. Your network should grow from real activity, not random invites." : "Uzupełnij profil, zaznacz czego szukasz i bierz udział w projektach. Sieć ma wynikać z realnej aktywności, nie z losowych zaproszeń."} href="/profile" cta={en ? "Complete profile" : "Uzupełnij profil"} />}
            </NetworkSection>
          ) : null}

          {tab === "contacts" ? (
            <div className="space-y-8">
              <NetworkSection title={en ? "Connections" : "Kontakty"} description={en ? "Accepted connections can message each other privately on BuildCrew." : "Zaakceptowane kontakty mogą pisać do siebie prywatnie w BuildCrew."}>
                {friends.length ? friends.map((item) => (
                  <PersonRow locale={locale} key={item.friendshipId} profile={item.profile} meta={en ? `Connected since ${timeAgo(item.since, locale)}` : `Kontakt od ${timeAgo(item.since, locale)}`} openToBuild={item.profile.lookingFor.includes("OPEN_TO_BUILD") || item.profile.lookingFor.includes("WANTS_PROJECT")}>
                    <FriendRelationActions targetUserId={item.profile.userId} state={{ kind: "FRIENDS", conversationId: item.conversationId }} compact />
                  </PersonRow>
                )) : <EmptyNetwork title={en ? "No accepted connections yet" : "Brak zaakceptowanych kontaktów"} text={en ? "Connections are useful when you want to talk one-on-one. Follow people when you only want to keep up with them." : "Kontakt ma sens, gdy chcecie rozmawiać 1:1. Do śledzenia ciekawych osób użyj obserwowania."} href="/builders" cta={en ? "Find people" : "Znajdź ludzi"} />}
              </NetworkSection>

              {(requests.incoming.length || requests.outgoing.length) ? (
                <section>
                  <h2 className="text-[15px] font-semibold">{en ? "Requests" : "Zaproszenia"}</h2>
                  <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
                    {requests.incoming.map((request) => (
                      <div key={request.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                        <Link href={`/builders/${request.profile.userId}`} className="flex min-w-0 flex-1 items-center gap-3"><Avatar username={request.profile.username} seed={request.profile.userId} size="sm" /><div><p className="text-sm font-medium">{request.profile.username}</p><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Wants to connect" : "Chce dodać Cię do kontaktów"} · {timeAgo(request.createdAt, locale)}</p></div></Link>
                        <FriendRelationActions targetUserId={request.profile.userId} state={{ kind: "INCOMING", requestId: request.id }} compact />
                      </div>
                    ))}
                    {requests.outgoing.map((request) => (
                      <div key={request.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                        <Link href={`/builders/${request.profile.userId}`} className="flex min-w-0 flex-1 items-center gap-3"><Avatar username={request.profile.username} seed={request.profile.userId} size="sm" /><div><p className="text-sm font-medium">{request.profile.username}</p><p className="text-[12px] text-[var(--bc-faint)]">{en ? "Pending request" : "Oczekujące zaproszenie"} · {timeAgo(request.createdAt, locale)}</p></div></Link>
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
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold">{en ? "Worth talking to" : "Warto porozmawiać"}</h2><Link href="/builders" className="text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">{en ? "All" : "Wszyscy"}</Link></div>
            <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {suggestions.map((item) => (
                <div key={item.profile.userId} className="py-3">
                  <Link href={`/builders/${item.profile.userId}`} className="flex items-center gap-3"><Avatar username={item.profile.username} seed={item.profile.userId} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.profile.username}</p><p className="truncate text-[12px] text-[var(--bc-faint)]">{item.profile.role ? labels.roles[item.profile.role as RoleType] : "Builder"} · {item.score}% {en ? "match" : "dopasowania"}</p></div></Link>
                  <div className="mt-2 flex items-center justify-between gap-2"><p className="bc-truncate-1 text-[11px] text-[var(--bc-muted)]">{item.reasons.slice(0, 2).join(" · ") || (en ? "Similar building direction" : "Podobny kierunek budowania")}</p><FollowButton targetUserId={item.profile.userId} initialFollowing={false} compact /></div>
                </div>
              ))}
              {!suggestions.length ? <p className="py-4 text-[12px] text-[var(--bc-faint)]">{en ? "New suggestions will appear as the community becomes more active." : "Nowe propozycje pojawią się wraz z aktywnością społeczności."}</p> : null}
            </div>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold">{en ? "Your network activity" : "Aktywność Twojej sieci"}</h2>
            <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {activity.map((item) => (
                <Link key={item.id} href={`/projects/${item.id}`} className="block py-3 hover:bg-[var(--bc-surface-subtle)]">
                  <p className="text-[12px] text-[var(--bc-faint)]">{item.username} · {timeAgo(item.updatedAt, locale)}</p>
                  <p className="mt-1 text-sm font-medium text-[var(--bc-ink)]">{item.name}</p>
                  <p className="bc-truncate-2 mt-0.5 text-[12px] leading-4 text-[var(--bc-muted)]">{item.tagline}</p>
                </Link>
              ))}
              {!activity.length ? <p className="py-4 text-[12px] leading-4 text-[var(--bc-faint)]">{en ? "Follow builders and collaborate on projects. Their new projects will appear here." : "Obserwuj builderów i współpracuj przy projektach. Tutaj pojawią się ich nowe projekty."}</p> : null}
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

function PersonRow({ profile, meta, openToBuild, children, locale }: { profile: { userId: string; username: string; role: RoleType | null; skills: string[] }; meta: string; openToBuild: boolean; children: React.ReactNode; locale: "pl" | "en" }) {
  return (
    <div className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <Link href={`/builders/${profile.userId}`} className="flex min-w-0 items-center gap-3">
        <Avatar username={profile.username} seed={profile.userId} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{profile.username}</p>{openToBuild ? <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--bc-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--bc-accent-strong)]" />Open to build</span> : null}</div>
          <p className="mt-0.5 text-[12px] text-[var(--bc-muted)]">{profile.role ? labelsFor(locale)["roles"][profile.role] : "Builder"}{profile.skills.length ? ` · ${profile.skills.slice(0, 3).join(" · ")}` : ""}</p>
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
