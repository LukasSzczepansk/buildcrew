import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications } from "@/server/data/notifications";

export async function Topbar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const user = await getCurrentUser();
  const notifications = user
    ? (await listNotifications(user.id)).map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))
    : [];

  return (
    <header className="mb-7 flex min-h-14 items-start justify-between gap-6 border-b border-[var(--bc-line)] pb-5">
      <div className="min-w-0">
        {title ? <h1 className="text-[28px] font-semibold leading-[34px] tracking-[-0.02em] sm:text-[30px]">{title}</h1> : null}
        {subtitle ? <p className="mt-1.5 max-w-[680px] text-[14px] leading-5 text-[var(--bc-muted)]">{subtitle}</p> : null}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/projects/new">Dodaj projekt</Link>
        </Button>
        <ThemeToggle />
        <NotificationBell notifications={notifications} />
      </div>
    </header>
  );
}
