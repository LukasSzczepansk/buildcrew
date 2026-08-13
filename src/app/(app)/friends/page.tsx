import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox, UserCheck, Users } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { FriendRelationActions } from "@/components/friends/friend-relation-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { listFriends, listPendingFriendRequests } from "@/server/data/friends";
import type { RoleType } from "@/db/schema";

export const metadata: Metadata = { title: "Znajomi — BuildCrew" };

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [friends, requests] = await Promise.all([
    listFriends(user.id),
    listPendingFriendRequests(user.id),
  ]);

  return (
    <div>
      <Topbar title="Znajomi" subtitle="Kontakty, zaproszenia i szybki dostęp do prywatnych rozmów." />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-lime-600" />
            <h2 className="font-semibold">Twoi znajomi</h2>
            <Badge variant="secondary">{friends.length}</Badge>
          </div>

          {friends.length === 0 ? (
            <Card className="p-10 text-center">
              <UserCheck className="mx-auto h-9 w-9 text-neutral-300" />
              <h3 className="mt-3 font-semibold">Nie masz jeszcze znajomych</h3>
              <p className="mt-1 text-sm text-neutral-500">Wejdź w profil buildera i wyślij zaproszenie.</p>
              <Link href="/builders" className="mt-4 inline-block text-sm font-medium text-lime-600 hover:underline">Przeglądaj builderów</Link>
            </Card>
          ) : (
            <div className="grid gap-3">
              {friends.map((item) => (
                <Card key={item.friendshipId} className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Link href={`/builders/${item.profile.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar emoji={item.profile.avatarEmoji} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.profile.username}</p>
                        <p className="text-sm text-neutral-500">{item.profile.role ? ROLE_LABELS[item.profile.role as RoleType] : "Builder"}</p>
                        <p className="mt-0.5 text-xs text-neutral-400">Znajomi od {timeAgo(item.since)}</p>
                      </div>
                    </Link>
                    <FriendRelationActions targetUserId={item.profile.userId} state={{ kind: "FRIENDS", conversationId: item.conversationId }} compact />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Inbox className="h-5 w-5 text-lime-600" />
              <h2 className="font-semibold">Otrzymane zaproszenia</h2>
              {requests.incoming.length > 0 ? <Badge>{requests.incoming.length}</Badge> : null}
            </div>
            <div className="space-y-3">
              {requests.incoming.length === 0 ? <Card className="p-4 text-sm text-neutral-500">Brak nowych zaproszeń.</Card> : requests.incoming.map((request) => (
                <Card key={request.id} className="p-4">
                  <Link href={`/builders/${request.profile.userId}`} className="flex items-center gap-3">
                    <Avatar emoji={request.profile.avatarEmoji} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{request.profile.username}</p>
                      <p className="text-xs text-neutral-400">{timeAgo(request.createdAt)}</p>
                    </div>
                  </Link>
                  <div className="mt-3">
                    <FriendRelationActions targetUserId={request.profile.userId} state={{ kind: "INCOMING", requestId: request.id }} compact />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold">Wysłane zaproszenia</h2>
            <div className="space-y-3">
              {requests.outgoing.length === 0 ? <Card className="p-4 text-sm text-neutral-500">Brak oczekujących zaproszeń.</Card> : requests.outgoing.map((request) => (
                <Card key={request.id} className="p-4">
                  <Link href={`/builders/${request.profile.userId}`} className="flex items-center gap-3">
                    <Avatar emoji={request.profile.avatarEmoji} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{request.profile.username}</p>
                      <p className="text-xs text-neutral-400">Wysłano {timeAgo(request.createdAt)}</p>
                    </div>
                  </Link>
                  <div className="mt-3">
                    <FriendRelationActions targetUserId={request.profile.userId} state={{ kind: "OUTGOING", requestId: request.id }} compact />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
