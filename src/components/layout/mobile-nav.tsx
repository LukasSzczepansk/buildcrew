"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard, MessageCircle, Network, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/builders", label: "People", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/network", label: "Network", icon: Network },
  { href: "/messages", label: "Messages", icon: MessageCircle },
] as const;

export function MobileNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--bc-line)] bg-[var(--bc-surface)]/95 px-1 py-2 backdrop-blur-md lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/") || (item.href === "/projects" && pathname.startsWith("/my-projects"));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={cn("relative flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-[11px] font-medium transition-colors", active ? "text-[var(--bc-ink)]" : "text-[var(--bc-faint)]")}>
            <span className={cn("h-[2px] w-4 rounded-full", active ? "bg-[var(--bc-accent)]" : "bg-transparent")} />
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.7} />
            {item.label}
            {item.href === "/messages" && unreadMessages > 0 ? <span className="absolute right-[18%] top-1 flex min-w-4 items-center justify-center rounded-full bg-[var(--bc-accent)] px-1 text-[11px] font-semibold text-neutral-950">{unreadMessages > 9 ? "9+" : unreadMessages}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
