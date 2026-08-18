"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Lightbulb, ThumbsUp, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import type { ShowcaseCategory, ShowcaseReaction, ShowcaseStatus } from "@/db/schema";
import { toggleShowcaseReaction } from "@/server/actions/showcase";

export type ShowcaseCardData = {
  id: string;
  creatorId: string;
  title: string;
  tagline: string;
  screenshotUrl: string | null;
  liveUrl: string | null;
  githubUrl: string | null;
  category: ShowcaseCategory;
  status: ShowcaseStatus;
  lookingForCollaborators: boolean;
  lookingForText: string | null;
  projectId: string | null;
  crewId: string | null;
  challengeId: string | null;
  creator: { userId: string; username: string; avatarEmoji: string; role: string | null } | null;
  team: { userId: string; username: string; avatarEmoji: string; role: string | null }[];
  reactionCounts: Record<ShowcaseReaction, number>;
  viewerReactions: ShowcaseReaction[];
  feedbackCount: number;
  wouldUsePercent: number | null;
  score: number;
  isDemo: boolean;
};

export function ShowcaseCard({ entry, currentUserId }: { entry: ShowcaseCardData; currentUserId?: string }) {
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
  const reactions = [
    { key: "APPLAUSE" as const, Icon: ThumbsUp, label: labels.showcaseReactions.APPLAUSE },
    { key: "IDEA" as const, Icon: Lightbulb, label: labels.showcaseReactions.IDEA },
    { key: "POTENTIAL" as const, Icon: TrendingUp, label: labels.showcaseReactions.POTENTIAL },
  ];
  const [counts, setCounts] = React.useState(entry.reactionCounts);
  const [active, setActive] = React.useState(new Set(entry.viewerReactions));
  const [pending, setPending] = React.useState<ShowcaseReaction | null>(null);

  async function react(reaction: ShowcaseReaction) {
    if (!currentUserId) { toast.error(copy("Zaloguj się, żeby zareagować.", "Log in to react.")); return; }
    if (currentUserId === entry.creatorId) { toast.error(copy("Nie możesz oceniać własnego projektu.", "You cannot react to your own project.")); return; }
    setPending(reaction);
    const result = await toggleShowcaseReaction(entry.id, reaction);
    setPending(null);
    if (result?.error) { toast.error(appMessage(result.error, locale)); return; }
    setActive((previous) => { const next = new Set(previous); if (result?.active) next.add(reaction); else next.delete(reaction); return next; });
    setCounts((previous) => ({ ...previous, [reaction]: Math.max(0, previous[reaction] + (result?.active ? 1 : -1)) }));
  }

  return (
    <Card className="overflow-hidden transition-colors hover:border-[var(--bc-line-strong)]">
      {entry.screenshotUrl ? (
        <Link href={`/showcase/${entry.id}`} className="block aspect-[16/9] overflow-hidden bg-[var(--bc-surface-2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={entry.screenshotUrl} alt={copy(`${entry.title} preview`, `${entry.title} preview`)} className="h-full w-full object-cover" />
        </Link>
      ) : (
        <Link href={`/showcase/${entry.id}`} className="flex aspect-[16/9] items-end border-b border-[var(--bc-line)] bg-[var(--bc-surface-2)] p-5"><span className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--bc-faint)]">{entry.title.slice(0, 2).toUpperCase()}</span></Link>
      )}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{labels.showcaseCategories[entry.category]}</Badge>
          <Badge variant="secondary">{labels.showcaseStatuses[entry.status]}</Badge>
          {entry.isDemo ? <Badge variant="outline">Demo</Badge> : null}
          {entry.crewId ? <Badge variant="outline">{copy("Ekipa BuildCrew", "BuildCrew team")}</Badge> : null}
          {entry.challengeId ? <Badge variant="warning">Challenge</Badge> : null}
        </div>
        <Link href={`/showcase/${entry.id}`}><h3 className="mt-3 text-[17px] font-semibold tracking-[-0.015em] hover:underline">{entry.title}</h3></Link>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--bc-muted)]">{entry.tagline}</p>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--bc-line)] pt-3">
          <div className="flex -space-x-2">{entry.team.slice(0, 4).map((member) => <div key={member.userId} title={member.username}><Avatar username={member.username} seed={member.userId} size="sm" className="h-7 w-7 border-2 border-[var(--bc-surface)] text-[11px]" /></div>)}</div>
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--bc-faint)]"><Users className="h-3.5 w-3.5" /> {Math.max(1, entry.team.length)}</div>
        </div>

        {entry.lookingForCollaborators ? <p className="mt-3 line-clamp-2 border-l-2 border-[var(--bc-accent)] pl-3 text-[13px] leading-5 text-[var(--bc-muted)]"><span className="font-medium text-[var(--bc-ink)]">{copy("Szukają współtwórców.", "Looking for collaborators.")}</span>{entry.lookingForText ? ` ${entry.lookingForText}` : ""}</p> : null}

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {reactions.map(({ key, Icon, label }) => (
            <button key={key} disabled={pending === key} onClick={() => react(key)} className={`flex h-9 items-center justify-center gap-1.5 rounded-[6px] border text-[12px] transition-colors ${active.has(key) ? "border-[var(--bc-accent-strong)] bg-[var(--bc-accent-soft)] text-[var(--bc-ink)]" : "border-[var(--bc-line)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)]"}`} title={label}><Icon className="h-3.5 w-3.5" /><span className="font-semibold">{counts[key]}</span></button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[12px] text-[var(--bc-faint)]">
          <span>{entry.feedbackCount} {copy(entry.feedbackCount === 1 ? "feedback" : "feedback items", entry.feedbackCount === 1 ? "feedback" : "feedback items")}{entry.wouldUsePercent !== null ? ` · ${entry.wouldUsePercent}% ${copy("feedbacków\", entry.feedbackCount === 1 ? \"feedback\" : \"feedback items\")}{entry.wouldUsePercent !== null ? ` · ${entry.wouldUsePercent}% ${copy(\"zainteresowanych", "would use")}` : ""}</span>
          <div className="flex gap-2">{entry.githubUrl ? <a href={entry.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub"><ExternalLink className="h-3.5 w-3.5" /></a> : null}{entry.liveUrl ? <a href={entry.liveUrl} target="_blank" rel="noreferrer" aria-label={copy("Otwórz projekt", "Open project")}><ExternalLink className="h-3.5 w-3.5" /></a> : null}</div>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-3 w-full"><Link href={`/showcase/${entry.id}`}>{copy("Zobacz projekt", "View project")}</Link></Button>
      </div>
    </Card>
  );
}
