"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, ExternalLink, FolderKanban, LayoutDashboard, Lightbulb, LogOut, MessageCircle, ShieldCheck, Trophy, UserRoundCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";
import { AI_CONTEST, DISCORD_INVITE_URL, isAiContestActive } from "@/lib/community";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Start", icon: LayoutDashboard },
  { href: "/builders", label: "Ludzie", icon: Users },
  { href: "/projects", label: "Projekty", icon: FolderKanban },
  { href: "/ideas", label: "Pomysły", icon: Lightbulb },
];

const COMMUNITY_NAV = [
  { href: "/network", label: "Moja sieć", icon: UserRoundCheck },
  { href: "/my-projects", label: "Moje projekty", icon: FolderKanban },
  { href: "/messages", label: "Wiadomości", icon: MessageCircle },
  { href: "/showcase", label: "Zbudowane", icon: Trophy },
];

function NavGroup({ label, items, pathname, unreadMessages }: { label: string; items: typeof PRIMARY_NAV; pathname: string; unreadMessages: number }) {
  return (
    <div>
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-faint)]">{label}</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex h-10 items-center gap-2.5 rounded-[6px] px-3 text-sm font-medium transition-colors",
                active ? "bg-[var(--bc-surface)] text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:bg-[var(--bc-surface)] hover:text-[var(--bc-ink)]",
              )}
            >
              {active ? <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--bc-accent)]" /> : null}
              <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/messages" && unreadMessages > 0 ? <span className="min-w-5 rounded-full bg-[var(--bc-accent)] px-1.5 py-0.5 text-center text-[11px] font-semibold text-neutral-950">{unreadMessages > 99 ? "99+" : unreadMessages}</span> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar({ username, avatarEmoji, admin = false, unreadMessages = 0 }: { username: string; avatarEmoji: string; admin?: boolean; unreadMessages?: number }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[224px] shrink-0 flex-col border-r border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-4 py-5 lg:flex">
      <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-1 text-[16px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)]">
        <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">BC</span>
        <span>BuildCrew</span>
      </Link>

      <div className="space-y-7">
        <NavGroup label="Odkrywaj" items={PRIMARY_NAV} pathname={pathname} unreadMessages={unreadMessages} />
        <NavGroup label="Twoje" items={COMMUNITY_NAV} pathname={pathname} unreadMessages={unreadMessages} />
      </div>

      {admin ? (
        <div className="mt-7 border-t border-[var(--bc-line)] pt-4">
          <Link href="/admin" className={cn("flex h-10 items-center gap-2.5 rounded-[6px] px-3 text-sm font-medium transition-colors", pathname.startsWith("/admin") ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "text-[var(--bc-muted)] hover:bg-[var(--bc-surface)] hover:text-[var(--bc-ink)]")}>
            <ShieldCheck className="h-[15px] w-[15px]" strokeWidth={1.8} />
            Panel admina
          </Link>
        </div>
      ) : null}

      <div className="min-h-6 flex-1" />

      {isAiContestActive() ? (
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="mb-4 rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-3 text-[12px] leading-4 text-[var(--bc-muted)] hover:text-[var(--bc-ink)]">
          <span className="block font-semibold text-[var(--bc-ink)]">{AI_CONTEST.shortTitle}</span>
          <span className="mt-1 inline-flex items-center gap-1">do {AI_CONTEST.deadlineLabel} <ExternalLink className="h-3 w-3" /></span>
        </a>
      ) : null}

      <div className="mb-4 flex items-center gap-4 px-2 text-[13px] text-[var(--bc-faint)]">
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--bc-ink)] hover:underline">Discord</a>
        <Link href="/help" className="inline-flex items-center gap-1 hover:text-[var(--bc-ink)] hover:underline"><CircleHelp className="h-3.5 w-3.5" /> Pomoc</Link>
      </div>

      <div className="border-t border-[var(--bc-line)] pt-3">
        <Link href="/profile" className="flex items-center gap-3 rounded-[8px] px-2 py-2.5 transition-colors hover:bg-[var(--bc-surface)]">
          <Avatar username={username} seed={avatarEmoji || username} size="sm" className="h-8 w-8 text-[13px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--bc-ink)]">{username}</p>
            <p className="text-[12px] text-[var(--bc-faint)]">Profil i ustawienia</p>
          </div>
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="mt-1 w-full justify-start gap-2 px-2 text-[var(--bc-muted)] hover:text-[var(--bc-danger)]">
            <LogOut className="h-3.5 w-3.5" /> Wyloguj
          </Button>
        </form>
      </div>
    </aside>
  );
}
