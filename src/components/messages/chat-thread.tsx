"use client";

import * as React from "react";
import { MoreHorizontal, Send, UserX } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { ContentReportDialog } from "@/components/moderation/content-report-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { blockUser } from "@/server/actions/moderation";

type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export function ChatThread({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherUser: { userId: string; username: string; avatarEmoji: string };
  initialMessages: ChatMessage[];
}) {
  const copy = useCopy();
  const locale = useLocale();
  const router = useRouter();
  const [messages, setMessages] = React.useState(initialMessages);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  const loadMessages = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json() as { messages?: ChatMessage[] };
      if (payload.messages) setMessages(payload.messages);
    } catch {
      // A temporary polling failure should not interrupt the conversation UI.
    }
  }, [conversationId]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadMessages();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const payload = await response.json() as { message?: ChatMessage; error?: string };
      if (!response.ok || !payload.message) {
        toast.error(payload.error ? appMessage(payload.error, locale, "Could not send the message.") : copy("Nie udało się wysłać wiadomości.", "Could not send the message."));
        return;
      }
      setMessages((current) => current.some((item) => item.id === payload.message!.id) ? current : [...current, payload.message!]);
      setBody("");
    } catch {
      toast.error(copy("Nie udało się wysłać wiadomości.", "Could not send the message."));
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar username={otherUser.username} size="sm" />
            <div>
              <p className="font-semibold">{otherUser.username}</p>
              <p className="text-[13px] text-neutral-400">{copy("Wiadomości odświeżają się co kilka sekund", "Messages refresh every few seconds")}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={copy("Opcje rozmowy", "Conversation options")}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-red-600" onClick={async () => { const result = await blockUser(otherUser.userId); if (result && "error" in result && result.error) { toast.error(result.error); return; } toast.success(copy("Użytkownik zablokowany.", "User blocked.")); router.push("/messages"); router.refresh(); }}><UserX className="mr-2 h-4 w-4" />{copy("Zablokuj użytkownika", "Block user")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="h-[55vh] min-h-[360px] overflow-y-auto bg-neutral-50/60 p-4 dark:bg-neutral-950/40">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-neutral-400">
            <p>{copy(`Wyślij pierwszą wiadomość do ${otherUser.username}.`, `Send the first message to ${otherUser.username}.`)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const mine = message.senderId === currentUserId;
              return (
                <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[82%] rounded-[8px] px-3.5 py-2.5 text-sm",
                    mine
                      ? "rounded-br-md bg-lime-600 text-white"
                      : "rounded-bl-md border border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
                  )}>
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className={cn("text-[11px]", mine ? "text-lime-100" : "text-neutral-400")}>
                        {new Date(message.createdAt).toLocaleTimeString(locale === "en" ? "en-US" : "pl-PL", { hour: "2-digit", minute: "2-digit" })}
                        {mine ? ` · ${message.readAt ? copy("Przeczytano", "Read") : copy("Wysłano", "Sent")}` : ""}
                      </p>
                      {!mine ? <ContentReportDialog targetType="MESSAGE" targetId={message.id} compact label={copy("Zgłoś", "Report")} /> : null}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
        <Input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={800}
          placeholder={copy("Napisz wiadomość...", "Write a message...")}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={sending || !body.trim()} aria-label={copy("Wyślij wiadomość", "Send message")}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
