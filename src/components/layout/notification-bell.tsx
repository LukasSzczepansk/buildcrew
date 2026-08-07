"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label="Powiadomienia"
        >
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <p className="text-sm font-semibold">Powiadomienia</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-violet-600 hover:bg-transparent hover:underline dark:text-violet-400"
              onClick={async () => {
                await markAllNotificationsRead();
              }}
            >
              Oznacz wszystkie
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-400">Brak powiadomień. Wróć tu później 👋</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={async () => {
                  setOpen(false);
                  if (!n.isRead) await markNotificationRead(n.id);
                }}
                className={`flex items-start gap-2 border-b border-neutral-50 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-neutral-50 dark:border-neutral-800/60 dark:hover:bg-neutral-800/60 ${
                  n.isRead ? "opacity-60" : ""
                }`}
              >
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                  {n.isRead ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />}
                </span>
                <span className="flex-1">
                  <span className="block font-medium text-neutral-800 dark:text-neutral-100">{n.title}</span>
                  {n.body && <span className="mt-0.5 block text-neutral-500">{n.body}</span>}
                  <span className="mt-1 block text-xs text-neutral-400">{timeAgo(n.createdAt)}</span>
                </span>
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
