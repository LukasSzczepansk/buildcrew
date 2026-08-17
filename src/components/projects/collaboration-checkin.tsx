"use client";

import * as React from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { respondToCollaborationCheck } from "@/server/actions/projects";
import type { ProjectMemberCollaborationStatus } from "@/db/schema";

export function CollaborationCheckin({
  projectId,
  memberId,
  status,
  memberConfirmed,
  ownerConfirmed,
  viewerRole,
  compact = false,
  joinedAt,
}: {
  projectId: string;
  memberId: string;
  status: ProjectMemberCollaborationStatus;
  memberConfirmed: boolean;
  ownerConfirmed: boolean;
  viewerRole: "OWNER" | "MEMBER";
  compact?: boolean;
  joinedAt?: Date | string | null;
}) {
  const [pending, startTransition] = React.useTransition();

  const joinedTime = joinedAt ? new Date(joinedAt).getTime() : 0;
  const checkAt = joinedTime ? joinedTime + 7 * 24 * 60 * 60 * 1000 : 0;
  const daysUntilCheck = checkAt > Date.now() ? Math.max(1, Math.ceil((checkAt - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

  function respond(answer: "STARTED" | "NOT_STARTED" | "ENDED") {
    startTransition(async () => {
      const result = await respondToCollaborationCheck(projectId, memberId, answer);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(answer === "STARTED" ? "Collaboration status updated." : answer === "ENDED" ? "Collaboration marked as ended." : "Marked as not started.");
    });
  }

  if (status === "CONFIRMED") {
    return (
      <div className={`flex items-center gap-2 ${compact ? "text-[12px]" : "rounded-[7px] border border-lime-300 bg-lime-50/70 px-3.5 py-3 text-[13px] dark:border-lime-700 dark:bg-lime-500/5"}`}>
        <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-600" />
        <span><strong className="font-semibold">Confirmed collaboration.</strong>{compact ? "" : " Both sides confirmed that work actually started."}</span>
        {!compact ? <Button type="button" variant="ghost" size="sm" className="ml-auto" disabled={pending} onClick={() => respond("ENDED")}>End collaboration</Button> : null}
      </div>
    );
  }

  if (status === "NOT_STARTED") return <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--bc-faint)]"><span className="inline-flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" />Collaboration did not start.</span><Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => respond("STARTED")}>It started later</Button></div>;
  if (status === "ENDED") return <p className="inline-flex items-center gap-1.5 text-[12px] text-[var(--bc-faint)]"><CheckCircle2 className="h-3.5 w-3.5" />Past collaboration.</p>;

  const meConfirmed = viewerRole === "OWNER" ? ownerConfirmed : memberConfirmed;
  const otherConfirmed = viewerRole === "OWNER" ? memberConfirmed : ownerConfirmed;

  if (!meConfirmed && !otherConfirmed && daysUntilCheck > 0) {
    return <p className="inline-flex items-center gap-1.5 text-[12px] text-[var(--bc-faint)]"><Clock3 className="h-3.5 w-3.5" />Collaboration check-in opens in {daysUntilCheck} {daysUntilCheck === 1 ? "day" : "days"}.</p>;
  }

  if (meConfirmed) {
    return <p className="inline-flex items-center gap-1.5 text-[12px] text-[var(--bc-muted)]"><Clock3 className="h-3.5 w-3.5" />You confirmed it. Waiting for the other side.</p>;
  }

  return (
    <div className={compact ? "space-y-2" : "rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-3.5"}>
      <p className={`${compact ? "text-[12px]" : "text-[13px]"} font-semibold text-[var(--bc-ink)]`}>{otherConfirmed ? "The other side says you started working together. Confirm?" : "Did you actually start working together?"}</p>
      {!compact ? <p className="mt-1 text-[12px] leading-5 text-[var(--bc-muted)]">A confirmed collaboration strengthens both profiles and unlocks collaboration endorsements based on real work.</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={() => respond("STARTED")}>Yes, we started</Button>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => respond("NOT_STARTED")}>No, it did not start</Button>
      </div>
    </div>
  );
}
