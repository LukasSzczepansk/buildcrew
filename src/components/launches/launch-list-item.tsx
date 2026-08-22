import Link from "next/link";
import { Clock3, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { AppLocale } from "@/lib/site-config";
import { launchCategoryLabel, launchNeedLabel } from "@/lib/launches";
import { LaunchVoteButton } from "@/components/launches/launch-vote-button";

type Item = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: Parameters<typeof launchCategoryLabel>[0];
  technologies: string[];
  needs: Parameters<typeof launchNeedLabel>[0][];
  username: string;
  avatarEmoji: string;
  creatorId: string;
  creatorPublicProfile: boolean;
  creatorCount: number;
  voteCount: number;
  commentCount: number;
  viewerVoted: boolean;
  createdAt: Date;
  coverImage: { id: string; width: number; height: number } | null;
};

function relativeTimeLabel(date: Date, locale: AppLocale) {
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale === "en" ? "en" : "pl", { numeric: "auto" });

  const absMinutes = Math.abs(diffMinutes);
  if (absMinutes < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
  const diffWeeks = Math.round(diffDays / 7);
  return rtf.format(diffWeeks, "week");
}

export function LaunchListItem({ item, locale, canVote, rank }: { item: Item; locale: AppLocale; canVote: boolean; rank?: number }) {
  const en = locale === "en";
  const href = `/launches/${item.slug}`;
  const authorHref = item.creatorPublicProfile ? `/u/${item.username}` : null;
  const primaryNeed = item.needs[0];
  const metaTime = relativeTimeLabel(new Date(item.createdAt), locale);

  return (
    <article className="border-b border-[var(--bc-line)] py-5 first:border-t sm:py-6">
      {rank === 1 ? (
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-faint)]">
          {en ? "#1 this week" : "#1 tego tygodnia"}
        </p>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[118px_minmax(0,1fr)_132px] md:items-start">
        <Link
          href={href}
          className="block overflow-hidden rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)]"
        >
          {item.coverImage ? (
            <img
              src={`/api/launches/images/${item.coverImage.id}`}
              alt=""
              loading="lazy"
              className="aspect-[4/3] w-full object-cover object-top"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center text-[20px] font-semibold tracking-[-0.04em] text-[var(--bc-faint)]">
              {item.title.slice(0, 2).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="min-w-0">
          <Link href={href} className="group block">
            <h2 className="truncate text-[18px] font-semibold tracking-[-0.03em] text-[var(--bc-ink)] group-hover:underline">
              {item.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--bc-muted)]">
              {item.tagline}
            </p>
          </Link>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--bc-faint)] sm:text-[11px]">
            <span className="rounded-[999px] border border-[var(--bc-line)] px-2 py-0.5">
              {launchCategoryLabel(item.category, locale)}
            </span>
            {item.technologies.slice(0, 3).map((tech) => (
              <span key={tech} className="rounded-[999px] border border-[var(--bc-line)] px-2 py-0.5">
                {tech}
              </span>
            ))}
          </div>

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-[var(--bc-faint)]">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar username={item.username} seed={item.avatarEmoji || item.creatorId} size="sm" className="h-5 w-5 text-[8px]" />
              {authorHref ? (
                <Link href={authorHref} className="truncate hover:text-[var(--bc-ink)] hover:underline">
                  {item.username}
                </Link>
              ) : (
                <span className="truncate">{item.username}</span>
              )}
              {item.creatorCount > 1 ? <span>+ {item.creatorCount - 1}</span> : null}
            </div>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {metaTime}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 items-start justify-between gap-4 md:flex-col md:items-end md:justify-between md:self-stretch">
          <div className="min-w-0 md:text-right">
            {primaryNeed ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-accent-strong)]">
                  {en ? "Looking for" : "Szukam"}
                </p>
                <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-[var(--bc-ink)]">
                  {launchNeedLabel(primaryNeed, locale)}
                </p>
              </>
            ) : (
              <p className="text-[12px] text-[var(--bc-faint)]">&nbsp;</p>
            )}
          </div>

          <div className="flex items-center gap-4 self-end text-[12px] text-[var(--bc-faint)] md:mt-6">
            <LaunchVoteButton entryId={item.id} count={item.voteCount} voted={item.viewerVoted} canVote={canVote} returnTo={href} compact />
            <Link href={href + "#discussion"} className="inline-flex items-center gap-1.5 hover:text-[var(--bc-ink)]">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{item.commentCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
