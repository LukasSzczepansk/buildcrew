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
    <article className="bc-lift group rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4 shadow-[var(--bc-shadow-xs)] sm:p-5">
      {rank === 1 ? (
        <p className="mb-3 inline-flex rounded-full bg-[var(--bc-accent)] px-2.5 py-0.5 text-[12px] font-semibold text-[#1c1b17]">
          {en ? "#1 this week" : "#1 tego tygodnia"}
        </p>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[168px_minmax(0,1fr)_auto] md:items-center md:gap-5">
        <Link
          href={href}
          className="block overflow-hidden rounded-[var(--bc-radius)] border border-[var(--bc-line)] bg-[var(--bc-surface-2)]"
        >
          {item.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/launches/images/${item.coverImage.id}`}
              alt=""
              loading="lazy"
              className="aspect-[16/10] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="grid aspect-[16/10] place-items-center text-[24px] font-semibold tracking-[-0.04em] text-[var(--bc-faint)]">
              {item.title.slice(0, 2).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="min-w-0">
          <Link href={href} className="block">
            <h2 className="truncate text-[19px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)] group-hover:underline">
              {item.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-[var(--bc-muted)]">
              {item.tagline}
            </p>
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
            {primaryNeed ? (
              <span className="rounded-full border border-[var(--bc-accent-strong)]/50 bg-[var(--bc-accent-soft)] px-2.5 py-0.5 font-medium text-[var(--bc-accent-ink)]">
                {launchNeedLabel(primaryNeed, locale)}
              </span>
            ) : null}
            <span className="rounded-full border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-2.5 py-0.5 text-[var(--bc-muted)]">
              {launchCategoryLabel(item.category, locale)}
            </span>
            {item.technologies.slice(0, 3).map((tech) => (
              <span key={tech} className="rounded-full border border-[var(--bc-line)] px-2.5 py-0.5 text-[var(--bc-muted)]">
                {tech}
              </span>
            ))}
          </div>

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-[var(--bc-faint)]">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar username={item.username} seed={item.avatarEmoji || item.creatorId} size="sm" className="h-5 w-5 text-[10px]" />
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
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {metaTime}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[13px] text-[var(--bc-muted)] md:flex-col md:gap-3">
          <LaunchVoteButton entryId={item.id} count={item.voteCount} voted={item.viewerVoted} canVote={canVote} returnTo={href} compact />
          <Link href={href + "#discussion"} className="inline-flex items-center gap-1.5 hover:text-[var(--bc-ink)]" aria-label={en ? `${item.commentCount} comments` : `Komentarze: ${item.commentCount}`}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">{item.commentCount}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
