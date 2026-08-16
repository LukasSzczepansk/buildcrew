"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard, MessageCircle, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/components/i18n/locale-provider";

const NAV_ITEMS = [
  { href: "/dashboard", key: "start", icon: LayoutDashboard },
  { href: "/builders", key: "people", icon: Users },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/messages", key: "messages", icon: MessageCircle },
  { href: "/profile", key: "profile", icon: User },
] as const;

export function MobileNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  const copy = useCopy();
  const labels = { start: copy("Home", "Home"), people: copy("People", "People"), projects: copy("Projects", "Projects"), messages: copy("Messages", "Messages"), profile: copy("Profile", "Profile") };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--bc-line)] bg-[var(--bc-surface)]/95 px-1 py-2 backdrop-blur-md lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/") || (item.href === "/projects" && pathname.startsWith("/my-projects")) || (item.href === "/builders" && pathname.startsWith("/network"));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={cn("relative flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-[11px] font-medium transition-colors", active ? "text-[var(--bc-ink)]" : "text-[var(--bc-faint)]")}>
            <span className={cn("h-[2px] w-4 rounded-full", active ? "bg-[var(--bc-accent)]" : "bg-transparent")} />
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.7} />
            {labels[item.key]}
            {item.href === "/messages" && unreadMessages > 0 ? <span className="absolute right-[18%] top-1 flex min-w-4 items-center justify-center rounded-full bg-[var(--bc-accent)] px-1 text-[11px] font-semibold text-neutral-950">{unreadMessages > 9 ? "9+" : unreadMessages}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
