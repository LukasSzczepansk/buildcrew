import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { IdeaInterestButton } from "@/components/ideas/idea-interest-button";

export function IdeaCard({ idea, viewerId }: { idea: { id: string; ownerId: string; name: string; tagline: string; interests: string[]; interestedCount: number; viewerInterested: boolean; owner: { username: string; userId: string } | null }; viewerId: string }) {
  const owner = idea.ownerId === viewerId;
  return (
    <article className="grid gap-4 border-b border-[var(--bc-line)] py-5 first:border-t sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <Link href={`/ideas/${idea.id}`} className="min-w-0 group">
        <div className="flex items-start gap-3">
          <Avatar username={idea.owner?.username ?? "Builder"} seed={idea.owner?.userId ?? idea.ownerId} size="sm" />
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold tracking-[-0.015em] group-hover:underline">{idea.name}</h3>
            <p className="mt-1 max-w-[760px] text-[13px] leading-5 text-[var(--bc-muted)]">{idea.tagline}</p>
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[var(--bc-faint)]">
              <span>{idea.owner?.username ?? "Builder"}</span><span>·</span><span>{idea.interests.slice(0, 3).join(" · ")}</span><span>·</span><span>{idea.interestedCount} zainteresowanych</span>
            </div>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2 sm:justify-end">
        {owner ? <Link href={`/projects/new?fromIdea=${idea.id}`} className="text-[12px] font-medium hover:underline">Rozwiń w projekt →</Link> : <IdeaInterestButton ideaId={idea.id} initialInterested={idea.viewerInterested} compact />}
      </div>
    </article>
  );
}
