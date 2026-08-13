"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleHelp,
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Trophy,
  UserRoundCheck,
  Users,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";
import { AI_CONTEST, DISCORD_INVITE_URL, isAiContestActive } from "@/lib/community";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Start", icon: LayoutDashboard },
  { href: "/projects", label: "Projekty", icon: FolderKanban },
  { href: "/builders", label: "Builderzy", icon: Users },
  { href: "/build", label: "Build Pool", icon: Waves },
];

const COMMUNITY_NAV = [
  { href: "/messages", label: "Wiadomości", icon: MessageCircle },
  { href: "/friends", label: "Znajomi", icon: UserRoundCheck },
  { href: "/showcase", label: "Showcase", icon: Trophy },
];

function NavGroup({
  label,
  items,
  pathname,
  unreadMessages,
}: {
  label: string;
  items: typeof PRIMARY_NAV;
  pathname: string;
  unreadMessages: number;
}) {
  return (
    <div>
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500">{label}</p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex h-9 items-center gap-2.5 rounded-[5px] px-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-black/[0.055] text-neutral-950 dark:bg-white/[0.08] dark:text-white"
                  : "text-neutral-600 hover:bg-black/[0.035] hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white",
              )}
            >
              {active ? <span className="absolute -left-[13px] h-5 w-[3px] bg-neutral-950 dark:bg-lime-300" /> : null}
              <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/messages" && unreadMessages > 0 ? (
                <span className="min-w-5 rounded-[4px] bg-neutral-900 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white dark:bg-lime-300 dark:text-neutral-950">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              ) : null}
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
    <aside className="sticky top-0 hidden h-dvh w-[224px] shrink-0 flex-col border-r border-[#d8d8d0] bg-[#efefe9] px-4 py-5 dark:border-[#34342f] dark:bg-[#151513] lg:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-1 text-[18px] font-semibold tracking-[-0.025em]">
        <span className="h-4 w-[5px] bg-[#c8f169] ring-1 ring-black/10" />
        BuildCrew
      </Link>

      <div className="space-y-7">
        <NavGroup label="Praca" items={PRIMARY_NAV} pathname={pathname} unreadMessages={unreadMessages} />
        <NavGroup label="Społeczność" items={COMMUNITY_NAV} pathname={pathname} unreadMessages={unreadMessages} />
      </div>

      {admin ? (
        <div className="mt-7 border-t border-[#d8d8d0] pt-4 dark:border-neutral-700">
          <Link
            href="/admin"
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-[5px] px-2 text-[13px] font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-neutral-950 text-white dark:bg-neutral-100 dark:text-neutral-950"
                : "text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white",
            )}
          >
            <ShieldCheck className="h-[15px] w-[15px]" strokeWidth={1.8} />
            Panel admina
          </Link>
        </div>
      ) : null}

      <div className="min-h-6 flex-1" />

      {isAiContestActive() ? (
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="mb-4 border-l-2 border-[#c8f169] pl-3 text-[11px] leading-4 text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">
          <span className="block font-semibold text-neutral-800 dark:text-neutral-200">{AI_CONTEST.shortTitle}</span>
          <span className="mt-0.5 inline-flex items-center gap-1 text-neutral-500">do {AI_CONTEST.deadlineLabel} <ExternalLink className="h-3 w-3" /></span>
        </a>
      ) : null}

      <div className="mb-4 flex items-center gap-4 px-1 text-[12px] text-neutral-500">
        <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-950 hover:underline dark:hover:text-white">Discord</a>
        <Link href="/help" className="inline-flex items-center gap-1 hover:text-neutral-950 hover:underline dark:hover:text-white"><CircleHelp className="h-3.5 w-3.5" /> Pomoc</Link>
      </div>

      <div className="border-t border-[#d8d8d0] pt-3 dark:border-neutral-700">
        <Link href="/profile" className="flex items-center gap-2.5 rounded-[5px] px-1 py-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]">
          <Avatar emoji={avatarEmoji} size="sm" className="h-7 w-7 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{username}</p>
            <p className="text-[10px] text-neutral-400">Profil i ustawienia</p>
          </div>
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="mt-1 w-full justify-start gap-2 px-2 text-neutral-500 hover:text-red-700 dark:text-neutral-400 dark:hover:text-red-400">
            <LogOut className="h-3.5 w-3.5" /> Wyloguj
          </Button>
        </form>
      </div>
    </aside>
  );
}
