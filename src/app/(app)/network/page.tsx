import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/network/follow-button";
import { FriendRelationActions } from "@/components/friends/friend-relation-actions";
import { ROLE_LABELS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
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

export const metadata: Metadata = { title: "Moja sieć — BuildCrew" };

type Tab = "collaborators" | "following" | "followers" | "contacts";

export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
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
      <Topbar title="Moja sieć" subtitle="Ludzie, z którymi budujesz, rozmawiasz i chcesz pracować ponownie." />

      <section className="grid border-y border-[var(--bc-line)] sm:grid-cols-4">
        <Metric value={counts.collaborators} label="współpracowników" />
        <Metric value={counts.following} label="obserwujesz" />
        <Metric value={counts.followers} label="obserwuje Ciebie" />
        <Metric value={counts.endorsements} label="rekomendacji" />
      </section>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--bc-line)]" aria-label="Moja sieć">
        <NetworkTab active={tab === "collaborators"} href="/network?tab=collaborators">Współprace <span>{collaborators.length}</span></NetworkTab>
        <NetworkTab active={tab === "following"} href="/network?tab=following">Obserwuję <span>{following.length}</span></NetworkTab>
        <NetworkTab active={tab === "followers"} href="/network?tab=followers">Obserwują mnie <span>{followers.length}</span></NetworkTab>
        <NetworkTab active={tab === "contacts"} href="/network?tab=contacts">Kontakty <span>{friends.length}</span></NetworkTab>
      </nav>

      <div className="mt-6 grid gap-9 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          {tab === "collaborators" ? (
            <NetworkSection title="Osoby, z którymi naprawdę budowałeś" description="Relacja powstaje automatycznie, gdy jesteście członkami tego samego projektu.">
              {collaborators.length ? collaborators.map((item) => (
                <PersonRow key={item.profile.userId} profile={item.profile} meta={`${item.sharedProjects} ${item.sharedProjects === 1 ? "wspólny projekt" : "wspólne projekty"}${item.latestProject ? ` · ostatnio ${item.latestProject.name}` : ""}`} openToBuild={item.profile.lookingFor.includes("OPEN_TO_BUILD") || item.profile.lookingFor.includes("WANTS_PROJECT")}>
                  <FollowButton targetUserId={item.profile.userId} initialFollowing={followingIds.has(item.profile.userId)} compact />
                  <Button asChild variant="outline" size="sm"><Link href={`/builders/${item.profile.userId}`}>Profil</Link></Button>
                </PersonRow>
              )) : <EmptyNetwork title="Jeszcze nie masz historii współpracy" text="Dołącz do projektu albo stwórz własny zespół. Wspólne projekty automatycznie zaczną budować Twoją sieć." href="/projects" cta="Znajdź projekt" />}
            </NetworkSection>
          ) : null}

          {tab === "following" ? (
            <NetworkSection title="Obserwujesz" description="Obserwowanie nie wymaga akceptacji. Dostaniesz sygnał, gdy ta osoba opublikuje nowy projekt.">
              {following.length ? following.map((item) => (
                <PersonRow key={item.profile.userId} profile={item.profile} meta={`Obserwujesz od ${timeAgo(item.since)}`} openToBuild={item.profile.lookingFor.includes("OPEN_TO_BUILD") || item.profile.lookingFor.includes("WANTS_PROJECT")}>
                  <FollowButton targetUserId={item.profile.userId} initialFollowing compact />
                  <Button asChild variant="outline" size="sm"><Link href={`/builders/${item.profile.userId}`}>Profil</Link></Button>
                </PersonRow>
              )) : <EmptyNetwork title="Nikogo jeszcze nie obserwujesz" text="Obserwuj osoby, z którymi potencjalnie chciałbyś coś zbudować. Nie musisz od razu wysyłać zaproszenia do kontaktów." href="/builders" cta="Znajdź ludzi" />}
            </NetworkSection>
          ) : null}

          {tab === "followers" ? (
            <NetworkSection title="Obserwują Cię" description="To osoby, które chcą widzieć Twoje nowe projekty i dostępność do współpracy.">
              {followers.length ? followers.map((item) => (
                <PersonRow key={item.profile.userId} profile={item.profile} meta={`Obserwuje Cię od ${timeAgo(item.since)}`} openToBuild={item.profile.lookingFor.includes("OPEN_TO_BUILD") || item.profile.lookingFor.includes("WANTS_PROJECT")}>
                  <FollowButton targetUserId={item.profile.userId} initialFollowing={followingIds.has(item.profile.userId)} compact />
                  <Button asChild variant="outline" size="sm"><Link href={`/builders/${item.profile.userId}`}>Profil</Link></Button>
                </PersonRow>
              )) : <EmptyNetwork title="Brak obserwujących" text="Uzupełnij profil, zaznacz czego szukasz i bierz udział w projektach. Sieć ma wynikać z realnej aktywności, nie z losowych zaproszeń." href="/profile" cta="Uzupełnij profil" />}
            </NetworkSection>
          ) : null}

          {tab === "contacts" ? (
            <div className="space-y-8">
              <NetworkSection title="Kontakty" description="Zaakceptowane kontakty mogą pisać do siebie prywatnie w BuildCrew.">
                {friends.length ? friends.map((item) => (
                  <PersonRow key={item.friendshipId} profile={item.profile} meta={`Kontakt od ${timeAgo(item.since)}`} openToBuild={item.profile.lookingFor.includes("OPEN_TO_BUILD") || item.profile.lookingFor.includes("WANTS_PROJECT")}>
                    <FriendRelationActions targetUserId={item.profile.userId} state={{ kind: "FRIENDS", conversationId: item.conversationId }} compact />
                  </PersonRow>
                )) : <EmptyNetwork title="Brak zaakceptowanych kontaktów" text="Kontakt ma sens, gdy chcecie rozmawiać 1:1. Do śledzenia ciekawych osób użyj obserwowania." href="/builders" cta="Znajdź ludzi" />}
              </NetworkSection>

              {(requests.incoming.length || requests.outgoing.length) ? (
                <section>
                  <h2 className="text-[15px] font-semibold">Zaproszenia</h2>
                  <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
                    {requests.incoming.map((request) => (
                      <div key={request.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                        <Link href={`/builders/${request.profile.userId}`} className="flex min-w-0 flex-1 items-center gap-3"><Avatar username={request.profile.username} seed={request.profile.userId} size="sm" /><div><p className="text-sm font-medium">{request.profile.username}</p><p className="text-[12px] text-[var(--bc-faint)]">Chce dodać Cię do kontaktów · {timeAgo(request.createdAt)}</p></div></Link>
                        <FriendRelationActions targetUserId={request.profile.userId} state={{ kind: "INCOMING", requestId: request.id }} compact />
                      </div>
                    ))}
                    {requests.outgoing.map((request) => (
                      <div key={request.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
                        <Link href={`/builders/${request.profile.userId}`} className="flex min-w-0 flex-1 items-center gap-3"><Avatar username={request.profile.username} seed={request.profile.userId} size="sm" /><div><p className="text-sm font-medium">{request.profile.username}</p><p className="text-[12px] text-[var(--bc-faint)]">Oczekujące zaproszenie · {timeAgo(request.createdAt)}</p></div></Link>
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
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold">Warto porozmawiać</h2><Link href="/builders" className="text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">Wszyscy</Link></div>
            <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {suggestions.map((item) => (
                <div key={item.profile.userId} className="py-3">
                  <Link href={`/builders/${item.profile.userId}`} className="flex items-center gap-3"><Avatar username={item.profile.username} seed={item.profile.userId} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.profile.username}</p><p className="truncate text-[12px] text-[var(--bc-faint)]">{item.profile.role ? ROLE_LABELS[item.profile.role as RoleType] : "Builder"} · {item.score}% dopasowania</p></div></Link>
                  <div className="mt-2 flex items-center justify-between gap-2"><p className="bc-truncate-1 text-[11px] text-[var(--bc-muted)]">{item.reasons.slice(0, 2).join(" · ") || "Podobny kierunek budowania"}</p><FollowButton targetUserId={item.profile.userId} initialFollowing={false} compact /></div>
                </div>
              ))}
              {!suggestions.length ? <p className="py-4 text-[12px] text-[var(--bc-faint)]">Nowe propozycje pojawią się wraz z aktywnością społeczności.</p> : null}
            </div>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold">Aktywność Twojej sieci</h2>
            <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {activity.map((item) => (
                <Link key={item.id} href={`/projects/${item.id}`} className="block py-3 hover:bg-[var(--bc-surface-subtle)]">
                  <p className="text-[12px] text-[var(--bc-faint)]">{item.username} · {timeAgo(item.updatedAt)}</p>
                  <p className="mt-1 text-sm font-medium text-[var(--bc-ink)]">{item.name}</p>
                  <p className="bc-truncate-2 mt-0.5 text-[12px] leading-4 text-[var(--bc-muted)]">{item.tagline}</p>
                </Link>
              ))}
              {!activity.length ? <p className="py-4 text-[12px] leading-4 text-[var(--bc-faint)]">Obserwuj builderów i współpracuj przy projektach. Tutaj pojawią się ich nowe projekty.</p> : null}
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

function PersonRow({ profile, meta, openToBuild, children }: { profile: { userId: string; username: string; role: RoleType | null; skills: string[] }; meta: string; openToBuild: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <Link href={`/builders/${profile.userId}`} className="flex min-w-0 items-center gap-3">
        <Avatar username={profile.username} seed={profile.userId} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{profile.username}</p>{openToBuild ? <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--bc-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--bc-accent-strong)]" />Open to build</span> : null}</div>
          <p className="mt-0.5 text-[12px] text-[var(--bc-muted)]">{profile.role ? ROLE_LABELS[profile.role] : "Builder"}{profile.skills.length ? ` · ${profile.skills.slice(0, 3).join(" · ")}` : ""}</p>
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
