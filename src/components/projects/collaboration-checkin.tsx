"use client";

import * as React from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
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
  const copy = useCopy();
  const locale = useLocale();
  const [pending, startTransition] = React.useTransition();

  const joinedTime = joinedAt ? new Date(joinedAt).getTime() : 0;
  const checkAt = joinedTime ? joinedTime + 7 * 24 * 60 * 60 * 1000 : 0;
  const daysUntilCheck = checkAt > Date.now() ? Math.max(1, Math.ceil((checkAt - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

  function respond(answer: "STARTED" | "NOT_STARTED" | "ENDED") {
    startTransition(async () => {
      const result = await respondToCollaborationCheck(projectId, memberId, answer);
      if (result && "error" in result && result.error) {
        toast.error(appMessage(result.error, locale));
        return;
      }
      toast.success(answer === "STARTED" ? copy("Status współpracy zaktualizowany.", "Collaboration status updated.") : answer === "ENDED" ? copy("Współpraca oznaczona jako zakończona.", "Collaboration marked as ended.") : copy("Oznaczono, że współpraca się nie rozpoczęła.", "Marked as not started."));
    });
  }

  if (status === "CONFIRMED") {
    return (
      <div className={`flex items-center gap-2 ${compact ? "text-[12px]" : "rounded-[7px] border border-lime-300 bg-lime-50/70 px-3.5 py-3 text-[13px] dark:border-lime-700 dark:bg-lime-500/5"}`}>
        <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-600" />
        <span><strong className="font-semibold">{copy("Potwierdzona współpraca.", "Confirmed collaboration.")}</strong>{compact ? "" : copy(" Obie strony potwierdziły, że współpraca faktycznie się rozpoczęła.", " Both sides confirmed that work actually started.")}</span>
        {!compact ? <Button type="button" variant="ghost" size="sm" className="ml-auto" disabled={pending} onClick={() => respond("ENDED")}>{copy("Zakończ współpracę", "End collaboration")}</Button> : null}
      </div>
    );
  }

  if (status === "NOT_STARTED") return <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--bc-faint)]"><span className="inline-flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" />{copy("Współpraca się nie rozpoczęła.", "Collaboration did not start.")}</span><Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => respond("STARTED")}>{copy("Zaczęła się później", "It started later")}</Button></div>;
  if (status === "ENDED") return <p className="inline-flex items-center gap-1.5 text-[12px] text-[var(--bc-faint)]"><CheckCircle2 className="h-3.5 w-3.5" />{copy("Zakończona współpraca.", "Past collaboration.")}</p>;

  const meConfirmed = viewerRole === "OWNER" ? ownerConfirmed : memberConfirmed;
  const otherConfirmed = viewerRole === "OWNER" ? memberConfirmed : ownerConfirmed;

  if (!meConfirmed && !otherConfirmed && daysUntilCheck > 0) {
    return <p className="inline-flex items-center gap-1.5 text-[12px] text-[var(--bc-faint)]"><Clock3 className="h-3.5 w-3.5" />{copy(`Potwierdzenie współpracy będzie dostępne za ${daysUntilCheck} ${daysUntilCheck === 1 ? "dzień" : "dni"}.`, `Collaboration check-in opens in ${daysUntilCheck} ${daysUntilCheck === 1 ? "day" : "days"}.`)}</p>;
  }

  if (meConfirmed) {
    return <p className="inline-flex items-center gap-1.5 text-[12px] text-[var(--bc-muted)]"><Clock3 className="h-3.5 w-3.5" />{copy("Potwierdziłeś współpracę. Czekamy na drugą stronę.", "You confirmed it. Waiting for the other side.")}</p>;
  }

  return (
    <div className={compact ? "space-y-2" : "rounded-[7px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] p-3.5"}>
      <p className={`${compact ? "text-[12px]" : "text-[13px]"} font-semibold text-[var(--bc-ink)]`}>{otherConfirmed ? copy("Druga strona potwierdziła, że zaczęliście współpracować. Potwierdzasz?", "The other side says you started working together. Confirm?") : copy("Czy faktycznie zaczęliście razem pracować?", "Did you actually start working together?")}</p>
      {!compact ? <p className="mt-1 text-[12px] leading-5 text-[var(--bc-muted)]">{copy("Potwierdzona współpraca wzmacnia oba profile i odblokowuje rekomendacje oparte na realnej pracy.", "A confirmed collaboration strengthens both profiles and unlocks collaboration endorsements based on real work.")}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={() => respond("STARTED")}>{copy("Tak, zaczęliśmy", "Yes, we started")}</Button>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => respond("NOT_STARTED")}>{copy("Nie, współpraca nie ruszyła", "No, it did not start")}</Button>
      </div>
    </div>
  );
}
