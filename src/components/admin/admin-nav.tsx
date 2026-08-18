"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarRange, Flag, FolderKanban, Image as ImageIcon, LayoutDashboard, MessageSquareText, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/components/i18n/locale-provider";


export function AdminNav() {
  const pathname = usePathname();
  const copy = useCopy();
  const items = [
    { href: "/admin", label: copy("Podsumowanie", "Overview"), icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: copy("Użytkownicy", "Users"), icon: Users },
    { href: "/admin/avatars", label: copy("Zdjęcia", "Photos"), icon: ImageIcon },
    { href: "/admin/projects", label: copy("Projekty", "Projects"), icon: FolderKanban },
    { href: "/admin/hackathons", label: copy("Hackathony", "Hackathons"), icon: CalendarRange },
    { href: "/admin/challenges", label: copy("Wyzwania", "Challenges"), icon: Trophy },
    { href: "/admin/reports", label: copy("Zgłoszenia", "Reports"), icon: Flag },
    { href: "/admin/content", label: copy("Treści", "Content"), icon: MessageSquareText },
    { href: "/admin/activity", label: copy("Aktywność", "Activity"), icon: Activity },
  ] as const;
  return (
    <div className="mb-7 overflow-x-auto rounded-lg border border-neutral-300 bg-white p-1.5 dark:border-neutral-800 dark:bg-neutral-900">
      <nav className="flex min-w-max gap-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-[6px] px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
