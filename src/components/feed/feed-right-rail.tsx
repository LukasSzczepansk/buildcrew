import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ActivityVisual } from "@/components/feed/activity-visual";
import type { AppLocale } from "@/lib/site-config";
import type { RoleType } from "@/db/schema";
import { labelsFor } from "@/lib/constants-i18n";
import { locationLabel } from "@/lib/countries";

export function FeedRightRail({
  locale,
  projects,
  builders,
}: {
  locale: AppLocale;
  projects: { id: string; name: string; tagline: string; technologies: string[] }[];
  builders: { userId: string; username: string; avatarEmoji: string; role: RoleType | null; city: string | null; country: string | null; headline: string | null }[];
}) {
  const en = locale === "en";
  const labels = labelsFor(locale);

  return (
    <aside className="sticky top-4 space-y-4">
      <section className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold text-[var(--bc-ink)]">{en ? "Projects to explore" : "Projekty do odkrycia"}</h2>
          <Link href="/projects" className="text-[11px] font-medium text-[var(--bc-accent-strong)] hover:underline">{en ? "All" : "Wszystkie"}</Link>
        </div>
        <div className="mt-3 space-y-1">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group flex items-center gap-3 rounded-[8px] px-1 py-2.5 hover:bg-[var(--bc-surface-subtle)]">
              <ActivityVisual compact title={project.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-[var(--bc-ink)]">{project.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-[var(--bc-faint)]">{project.technologies.slice(0, 2).join(" · ") || project.tagline}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--bc-faint)]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold text-[var(--bc-ink)]">{en ? "People to meet" : "Ludzie, których warto poznać"}</h2>
          <Link href="/builders" className="text-[11px] font-medium text-[var(--bc-accent-strong)] hover:underline">{en ? "All" : "Wszyscy"}</Link>
        </div>
        <div className="mt-3 space-y-1">
          {builders.map((builder) => (
            <Link key={builder.userId} href={`/builders/${builder.userId}`} className="group flex items-center gap-3 rounded-[8px] px-1 py-2.5 hover:bg-[var(--bc-surface-subtle)]">
              <Avatar username={builder.username} seed={builder.avatarEmoji || builder.username} size="sm" className="h-9 w-9 text-[11px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-[var(--bc-ink)]">@{builder.username}</p>
                <p className="mt-0.5 truncate text-[10px] text-[var(--bc-faint)]">{builder.role ? labels.roles[builder.role] : builder.headline || (en ? "Builder" : "Builder")}{locationLabel(builder.city, builder.country) ? ` · ${locationLabel(builder.city, builder.country)}` : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}
