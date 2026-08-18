import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ActivityVisual } from "@/components/feed/activity-visual";

export function FeedStoryCard({
  href,
  title,
  eyebrow,
  body,
  meta,
  visualKind = "project",
  showVisual = false,
  ctaLabel = "Zobacz",
}: {
  href: string;
  title: string;
  eyebrow: string;
  body?: string | null;
  meta?: string | null;
  visualKind?: "project" | "people" | "launch" | "milestone";
  showVisual?: boolean;
  ctaLabel?: string;
}) {
  return (
    <article className="overflow-hidden rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] transition-colors hover:border-[var(--bc-line-strong)]">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <ActivityVisual compact title={title} label={eyebrow} kind={visualKind} />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-accent-strong)] sm:text-[10px]">{eyebrow}</p>
            <Link href={href} className="mt-0.5 block truncate text-[14px] font-semibold text-[var(--bc-ink)] hover:underline sm:text-[15px]">{title}</Link>
            {meta ? <p className="mt-0.5 truncate text-[11px] text-[var(--bc-faint)]">{meta}</p> : null}
          </div>
        </div>

        {body ? <p className="mt-4 whitespace-pre-wrap text-[13px] leading-[1.55] text-[var(--bc-muted)] sm:text-[14px]">{body}</p> : null}
        {showVisual ? <Link href={href} className="mt-4 block h-[170px] sm:h-[215px]"><ActivityVisual title={title} label={eyebrow} kind={visualKind} className="h-full" /></Link> : null}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--bc-line)] px-4 py-3 sm:px-5">
        <span className="text-[11px] text-[var(--bc-faint)]">BuildCrew</span>
        <Link href={href} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--bc-accent-strong)] hover:underline sm:text-[12px]">{ctaLabel} <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </article>
  );
}
