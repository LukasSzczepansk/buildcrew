import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { timeAgo } from "@/lib/utils";
import { listConversationSummaries } from "@/server/data/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Messages - BuildCrew" : "Messages - BuildCrew" };
}

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getRequestLocale();
  const en = locale === "en";
  const conversations = await listConversationSummaries(user.id);

  return <div className="mx-auto max-w-5xl">
    <Topbar title={en ? "Messages" : "Messages"} subtitle={en ? "Conversations with people you build with or want to collaborate with." : "Conversations with people you are building with or want to build with."} />
    {conversations.length === 0 ? <Card className="p-12 text-center"><MessageCircle className="mx-auto h-10 w-10 text-[var(--bc-faint)]" /><h2 className="mt-4 text-[18px] font-semibold">{en ? "No conversations yet" : "No conversations yet"}</h2><p className="mt-1 text-sm text-[var(--bc-muted)]">{en ? "Connect with someone and start a conversation when the connection is accepted." : "Add someone to your contacts and you will be able to message each other after they accept."}</p><Link href="/network?tab=contacts" className="mt-4 inline-block text-sm font-medium text-[var(--bc-ink)] hover:underline">{en ? "Go to your network" : "Go to contacts"}</Link></Card> : <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{conversations.map((conversation) => <Link key={conversation.id} href={`/messages/${conversation.id}`}><div className="px-1 py-4 transition-colors hover:bg-[var(--bc-surface-subtle)] sm:px-3"><div className="flex items-center gap-3"><Avatar username={conversation.profile.username} seed={conversation.profile.userId} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate font-semibold text-[var(--bc-ink)]">{conversation.profile.username}</p><span className="shrink-0 text-[13px] text-[var(--bc-faint)]">{timeAgo(conversation.lastMessage?.createdAt ?? conversation.updatedAt, locale)}</span></div><div className="mt-1 flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-sm text-[var(--bc-muted)]">{conversation.lastMessage ? `${conversation.lastMessage.senderId === user.id ? (en ? "You: " : "You: ") : ""}${conversation.lastMessage.body}` : (en ? "Start a conversation" : "Start a conversation")}</p>{conversation.unreadCount > 0 ? <Badge>{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</Badge> : null}</div></div></div></div></Link>)}</div>}
  </div>;
}
