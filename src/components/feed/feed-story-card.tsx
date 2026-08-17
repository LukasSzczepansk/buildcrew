import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ActivityVisual } from "@/components/feed/activity-visual";

export function FeedStoryCard({ href, title, eyebrow, body, meta, visualKind = "project" }: { href: string; title: string; eyebrow: string; body?: string | null; meta?: string | null; visualKind?: "project" | "people" | "launch" }) {
  return (
    <article className="overflow-hidden rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)]">
      <Link href={href} className="grid gap-0 sm:grid-cols-[180px_minmax(0,1fr)]">
        <ActivityVisual title={title} label={eyebrow} kind={visualKind} />
        <div className="flex min-w-0 flex-col justify-between p-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-faint)]">{eyebrow}</p><h3 className="mt-1.5 text-[16px] font-semibold tracking-[-0.015em] text-[var(--bc-ink)]">{title}</h3>{body ? <p className="mt-2 bc-truncate-3 text-[13px] leading-5 text-[var(--bc-muted)]">{body}</p> : null}</div>
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[11px] text-[var(--bc-faint)]">{meta}</span><ArrowUpRight className="h-4 w-4 text-[var(--bc-faint)]" /></div>
        </div>
      </Link>
    </article>
  );
}
