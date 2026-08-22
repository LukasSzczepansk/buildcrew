"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleLaunchVote } from "@/server/actions/launches";

export function LaunchVoteButton({ entryId, count, voted, canVote, returnTo, compact = false }: { entryId: string; count: number; voted: boolean; canVote: boolean; returnTo: string; compact?: boolean }) {
  const [state, setState] = React.useState({ voted, count });
  const [pending, startTransition] = React.useTransition();
  const className = cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 border font-semibold tabular-nums transition-colors",
    compact ? "h-10 min-w-[64px] rounded-[8px] px-2.5 text-[12px]" : "h-11 min-w-[92px] rounded-[8px] px-3 text-[13px]",
    state.voted ? "border-[var(--bc-accent-strong)] bg-[color-mix(in_srgb,var(--bc-accent)_18%,var(--bc-surface))] text-[var(--bc-ink)]" : "border-[var(--bc-line)] bg-[var(--bc-surface)] text-[var(--bc-muted)] hover:border-[var(--bc-line-strong)] hover:text-[var(--bc-ink)]",
  );

  if (!canVote) return <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className={className}><ArrowUp className="h-3.5 w-3.5" /> {count}</Link>;
  return (
    <button type="button" disabled={pending} className={className} aria-pressed={state.voted} onClick={() => {
      const previous = state;
      setState((current) => ({ voted: !current.voted, count: current.count + (current.voted ? -1 : 1) }));
      startTransition(async () => {
        const result = await toggleLaunchVote(entryId);
        if (result.error) { setState(previous); toast.error(result.error); return; }
        setState((current) => ({ ...current, voted: result.voted ?? current.voted }));
      });
    }}><ArrowUp className="h-3.5 w-3.5" /> {state.count}</button>
  );
}
