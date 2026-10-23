"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { cn, timeAgo } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/server/actions/notifications";

export type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type Filter = "all" | "unread";

const nowMs = () => Date.now();

export function NotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  const copy = useCopy();
  const locale = useLocale();
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [items, setItems] = React.useState(notifications);
  const [pending, startTransition] = React.useTransition();

  const unread = items.filter((item) => !item.isRead).length;
  const visible = filter === "unread" ? items.filter((item) => !item.isRead) : items;

  const groups = React.useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(nowMs() - 86_400_000).toDateString();
    const sevenDays = nowMs() - 7 * 86_400_000;
    const buckets: { key: string; label: string; rows: NotificationRow[] }[] = [
      { key: "today", label: copy("Dzisiaj", "Today"), rows: [] },
      { key: "yesterday", label: copy("Wczoraj", "Yesterday"), rows: [] },
      { key: "week", label: copy("Ostatnie 7 dni", "Last 7 days"), rows: [] },
      { key: "older", label: copy("Starsze", "Older"), rows: [] },
    ];
    for (const row of visible) {
      const date = new Date(row.createdAt);
      const bucket = date.toDateString() === today ? 0 : date.toDateString() === yesterday ? 1 : date.getTime() >= sevenDays ? 2 : 3;
      buckets[bucket].rows.push(row);
    }
    return buckets.filter((bucket) => bucket.rows.length > 0);
  }, [visible, copy]);

  function markAll() {
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function open(item: NotificationRow) {
    if (item.isRead) return;
    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)));
    void markNotificationRead(item.id);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 text-[13px] font-medium" role="tablist" aria-label={copy("Filtr powiadomień", "Notification filter")}>
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-[var(--bc-radius-sm)] border px-3 py-1.5 transition-colors",
                filter === value ? "border-[var(--bc-line-strong)] bg-[var(--bc-surface)] text-[var(--bc-ink)]" : "border-transparent text-[var(--bc-muted)] hover:text-[var(--bc-ink)]",
              )}
            >
              {value === "all" ? copy("Wszystkie", "All") : `${copy("Nieprzeczytane", "Unread")}${unread > 0 ? ` (${unread})` : ""}`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 ? (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={markAll} disabled={pending}>
              <CheckCheck className="h-4 w-4" />
              {copy("Oznacz wszystkie jako przeczytane", "Mark all as read")}
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/profile#notifications"><Settings className="h-4 w-4" />{copy("Ustawienia", "Settings")}</Link>
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title={filter === "unread" ? copy("Wszystko przeczytane", "You are all caught up") : copy("Brak powiadomień", "No notifications yet")}
          description={copy("Gdy ktoś odpowie na Twój projekt lub napisze wiadomość, zobaczysz to tutaj.", "When someone responds to your project or sends a message, you will see it here.")}
          ctaLabel={copy("Przeglądaj projekty", "Browse projects")}
          ctaHref="/projects"
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label}>
              <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{group.label}</h2>
              <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
                {group.rows.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link ?? "/dashboard"}
                    onClick={() => open(item)}
                    className={cn("flex gap-3 py-4 transition-colors hover:bg-[var(--bc-surface-subtle)] sm:px-2", item.isRead && "opacity-65")}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.isRead ? "bg-[var(--bc-line-strong)]" : "bg-[var(--bc-accent-strong)]")} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {!item.isRead ? <span className="sr-only">{copy("Nieprzeczytane: ", "Unread: ")}</span> : null}
                        {item.title}
                      </span>
                      {item.body ? <span className="mt-1 line-clamp-2 block text-sm text-[var(--bc-muted)]">{item.body}</span> : null}
                      <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString(locale === "en" ? "en-US" : "pl-PL")} className="mt-1 block text-[12px] text-[var(--bc-faint)]">
                        {timeAgo(item.createdAt, locale)}
                      </time>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
