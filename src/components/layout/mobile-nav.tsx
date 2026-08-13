"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard, MessageCircle, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Start", icon: LayoutDashboard },
  { href: "/projects", label: "Projekty", icon: FolderKanban },
  { href: "/builders", label: "Ludzie", icon: Users },
  { href: "/messages", label: "Wiadomości", icon: MessageCircle },
  { href: "/profile", label: "Profil", icon: User },
];

export function MobileNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#d8d8d0] bg-[#fafaf7]/95 px-1 py-1.5 backdrop-blur-md dark:border-[var(--bc-line)] dark:bg-[#121211]/95 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className={cn("relative flex min-w-0 flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-colors", active ? "text-neutral-950 dark:text-white" : "text-neutral-500 dark:text-neutral-400")}>
            <span className={cn("mb-0.5 h-[2px] w-4", active ? "bg-neutral-950 dark:bg-lime-300" : "bg-transparent")} />
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.7} />
            {item.label}
            {item.href === "/messages" && unreadMessages > 0 ? <span className="absolute right-[20%] top-1 min-w-4 rounded-[3px] bg-neutral-950 px-1 text-[9px] font-semibold text-white dark:bg-lime-300 dark:text-neutral-950">{unreadMessages > 9 ? "9+" : unreadMessages}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
