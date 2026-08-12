import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications } from "@/server/data/notifications";
import { DISCORD_INVITE_URL } from "@/lib/community";

export async function Topbar({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const user = await getCurrentUser();
  const notifications = user
    ? (await listNotifications(user.id)).map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))
    : [];

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" className="hidden gap-1.5 sm:flex">
          <Link href="/projects/new">
            <Plus className="h-4 w-4" /> Dodaj projekt
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" aria-label="Discord BuildCrew"><MessageCircle className="h-4 w-4" /><span className="hidden md:inline">Discord</span></a>
        </Button>
        <ThemeToggle />
        <NotificationBell notifications={notifications} />
      </div>
    </div>
  );
}
