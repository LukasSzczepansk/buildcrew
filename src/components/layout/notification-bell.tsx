"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/server/actions/notifications";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = React.useState(false);
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] transition-colors hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]" aria-label="Powiadomienia">
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 ? <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#7ea819] px-1 text-[10px] font-semibold text-white">{unread > 99 ? "99+" : unread}</span> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] rounded-[8px] border-[var(--bc-line)] bg-[var(--bc-surface)] p-0 shadow-[0_14px_36px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[var(--bc-line)] px-4 py-3.5">
          <p className="text-sm font-semibold">Powiadomienia</p>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" className="h-auto px-0 text-xs text-[var(--bc-muted)] hover:bg-transparent hover:text-[var(--bc-ink)] hover:underline" onClick={async () => { await markAllNotificationsRead(); }}>
              Oznacz wszystkie
            </Button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--bc-faint)]">Brak powiadomień. Wróć tu później.</p>
          ) : notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? "#"}
              onClick={async () => {
                setOpen(false);
                if (!n.isRead) await markNotificationRead(n.id);
              }}
              className={`flex items-start gap-3 border-b border-[var(--bc-line)] px-4 py-3 text-sm transition-colors last:border-0 hover:bg-[var(--bc-surface-subtle)] ${n.isRead ? "opacity-70" : ""}`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bc-accent-soft)] text-[#7ea819]">
                {n.isRead ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-[#7ea819]" />}
              </span>
              <span className="flex-1">
                <span className="block font-medium text-[var(--bc-ink)]">{n.title}</span>
                {n.body ? <span className="mt-0.5 block text-[var(--bc-muted)]">{n.body}</span> : null}
                <span className="mt-1 block text-xs text-[var(--bc-faint)]">{timeAgo(n.createdAt)}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="border-t border-[var(--bc-line)] p-2.5">
          <Link href="/notifications" onClick={() => setOpen(false)} className="block rounded-[7px] px-3 py-2 text-center text-xs font-medium text-[var(--bc-ink)] hover:bg-[var(--bc-surface-subtle)]">Zobacz wszystkie powiadomienia</Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
