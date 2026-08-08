"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SHOWCASE_CATEGORY_LABELS, SHOWCASE_STATUS_LABELS } from "@/lib/constants";
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
};

const reactions: { key: ShowcaseReaction; emoji: string; label: string }[] = [
  { key: "APPLAUSE", emoji: "👏", label: "Dobra robota" },
  { key: "IDEA", emoji: "💡", label: "Ciekawy pomysł" },
  { key: "POTENTIAL", emoji: "🚀", label: "Ma potencjał" },
];

export function ShowcaseCard({ entry, currentUserId }: { entry: ShowcaseCardData; currentUserId?: string }) {
  const [counts, setCounts] = React.useState(entry.reactionCounts);
  const [active, setActive] = React.useState(new Set(entry.viewerReactions));
  const [pending, setPending] = React.useState<ShowcaseReaction | null>(null);

  async function react(reaction: ShowcaseReaction) {
    if (!currentUserId) { toast.error("Zaloguj się, żeby zareagować."); return; }
    if (currentUserId === entry.creatorId) { toast.error("Nie możesz oceniać własnego projektu."); return; }
    setPending(reaction);
    const result = await toggleShowcaseReaction(entry.id, reaction);
    setPending(null);
    if (result?.error) { toast.error(result.error); return; }
    setActive((previous) => {
      const next = new Set(previous);
      if (result?.active) next.add(reaction); else next.delete(reaction);
      return next;
    });
    setCounts((previous) => ({ ...previous, [reaction]: Math.max(0, previous[reaction] + (result?.active ? 1 : -1)) }));
  }

  return (
    <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      {entry.screenshotUrl ? (
        <Link href={`/showcase/${entry.id}`} className="block aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={entry.screenshotUrl} alt={`Podgląd ${entry.title}`} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
        </Link>
      ) : (
        <Link href={`/showcase/${entry.id}`} className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-violet-100 via-white to-indigo-100 text-5xl dark:from-violet-950/40 dark:via-neutral-900 dark:to-indigo-950/40">🚀</Link>
      )}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{SHOWCASE_CATEGORY_LABELS[entry.category]}</Badge>
          <Badge variant="secondary">{SHOWCASE_STATUS_LABELS[entry.status]}</Badge>
          {entry.crewId ? <Badge variant="outline">🟣 Ekipa z BuildCrew</Badge> : null}
          {entry.challengeId ? <Badge variant="warning">🏁 Challenge</Badge> : null}
        </div>
        <Link href={`/showcase/${entry.id}`}><h3 className="mt-3 text-lg font-semibold tracking-tight hover:text-violet-600">{entry.title}</h3></Link>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{entry.tagline}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex -space-x-2">
            {entry.team.slice(0, 4).map((member) => <div key={member.userId} title={member.username} className="rounded-full ring-2 ring-white dark:ring-neutral-900"><Avatar emoji={member.avatarEmoji} size="sm" /></div>)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400"><Users className="h-3.5 w-3.5" /> {Math.max(1, entry.team.length)} twórców</div>
        </div>

        {entry.lookingForCollaborators ? (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/5 dark:text-violet-300">
            <span className="font-semibold">Szukają kolejnych współtwórców.</span>{entry.lookingForText ? ` ${entry.lookingForText}` : ""}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {reactions.map((reaction) => (
            <button key={reaction.key} disabled={pending === reaction.key} onClick={() => react(reaction.key)} className={`rounded-xl border px-2 py-2 text-center text-xs transition-colors ${active.has(reaction.key) ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300" : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"}`} title={reaction.label}>
              <span className="block text-base">{reaction.emoji}</span><span className="font-semibold">{counts[reaction.key]}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
          <span>{entry.feedbackCount} feedbacków{entry.wouldUsePercent !== null ? ` · ${entry.wouldUsePercent}% zainteresowanych` : ""}</span>
          <div className="flex gap-2">
            {entry.githubUrl ? <a href={entry.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub"><ExternalLink className="h-4 w-4" /></a> : null}
            {entry.liveUrl ? <a href={entry.liveUrl} target="_blank" rel="noreferrer" aria-label="Otwórz projekt"><ExternalLink className="h-4 w-4" /></a> : null}
          </div>
        </div>
        <Button asChild variant="outline" className="mt-4 w-full"><Link href={`/showcase/${entry.id}`}>Zobacz projekt</Link></Button>
      </div>
    </Card>
  );
}
