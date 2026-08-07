"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hammer,
  HelpCircle,
  Home,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Start", icon: Home },
  { href: "/projects", label: "Projekty", icon: Hammer },
  { href: "/builders", label: "Builderzy", icon: Users },
  { href: "/build", label: "Build Pool", icon: Sparkles },
  { href: "/help", label: "Pomoc", icon: HelpCircle },
  { href: "/profile", label: "Profil", icon: User },
];

export function Sidebar({ username, avatarEmoji, admin = false }: { username: string; avatarEmoji: string; admin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950 lg:flex">
      <Link href="/dashboard" className="mb-5 flex items-center gap-2 px-2 text-lg font-bold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">🛠️</span>
        BuildCrew
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900",
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
        {admin ? (
          <Link
            href="/admin"
            className={cn(
              "mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900",
            )}
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            Panel admina
          </Link>
        ) : null}

      <div className="min-h-3 flex-1" />

      <Button asChild className="mb-3 w-full gap-2">
        <Link href="/projects/new">
          <Plus className="h-4 w-4" /> Dodaj projekt
        </Link>
      </Button>

      <div className="mb-4 space-y-1.5">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2.5 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          <Avatar emoji={avatarEmoji} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{username}</p>
            <p className="text-xs text-neutral-400">Zobacz profil</p>
          </div>
        </Link>

        <form action={logoutAction}>
          <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400">
            <LogOut className="h-4 w-4" />
            Wyloguj się
          </Button>
        </form>
        <div className="flex items-center justify-center gap-3 px-2 pt-1 text-[11px] text-neutral-400">
          <Link href="/regulamin" className="hover:text-neutral-600 dark:hover:text-neutral-200">Regulamin</Link>
          <Link href="/polityka-prywatnosci" className="hover:text-neutral-600 dark:hover:text-neutral-200">Prywatność</Link>
        </div>
      </div>
    </aside>
  );
}
