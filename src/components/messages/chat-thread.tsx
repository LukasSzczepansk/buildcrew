"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  otherUser: { username: string; avatarEmoji: string };
  initialMessages: ChatMessage[];
}) {
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
        toast.error(payload.error ?? "Nie udało się wysłać wiadomości.");
        return;
      }
      setMessages((current) => current.some((item) => item.id === payload.message!.id) ? current : [...current, payload.message!]);
      setBody("");
    } catch {
      toast.error("Nie udało się wysłać wiadomości.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Avatar emoji={otherUser.avatarEmoji} size="sm" />
          <div>
            <p className="font-semibold">{otherUser.username}</p>
            <p className="text-xs text-neutral-400">Wiadomości odświeżają się co kilka sekund</p>
          </div>
        </div>
      </div>

      <div className="h-[55vh] min-h-[360px] overflow-y-auto bg-neutral-50/60 p-4 dark:bg-neutral-950/40">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-neutral-400">
            <p>Napisz pierwszą wiadomość do {otherUser.username}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const mine = message.senderId === currentUserId;
              return (
                <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    mine
                      ? "rounded-br-md bg-violet-600 text-white"
                      : "rounded-bl-md border border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
                  )}>
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p className={cn("mt-1 text-[10px]", mine ? "text-violet-100" : "text-neutral-400")}>
                      {new Date(message.createdAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                      {mine ? ` · ${message.readAt ? "Odczytano" : "Wysłano"}` : ""}
                    </p>
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
          placeholder="Napisz wiadomość…"
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={sending || !body.trim()} aria-label="Wyślij wiadomość">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
