"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hammer, HelpCircle, Home, MessageCircle, Sparkles, Trophy, User, UserRoundCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Start", icon: Home },
  { href: "/projects", label: "Projekty", icon: Hammer },
  { href: "/builders", label: "Builderzy", icon: Users },
  { href: "/build", label: "Build Pool", icon: Sparkles },
  { href: "/showcase", label: "Showcase", icon: Trophy },
  { href: "/friends", label: "Znajomi", icon: UserRoundCheck },
  { href: "/messages", label: "Wiadomości", icon: MessageCircle },
  { href: "/help", label: "Pomoc", icon: HelpCircle },
  { href: "/profile", label: "Profil", icon: User },
];

export function MobileNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-start overflow-x-auto border-t border-neutral-200 bg-white/95 px-1 py-1.5 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex min-w-16 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
              active ? "text-violet-600 dark:text-violet-400" : "text-neutral-500 dark:text-neutral-400",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
            {item.href === "/messages" && unreadMessages > 0 ? (
              <span className="absolute right-2 top-0.5 rounded-full bg-violet-600 px-1 text-[9px] font-semibold text-white">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
