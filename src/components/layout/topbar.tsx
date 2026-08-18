import Link from "next/link";
import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { listNotifications } from "@/server/data/notifications";

export async function Topbar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  const en = locale === "en";
  const notifications = user ? (await listNotifications(user.id)).map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })) : [];

  return (
    <header className="mb-6 border-b border-[var(--bc-line)] pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {title ? <h1 className="bc-page-title">{title}</h1> : null}
          {subtitle ? <p className="mt-1.5 max-w-[680px] text-sm leading-5 text-[var(--bc-muted)]">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button asChild size="sm" className="hidden sm:inline-flex"><Link href="/projects/new">{en ? "Create project" : "Dodaj projekt"}</Link></Button>
          <Button asChild size="icon" variant="secondary" className="sm:hidden" aria-label={en ? "Create project" : "Dodaj projekt"}><Link href="/projects/new"><Plus className="h-4 w-4" /></Link></Button>
          <LanguageSwitcher compact className="hidden sm:inline-flex" />
          <Button asChild size="icon" variant="ghost" className="lg:hidden" aria-label={en ? "Profile" : "Profil"}><Link href="/profile"><User className="h-4 w-4" /></Link></Button>
          <ThemeToggle />
          <NotificationBell notifications={notifications} />
        </div>
      </div>
    </header>
  );
}
