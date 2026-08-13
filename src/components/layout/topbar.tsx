import Link from "next/link";
import { Plus } from "lucide-react";
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
    <header className="mb-8 flex min-h-14 items-start justify-between gap-6 border-b border-[#d8d8d0] pb-5 dark:border-neutral-700">
      <div className="min-w-0">
        {title ? <h1 className="text-[28px] font-semibold leading-8 tracking-[-0.025em] sm:text-[32px] sm:leading-9">{title}</h1> : null}
        {subtitle ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/projects/new"><Plus className="h-3.5 w-3.5" /> Nowy projekt</Link>
        </Button>
        <ThemeToggle />
        <NotificationBell notifications={notifications} />
      </div>
    </header>
  );
}
