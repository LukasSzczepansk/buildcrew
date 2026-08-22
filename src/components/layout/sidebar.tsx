"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, FolderKanban, LayoutDashboard, LogOut, MessageCircle, Newspaper, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useCopy } from "@/components/i18n/locale-provider";
import { logoutAction } from "@/server/actions/auth";

export function Sidebar({ username, avatarEmoji, admin = false, founder = false, unreadMessages = 0 }: { username: string; avatarEmoji: string; admin?: boolean; founder?: boolean; unreadMessages?: number }) {
  const pathname = usePathname();
  const copy = useCopy();

  const primaryItems = [
    { href: "/dashboard", label: copy("Start", "Home"), icon: LayoutDashboard },
    { href: "/builders", label: copy("Ludzie", "People"), icon: Users },
    { href: "/projects", label: copy("Projekty", "Projects"), icon: FolderKanban },
    { href: "/feed", label: copy("Społeczność", "Community"), icon: Newspaper },
    { href: "/messages", label: copy("Wiadomości", "Messages"), icon: MessageCircle },
  ] as const;

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/") || (href === "/projects" && pathname.startsWith("/my-projects"));
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-[236px] shrink-0 overflow-hidden border-r border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-3.5 py-4 lg:flex lg:flex-col xl:w-[248px] [@media(max-height:720px)]:py-3">
      <Link href="/dashboard" className="mb-5 flex items-center gap-3 px-1.5 text-[16px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)] [@media(max-height:720px)]:mb-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">BC</span>
        <span className="truncate">BuildCrew</span>
      </Link>

      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bc-faint)]">{copy("Główne", "Main")}</p>
      <nav className="space-y-1">
        {primaryItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex min-h-10 items-center gap-2.5 rounded-[8px] px-3 text-sm font-medium transition-colors [@media(max-height:720px)]:min-h-9",
                active ? "bg-[var(--bc-surface)] text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:bg-[var(--bc-surface)] hover:text-[var(--bc-ink)]",
              )}
            >
              {active ? <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-[var(--bc-accent)]" /> : null}
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.8} />
              <span className="min-w-0 flex-1">{item.label}</span>
              {item.href === "/messages" && unreadMessages > 0 ? <span className="min-w-5 rounded-full bg-[var(--bc-accent)] px-1.5 py-0.5 text-center text-[11px] font-semibold text-neutral-950">{unreadMessages > 99 ? "99+" : unreadMessages}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 border-t border-[var(--bc-line)] pt-3 [@media(max-height:720px)]:mt-2 [@media(max-height:720px)]:pt-2">
        <div className="mb-2 flex items-center justify-between gap-2 px-2">
          <span className="text-[11px] text-[var(--bc-faint)]">{copy("Język", "Language")}</span>
          <LanguageSwitcher compact />
        </div>
        <Link href="/help" className="flex min-h-9 items-center gap-2.5 rounded-[8px] px-3 text-[13px] text-[var(--bc-muted)] transition-colors hover:bg-[var(--bc-surface)] hover:text-[var(--bc-ink)] [@media(max-height:720px)]:min-h-8">
          <CircleHelp className="h-3.5 w-3.5" /> {copy("Pomoc", "Help")}
        </Link>
        {admin ? (
          <Link
            href="/admin"
            className={cn(
              "mt-1 flex min-h-9 items-center gap-2.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors [@media(max-height:720px)]:min-h-8",
              pathname.startsWith("/admin") ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "text-[var(--bc-muted)] hover:bg-[var(--bc-surface)] hover:text-[var(--bc-ink)]",
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            <span className="min-w-0 truncate">{copy("Panel admina", "Admin panel")}</span>
          </Link>
        ) : null}
      </div>

      <div className="min-h-3 flex-1" />

      <div className="border-t border-[var(--bc-line)] pt-2.5">
        <Link href="/profile" className="flex items-center gap-2.5 rounded-[8px] px-2 py-2 transition-colors hover:bg-[var(--bc-surface)]">
          <Avatar username={username} seed={avatarEmoji || username} size="sm" className={cn("h-9 w-9 shrink-0 text-[13px]", founder && "ring-2 ring-[#C8F169] ring-offset-2 ring-offset-[var(--bc-surface-subtle)]")} />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-sm font-medium text-[var(--bc-ink)]">{username}</p>
              {founder ? <UserRoleBadge founder compact /> : admin ? <UserRoleBadge systemRole="ADMIN" compact /> : null}
            </div>
            <p className="truncate text-[11px] text-[var(--bc-faint)]">{copy("Profil i ustawienia", "Profile & settings")}</p>
          </div>
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="mt-0.5 h-8 w-full justify-start gap-2 px-2 text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-danger)]">
            <LogOut className="h-3.5 w-3.5 shrink-0" /> {copy("Wyloguj się", "Log out")}
          </Button>
        </form>
      </div>
    </aside>
  );
}
