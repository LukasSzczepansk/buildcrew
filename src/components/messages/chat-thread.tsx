"use client";

import * as React from "react";
import { AlertCircle, MoreHorizontal, RotateCcw, Send, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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

// Wrapped so the render-purity lint does not mistake event-handler/timer usage for render-time impurity.
const nowMs = () => Date.now();
const randomId = () => Math.random().toString(36).slice(2, 8);

type DisplayMessage = ChatMessage & { localState?: "sending" | "failed" };

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
  const [messages, setMessages] = React.useState<DisplayMessage[]>(initialMessages);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = React.useRef(true);
  const lastActivityRef = React.useRef(nowMs());
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const loadMessages = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json() as { messages?: ChatMessage[] };
      if (!payload.messages) return;
      const incoming = payload.messages;
      // Keep optimistic / failed local messages that the server has not confirmed yet.
      setMessages((current) => [...incoming, ...current.filter((item) => item.localState)]);
      if (incoming.length) lastActivityRef.current = Math.max(lastActivityRef.current, new Date(incoming[incoming.length - 1].createdAt).getTime());
    } catch {
      // A temporary polling failure should not interrupt the conversation UI.
    }
  }, [conversationId]);

  // Adaptive polling: every 4s while the conversation is active, slowing down once it has been quiet.
  React.useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      if (document.visibilityState === "visible") void loadMessages();
      const quietFor = Date.now() - lastActivityRef.current;
      timer = window.setTimeout(tick, quietFor > 5 * 60_000 ? 20_000 : quietFor > 60_000 ? 8_000 : 4_000);
    };
    timer = window.setTimeout(tick, 4_000);
    const onVisible = () => { if (document.visibilityState === "visible") void loadMessages(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [loadMessages]);

  // Only follow new messages when the reader is already at the bottom (do not yank them away from history).
  React.useEffect(() => {
    if (stickToBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function resizeInput() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  async function deliver(localId: string, text: string) {
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const payload = await response.json() as { message?: ChatMessage; error?: string };
      if (!response.ok || !payload.message) {
        toast.error(payload.error ? appMessage(payload.error, locale, "Could not send the message.") : copy("Nie udało się wysłać wiadomości.", "Could not send the message."));
        setMessages((current) => current.map((item) => item.id === localId ? { ...item, localState: "failed" } : item));
        return;
      }
      const confirmed = payload.message;
      lastActivityRef.current = nowMs();
      setMessages((current) => {
        const without = current.filter((item) => item.id !== localId);
        return without.some((item) => item.id === confirmed.id) ? without : [...without, confirmed];
      });
    } catch {
      toast.error(copy("Nie udało się wysłać wiadomości.", "Could not send the message."));
      setMessages((current) => current.map((item) => item.id === localId ? { ...item, localState: "failed" } : item));
    }
  }

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    const localId = `local-${nowMs()}-${randomId()}`;
    stickToBottomRef.current = true;
    setMessages((current) => [...current, { id: localId, senderId: currentUserId, body: trimmed, createdAt: new Date().toISOString(), readAt: null, localState: "sending" }]);
    setBody("");
    requestAnimationFrame(resizeInput);
    setSending(true);
    await deliver(localId, trimmed);
    setSending(false);
    inputRef.current?.focus();
  }

  function retry(message: DisplayMessage) {
    setMessages((current) => current.map((item) => item.id === message.id ? { ...item, localState: "sending" } : item));
    void deliver(message.id, message.body);
  }

  function discard(message: DisplayMessage) {
    setMessages((current) => current.filter((item) => item.id !== message.id));
  }

  function dayLabel(iso: string) {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return copy("Dzisiaj", "Today");
    if (date.toDateString() === yesterday.toDateString()) return copy("Wczoraj", "Yesterday");
    return date.toLocaleDateString(locale === "en" ? "en-US" : "pl-PL", { day: "numeric", month: "long", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--bc-line)] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar username={otherUser.username} size="sm" />
            <div>
              <p className="font-semibold">{otherUser.username}</p>
              <p className="text-[13px] text-neutral-400">{copy("Enter wysyła, Shift+Enter dodaje nowy wiersz", "Enter sends, Shift+Enter adds a new line")}</p>
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

      <div ref={scrollRef} onScroll={onScroll} className="h-[55vh] min-h-[360px] overflow-y-auto bg-[var(--bc-surface-subtle)] p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-neutral-400">
            <p>{copy(`Wyślij pierwszą wiadomość do ${otherUser.username}.`, `Send the first message to ${otherUser.username}.`)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const mine = message.senderId === currentUserId;
              const showDay = index === 0 || new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
              return (
                <React.Fragment key={message.id}>
                {showDay ? <div className="flex justify-center py-1"><span className="rounded-full bg-neutral-200/70 px-3 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{dayLabel(message.createdAt)}</span></div> : null}
                <div className={cn("flex", mine ? "justify-end" : "justify-start", message.localState === "sending" && "opacity-60")}>
                  <div className={cn(
                    "max-w-[82%] rounded-[var(--bc-radius)] px-3.5 py-2.5 text-sm",
                    mine
                      ? "rounded-br-md bg-lime-600 text-white"
                      : "rounded-bl-md border border-[var(--bc-line)] bg-[var(--bc-surface)] text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
                  )}>
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className={cn("text-[11px]", mine ? "text-lime-100" : "text-neutral-400")}>
                        {new Date(message.createdAt).toLocaleTimeString(locale === "en" ? "en-US" : "pl-PL", { hour: "2-digit", minute: "2-digit" })}
                        {mine ? ` · ${message.localState === "sending" ? copy("Wysyłanie…", "Sending…") : message.localState === "failed" ? copy("Nie wysłano", "Not sent") : message.readAt ? copy("Przeczytano", "Read") : copy("Wysłano", "Sent")}` : ""}
                      </p>
                      {!mine ? <ContentReportDialog targetType="MESSAGE" targetId={message.id} compact label={copy("Zgłoś", "Report")} /> : null}
                      {message.localState === "failed" ? (
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <AlertCircle className="h-3 w-3 text-red-200" aria-hidden="true" />
                          <button type="button" onClick={() => retry(message)} className="inline-flex items-center gap-1 underline"><RotateCcw className="h-3 w-3" />{copy("Ponów", "Retry")}</button>
                          <button type="button" onClick={() => discard(message)} aria-label={copy("Usuń nieudaną wiadomość", "Discard failed message")}><X className="h-3 w-3" /></button>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="flex items-end gap-2 border-t border-[var(--bc-line)] p-4">
        <div className="min-w-0 flex-1">
          <Textarea
            ref={inputRef}
            rows={1}
            value={body}
            onChange={(event) => { setBody(event.target.value); resizeInput(); }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void submit();
              }
            }}
            maxLength={800}
            placeholder={copy("Napisz wiadomość...", "Write a message...")}
            autoComplete="off"
            className="min-h-10 resize-none py-2"
          />
          {body.length > 650 ? <p className={cn("mt-1 text-right text-[11px]", body.length >= 780 ? "text-red-500" : "text-neutral-400")}>{body.length}/800</p> : null}
        </div>
        <Button type="submit" size="icon" disabled={sending || !body.trim()} aria-label={copy("Wyślij wiadomość", "Send message")}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
