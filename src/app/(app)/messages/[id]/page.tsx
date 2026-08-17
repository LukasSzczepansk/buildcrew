import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ChatThread } from "@/components/messages/chat-thread";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { getConversationForUser, listConversationMessages, markConversationRead } from "@/server/data/messages";

export async function generateMetadata(): Promise<Metadata> { return { title: "Conversation - BuildCrew" }; }
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const locale = await getRequestLocale(); const en = locale === "en";
  const { id } = await params; const access = await getConversationForUser(id, user.id); if (!access) notFound();
  const items = await listConversationMessages(id); await markConversationRead(id, user.id);
  return <div className="mx-auto max-w-4xl"><Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5"><Link href="/messages"><ChevronLeft className="h-4 w-4" /> {en ? "All messages" : "All messages"}</Link></Button><ChatThread conversationId={id} currentUserId={user.id} otherUser={{ userId: access.otherUserId, username: access.profile.username, avatarEmoji: access.profile.avatarEmoji }} initialMessages={items.map((message) => ({ id: message.id, senderId: message.senderId, body: message.body, createdAt: message.createdAt.toISOString(), readAt: message.readAt?.toISOString() ?? null }))} /></div>;
}
