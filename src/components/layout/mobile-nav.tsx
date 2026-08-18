"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard, MessageCircle, Network, Newspaper, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/components/i18n/locale-provider";

export function MobileNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  const copy = useCopy();
  const navItems = [
    { href: "/dashboard", label: copy("Start", "Home"), icon: LayoutDashboard },
    { href: "/builders", label: copy("Ludzie", "People"), icon: Users },
    { href: "/projects", label: copy("Projekty", "Projects"), icon: FolderKanban },
    { href: "/feed", label: copy("Aktualności", "Feed"), icon: Newspaper },
    { href: "/network", label: copy("Sieć", "Network"), icon: Network },
    { href: "/messages", label: copy("Wiadomości", "Messages"), icon: MessageCircle },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-[var(--bc-line)] bg-[var(--bc-surface)]/95 px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/") || (item.href === "/projects" && pathname.startsWith("/my-projects"));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={cn("relative flex min-w-0 flex-col items-center gap-1 overflow-hidden px-1 py-1 text-[10px] font-medium transition-colors sm:text-[11px]", active ? "text-[var(--bc-ink)]" : "text-[var(--bc-faint)]")}>
            <span className={cn("h-[2px] w-4 rounded-full", active ? "bg-[var(--bc-accent)]" : "bg-transparent")} />
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.7} />
            <span className="max-w-full truncate">{item.label}</span>
            {item.href === "/messages" && unreadMessages > 0 ? <span className="absolute right-[18%] top-1 flex min-w-4 items-center justify-center rounded-full bg-[var(--bc-accent)] px-1 text-[11px] font-semibold text-neutral-950">{unreadMessages > 9 ? "9+" : unreadMessages}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
