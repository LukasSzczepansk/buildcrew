import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { ActivityVisual } from "@/components/feed/activity-visual";
import { SocialPostActions } from "@/components/feed/social-post-actions";
import { Avatar } from "@/components/ui/avatar";
import type { RoleType, SocialPostKind } from "@/db/schema";
import type { AppLocale } from "@/lib/site-config";
import { labelsFor } from "@/lib/constants-i18n";
import { locationLabel } from "@/lib/countries";
import { socialPostKindLabel, socialPostPrimaryCta, socialPostTitle, socialPostVisualKind } from "@/lib/social-posts";
import { timeAgo } from "@/lib/utils";

export type SocialFeedItem = {
  id: string;
  kind: SocialPostKind;
  body: string;
  createdAt: Date;
  authorId: string;
  username: string;
  avatarEmoji: string;
  role: RoleType | null;
  headline: string | null;
  country: string | null;
  city: string | null;
  projectId: string | null;
  launchId: string | null;
  launchSlug: string | null;
  launchTitle: string | null;
  launchTagline: string | null;
  projectName: string | null;
  projectTagline: string | null;
  likeCount: number;
  commentCount: number;
  viewerLiked: boolean;
  viewerSaved: boolean;
};

export function SocialFeedCard({ item, locale, viewerId }: { item: SocialFeedItem; locale: AppLocale; viewerId?: string }) {
  const labels = labelsFor(locale);
  const launchPost = Boolean(item.kind === "LAUNCH" && item.launchId);
  const title = launchPost && item.launchTitle ? item.launchTitle : socialPostTitle(item, locale);
  const eyebrow = socialPostKindLabel(item.kind, locale);
  const en = locale === "en";
  const role = item.role ? labels.roles[item.role] : item.headline;
  const location = locationLabel(item.city, item.country);
  const projectPost = Boolean(!launchPost && item.projectId && ["UPDATE", "LOOKING_FOR_PEOPLE", "MILESTONE", "LAUNCH"].includes(item.kind));
  const href = launchPost && item.launchId ? `/launches/${item.launchSlug || item.launchId}` : projectPost && item.projectId ? `/projects/${item.projectId}` : `/builders/${item.authorId}`;
  const visual = item.kind === "MILESTONE" || item.kind === "LAUNCH";
  const badgeClass = badgeClasses(item.kind);

  return (
    <article className="overflow-hidden rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] transition-colors hover:border-[var(--bc-line-strong)]">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar username={item.username} seed={item.avatarEmoji || item.username} size="sm" className="h-10 w-10 shrink-0 text-[12px] sm:h-11 sm:w-11" />
            <div className="min-w-0">
              <Link href={`/builders/${item.authorId}`} className="block truncate text-[13px] font-semibold text-[var(--bc-ink)] hover:underline sm:text-[14px]">@{item.username}</Link>
              <p className="mt-0.5 truncate text-[11px] text-[var(--bc-faint)] sm:text-[12px]">{[role, location, timeAgo(item.createdAt, locale)].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--bc-faint)] hover:bg-[var(--bc-surface-subtle)]" aria-label={en ? "Post menu" : "Menu posta"}><MoreHorizontal className="h-4 w-4" /></button>
        </div>

        <div className="mt-4">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[10px] ${badgeClass}`}>{eyebrow}</span>
          <Link href={href} className="mt-2.5 block text-[17px] font-semibold tracking-[-0.02em] text-[var(--bc-ink)] hover:underline sm:text-[19px]">{title}</Link>
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.55] text-[var(--bc-muted)] sm:text-[14px] sm:leading-6">{item.body}</p>
        </div>

        {launchPost && item.launchId && item.launchTitle ? (
          <Link href={href} className="group mt-4 flex items-center gap-3 rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-3 transition-colors hover:border-[var(--bc-line-strong)] sm:p-3.5">
            <ActivityVisual compact title={item.launchTitle} label={eyebrow} kind="launch" />
            <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[var(--bc-ink)] sm:text-[14px]">{item.launchTitle}</p>{item.launchTagline ? <p className="mt-0.5 bc-truncate-2 text-[11px] leading-4 text-[var(--bc-faint)] sm:text-[12px]">{item.launchTagline}</p> : null}</div>
            <span className="hidden shrink-0 text-[11px] font-semibold text-[var(--bc-accent-strong)] sm:inline">{en ? "View launch" : "Zobacz premierę"}</span>
          </Link>
        ) : projectPost && item.projectId && item.projectName ? (
          <Link href={`/projects/${item.projectId}`} className="group mt-4 flex items-center gap-3 rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-3 transition-colors hover:border-[var(--bc-line-strong)] sm:p-3.5">
            <ActivityVisual compact title={item.projectName} label={eyebrow} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[var(--bc-ink)] sm:text-[14px]">{item.projectName}</p>
              {item.projectTagline ? <p className="mt-0.5 bc-truncate-2 text-[11px] leading-4 text-[var(--bc-faint)] sm:text-[12px]">{item.projectTagline}</p> : null}
            </div>
            <span className="hidden shrink-0 text-[11px] font-semibold text-[var(--bc-accent-strong)] sm:inline">{en ? "View project" : "Zobacz projekt"}</span>
          </Link>
        ) : null}

        {visual ? (
          <Link href={href} className="mt-4 block h-[170px] sm:h-[220px]">
            <ActivityVisual title={item.launchTitle ?? item.projectName ?? item.username} label={eyebrow} kind={socialPostVisualKind(item.kind) === "launch" ? "launch" : "milestone"} className="h-full" />
          </Link>
        ) : null}
      </div>

      <SocialPostActions
        postId={item.id}
        initialLiked={item.viewerLiked}
        initialSaved={item.viewerSaved}
        initialLikeCount={Number(item.likeCount ?? 0)}
        initialCommentCount={Number(item.commentCount ?? 0)}
        canManage={viewerId === item.authorId}
        primaryHref={href}
        primaryLabel={socialPostPrimaryCta(item.kind, locale)}
      />
    </article>
  );
}

function badgeClasses(kind: SocialPostKind) {
  switch (kind) {
    case "QUESTION": return "bg-sky-500/12 text-sky-700 dark:text-sky-300";
    case "KNOWLEDGE": return "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300";
    case "IDEA": return "bg-amber-500/14 text-amber-800 dark:text-amber-300";
    case "LOOKING_FOR_PEOPLE": return "bg-blue-500/12 text-blue-600 dark:text-blue-300";
    case "LOOKING_FOR_PROJECT": return "bg-orange-500/12 text-orange-700 dark:text-orange-300";
    case "MILESTONE": return "bg-violet-500/12 text-violet-700 dark:text-violet-300";
    case "LAUNCH": return "bg-[color-mix(in_srgb,var(--bc-accent)_16%,transparent)] text-[var(--bc-accent-strong)]";
    case "OPEN_TO_BUILDING": return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300";
    default: return "bg-[var(--bc-surface-subtle)] text-[var(--bc-faint)]";
  }
}
