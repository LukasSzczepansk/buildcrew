import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FriendRelationActions } from "@/components/friends/friend-relation-actions";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { listFriends, listPendingFriendRequests } from "@/server/data/friends";
import type { RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Znajomi — BuildCrew" };

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [friends, requests] = await Promise.all([listFriends(user.id), listPendingFriendRequests(user.id)]);

  return (
    <div>
      <Topbar title="Znajomi" subtitle="Osoby, z którymi masz już kontakt." />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.7fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-[16px] font-semibold">Twoi znajomi</h2><span className="text-[12px] text-[var(--bc-faint)]">{friends.length}</span></div>
          {friends.length === 0 ? (
            <div className="border-y border-[var(--bc-line)] py-8 text-sm text-[var(--bc-muted)]">Nie masz jeszcze znajomych. <Link href="/builders" className="font-medium text-[var(--bc-ink)] hover:underline">Znajdź builderów</Link>.</div>
          ) : (
            <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
              {friends.map((item) => (
                <div key={item.friendshipId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <Link href={`/builders/${item.profile.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar username={item.profile.username} seed={item.profile.userId} />
                    <div className="min-w-0"><p className="truncate font-semibold text-[var(--bc-ink)]">{item.profile.username}</p><p className="text-[12px] text-[var(--bc-muted)]">{item.profile.role ? ROLE_LABELS[item.profile.role as RoleType] : "Builder"} · od {timeAgo(item.since)}</p></div>
                  </Link>
                  <FriendRelationActions targetUserId={item.profile.userId} state={{ kind: "FRIENDS", conversationId: item.conversationId }} compact />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-7">
          <RequestSection title="Otrzymane" empty="Brak nowych zaproszeń.">
            {requests.incoming.map((request) => (
              <div key={request.id} className="border-b border-[var(--bc-line)] py-3 last:border-b-0">
                <Link href={`/builders/${request.profile.userId}`} className="flex items-center gap-3"><Avatar username={request.profile.username} seed={request.profile.userId} size="sm" /><div className="min-w-0"><p className="truncate text-[13px] font-medium">{request.profile.username}</p><p className="text-[11px] text-[var(--bc-faint)]">{timeAgo(request.createdAt)}</p></div></Link>
                <div className="mt-2"><FriendRelationActions targetUserId={request.profile.userId} state={{ kind: "INCOMING", requestId: request.id }} compact /></div>
              </div>
            ))}
          </RequestSection>

          <RequestSection title="Wysłane" empty="Brak oczekujących zaproszeń.">
            {requests.outgoing.map((request) => (
              <div key={request.id} className="border-b border-[var(--bc-line)] py-3 last:border-b-0">
                <Link href={`/builders/${request.profile.userId}`} className="flex items-center gap-3"><Avatar username={request.profile.username} seed={request.profile.userId} size="sm" /><div className="min-w-0"><p className="truncate text-[13px] font-medium">{request.profile.username}</p><p className="text-[11px] text-[var(--bc-faint)]">{timeAgo(request.createdAt)}</p></div></Link>
                <div className="mt-2"><FriendRelationActions targetUserId={request.profile.userId} state={{ kind: "OUTGOING", requestId: request.id }} compact /></div>
              </div>
            ))}
          </RequestSection>
        </section>
      </div>
    </div>
  );
}

function RequestSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.length > 0;
  return <div><h2 className="mb-2 text-[14px] font-semibold">{title}</h2><div className="border-y border-[var(--bc-line)]">{hasItems ? children : <p className="py-3 text-[12px] text-[var(--bc-muted)]">{empty}</p>}</div></div>;
}
