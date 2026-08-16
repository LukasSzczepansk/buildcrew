"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, CircleHelp, ExternalLink, FolderKanban, LayoutDashboard, Lightbulb, LogOut, MessageCircle, ShieldCheck, Trophy, UserRoundCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { logoutAction } from "@/server/actions/auth";
import { AI_CONTEST, DISCORD_INVITE_URL, isAiContestActive } from "@/lib/community";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useCopy } from "@/components/i18n/locale-provider";

const PRIMARY_NAV = [
  { href: "/dashboard", key: "start", icon: LayoutDashboard },
  { href: "/builders", key: "people", icon: Users },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/hackathons", key: "hackathons", icon: CalendarRange },
  { href: "/ideas", key: "ideas", icon: Lightbulb },
] as const;

const COMMUNITY_NAV = [
  { href: "/network", key: "network", icon: UserRoundCheck },
  { href: "/my-projects", key: "myProjects", icon: FolderKanban },
  { href: "/messages", key: "messages", icon: MessageCircle },
  { href: "/showcase", key: "built", icon: Trophy },
] as const;

type NavItem = (typeof PRIMARY_NAV)[number] | (typeof COMMUNITY_NAV)[number];

function NavGroup({ label, items, pathname, unreadMessages, labels }: { label: string; items: readonly NavItem[]; pathname: string; unreadMessages: number; labels: Record<string, string> }) {
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
                "group relative flex min-h-10 items-center gap-2.5 rounded-[8px] px-3 text-sm font-medium transition-colors",
                active ? "bg-[var(--bc-surface)] text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:bg-[var(--bc-surface)] hover:text-[var(--bc-ink)]",
              )}
            >
              {active ? <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-[var(--bc-accent)]" /> : null}
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.8} />
              <span className="min-w-0 flex-1">{labels[item.key]}</span>
              {item.href === "/messages" && unreadMessages > 0 ? <span className="min-w-5 rounded-full bg-[var(--bc-accent)] px-1.5 py-0.5 text-center text-[11px] font-semibold text-neutral-950">{unreadMessages > 99 ? "99+" : unreadMessages}</span> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar({ username, avatarEmoji, admin = false, founder = false, unreadMessages = 0 }: { username: string; avatarEmoji: string; admin?: boolean; founder?: boolean; unreadMessages?: number }) {
  const pathname = usePathname();
  const copy = useCopy();
  const labels = {
    start: copy("Start", "Home"), people: copy("Ludzie", "People"), projects: copy("Projekty", "Projects"),
    hackathons: copy("Hackathony", "Hackathons"), ideas: copy("Pomysły", "Ideas"), network: copy("Moja sieć", "My network"),
    myProjects: copy("Moje projekty", "My projects"), messages: copy("Wiadomości", "Messages"), built: copy("Zbudowane", "Built"),
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 overflow-y-auto border-r border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-4 py-5 lg:flex lg:flex-col xl:w-[256px]">
      <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-1 text-[16px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">BC</span>
        <span className="truncate">BuildCrew</span>
      </Link>

      <div className="space-y-7">
        <NavGroup label={copy("Odkrywaj", "Discover")} items={PRIMARY_NAV} pathname={pathname} unreadMessages={unreadMessages} labels={labels} />
        <NavGroup label={copy("Twoje", "Yours")} items={COMMUNITY_NAV} pathname={pathname} unreadMessages={unreadMessages} labels={labels} />
      </div>

      {admin ? (
        <div className="mt-7 border-t border-[var(--bc-line)] pt-4">
          <Link
            href="/admin"
            className={cn(
              "flex min-h-10 items-center gap-2.5 rounded-[8px] px-3 text-sm font-medium transition-colors",
              pathname.startsWith("/admin") ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "text-[var(--bc-muted)] hover:bg-[var(--bc-surface)] hover:text-[var(--bc-ink)]",
            )}
          >
            <ShieldCheck className="h-[15px] w-[15px] shrink-0" strokeWidth={1.8} />
            <span className="min-w-0 truncate">{copy("Panel admina", "Admin panel")}</span>
          </Link>
        </div>
      ) : null}

      <div className="min-h-6 flex-1" />

      <div className="mt-auto space-y-4 pb-2">
        {isAiContestActive() ? (
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-3 text-[12px] leading-4 text-[var(--bc-muted)] transition-colors hover:text-[var(--bc-ink)]"
          >
            <span className="block font-semibold text-[var(--bc-ink)]">{AI_CONTEST.shortTitle}</span>
            <span className="mt-1 inline-flex items-center gap-1">{copy("do", "until")} {AI_CONTEST.deadlineLabel} <ExternalLink className="h-3 w-3" /></span>
          </a>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2 text-[13px] text-[var(--bc-faint)]">
          <LanguageSwitcher compact />
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--bc-ink)] hover:underline">Discord</a>
          <Link href="/help" className="inline-flex items-center gap-1 hover:text-[var(--bc-ink)] hover:underline"><CircleHelp className="h-3.5 w-3.5 shrink-0" /> {copy("Pomoc", "Help")}</Link>
        </div>

        <div className="border-t border-[var(--bc-line)] pt-3">
          <Link href="/profile" className="flex items-center gap-3 rounded-[8px] px-2 py-2.5 transition-colors hover:bg-[var(--bc-surface)]">
            <Avatar username={username} seed={avatarEmoji || username} size="sm" className={cn("h-10 w-10 shrink-0 text-[14px]", founder && "ring-2 ring-[#C8F169] ring-offset-2 ring-offset-[var(--bc-surface-subtle)]")} />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-medium text-[var(--bc-ink)]">{username}</p>
                {founder ? <UserRoleBadge founder compact /> : admin ? <UserRoleBadge systemRole="ADMIN" compact /> : null}
              </div>
              <p className="text-[12px] text-[var(--bc-faint)]">{copy("Profil i ustawienia", "Profile and settings")}</p>
            </div>
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" className="mt-1 w-full justify-start gap-2 px-2 text-[var(--bc-muted)] hover:text-[var(--bc-danger)]">
              <LogOut className="h-3.5 w-3.5 shrink-0" /> {copy("Wyloguj", "Log out")}
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
