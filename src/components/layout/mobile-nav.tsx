"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FolderKanban, HelpCircle, LayoutDashboard, MessageCircle, MoreHorizontal, Newspaper, Rocket, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/components/i18n/locale-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function MobileNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  const copy = useCopy();
  const navItems = [
    { href: "/dashboard", label: copy("Start", "Home"), icon: LayoutDashboard },
    { href: "/builders", label: copy("Ludzie", "People"), icon: Users },
    { href: "/projects", label: copy("Projekty", "Projects"), icon: FolderKanban },
    { href: "/messages", label: copy("Wiadomości", "Messages"), icon: MessageCircle },
  ] as const;
  const moreItems = [
    { href: "/feed", label: copy("Społeczność", "Community"), icon: Newspaper },
    { href: "/launches", label: copy("Premiery", "Launches"), icon: Rocket },
    { href: "/notifications", label: copy("Powiadomienia", "Notifications"), icon: Bell },
    { href: "/profile", label: copy("Mój profil", "My profile"), icon: User },
    { href: "/help", label: copy("Pomoc", "Help"), icon: HelpCircle },
  ] as const;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") || (href === "/projects" && pathname.startsWith("/my-projects"));
  const moreActive = moreItems.some((item) => isActive(item.href));

  const itemClass = (active: boolean) =>
    cn(
      "relative flex min-h-12 min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1 text-[11px] font-medium transition-colors",
      active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]",
    );

  return (
    <nav
      aria-label={copy("Nawigacja główna", "Main navigation")}
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--bc-line)] bg-[var(--bc-surface)]/95 px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
    >
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={itemClass(active)}>
            <span className={cn("h-[2px] w-4 rounded-full", active ? "bg-[var(--bc-accent)]" : "bg-transparent")} />
            <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.7} />
            <span className="max-w-full truncate">{item.label}</span>
            {item.href === "/messages" && unreadMessages > 0 ? (
              <span className="absolute right-[24%] top-1 flex min-w-4 items-center justify-center rounded-full bg-[var(--bc-accent)] px-1 text-[11px] font-semibold text-neutral-950">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            ) : null}
          </Link>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(itemClass(moreActive), "outline-none")} aria-label={copy("Więcej", "More")}>
          <span className={cn("h-[2px] w-4 rounded-full", moreActive ? "bg-[var(--bc-accent)]" : "bg-transparent")} />
          <MoreHorizontal className="h-5 w-5" strokeWidth={moreActive ? 2 : 1.7} />
          <span>{copy("Więcej", "More")}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="min-w-[13rem]">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
