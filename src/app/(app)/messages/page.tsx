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

export const metadata: Metadata = { title: "Wiadomości - BuildCrew" };

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const conversations = await listConversationSummaries(user.id);

  return (
    <div className="mx-auto max-w-5xl">
      <Topbar title="Wiadomości" subtitle="Rozmowy z osobami, z którymi budujesz lub chcesz zacząć." />

      {conversations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-[var(--bc-faint)]" />
          <h2 className="mt-4 text-[18px] font-semibold">Nie masz jeszcze rozmów</h2>
          <p className="mt-1 text-sm text-[var(--bc-muted)]">Dodaj kogoś do kontaktów, a po akceptacji będziecie mogli pisać.</p>
          <Link href="/network?tab=contacts" className="mt-4 inline-block text-sm font-medium text-[var(--bc-ink)] hover:underline">Przejdź do kontaktów</Link>
        </Card>
      ) : (
        <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
              <div className="px-1 py-4 transition-colors hover:bg-[var(--bc-surface-subtle)] sm:px-3">
                <div className="flex items-center gap-3">
                  <Avatar username={conversation.profile.username} seed={conversation.profile.userId} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-semibold text-[var(--bc-ink)]">{conversation.profile.username}</p>
                      <span className="shrink-0 text-[13px] text-[var(--bc-faint)]">{timeAgo(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm text-[var(--bc-muted)]">{conversation.lastMessage ? `${conversation.lastMessage.senderId === user.id ? "Ty: " : ""}${conversation.lastMessage.body}` : "Rozpocznij rozmowę"}</p>
                      {conversation.unreadCount > 0 ? <Badge>{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</Badge> : null}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
