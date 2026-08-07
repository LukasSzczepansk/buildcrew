import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import { listConversationSummaries } from "@/server/data/messages";

export const metadata: Metadata = { title: "Wiadomości — BuildCrew" };

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const conversations = await listConversationSummaries(user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <Topbar title="Wiadomości" subtitle="Prywatny czat 1:1 między zaakceptowanymi znajomymi." />

      {conversations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-neutral-300" />
          <h2 className="mt-4 font-semibold">Nie masz jeszcze rozmów</h2>
          <p className="mt-1 text-sm text-neutral-500">Dodaj kogoś do znajomych, a po akceptacji będziecie mogli pisać.</p>
          <Link href="/friends" className="mt-4 inline-block text-sm font-medium text-violet-600 hover:underline">Przejdź do znajomych</Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
              <Card className="mb-3 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/60">
                <div className="flex items-center gap-3">
                  <Avatar emoji={conversation.profile.avatarEmoji} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-semibold">{conversation.profile.username}</p>
                      <span className="shrink-0 text-xs text-neutral-400">{timeAgo(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm text-neutral-500">
                        {conversation.lastMessage ? `${conversation.lastMessage.senderId === user.id ? "Ty: " : ""}${conversation.lastMessage.body}` : "Rozpocznij rozmowę"}
                      </p>
                      {conversation.unreadCount > 0 ? <Badge>{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</Badge> : null}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
