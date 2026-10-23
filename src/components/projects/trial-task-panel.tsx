"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Hourglass, Timer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCopy } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { useLocale } from "@/components/i18n/locale-provider";
import { startTrialAttempt, submitTrialAttempt } from "@/server/actions/trial-tasks";
import type { TrialAttemptStatus } from "@/db/schema";

export type TrialPanelTask = { id: string; title: string; timeLimitMinutes: number; brief?: string };
export type TrialPanelAttempt = {
  id: string;
  status: TrialAttemptStatus;
  dueAt: string;
  submittedAt: string | null;
  reviewNote: string | null;
};

const nowMs = () => Date.now();

export function formatMinutes(minutes: number, copy: <T,>(pl: T, en: T) => T) {
  if (minutes % 60 === 0) return `${minutes / 60} ${copy("godz.", "h")}`;
  if (minutes > 60) return `${Math.floor(minutes / 60)} ${copy("godz.", "h")} ${minutes % 60} min`;
  return `${minutes} min`;
}

function useCountdown(dueAt: string, active: boolean) {
  const [now, setNow] = React.useState(() => nowMs());
  React.useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(nowMs()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return new Date(dueAt).getTime() - now;
}

function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Candidate-facing trial task card shown inside a role row on the project page. */
export function TrialTaskPanel({ task, attempt }: { task: TrialPanelTask; attempt: TrialPanelAttempt | null }) {
  const copy = useCopy();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [url, setUrl] = React.useState("");
  const [note, setNote] = React.useState("");
  const [portfolio, setPortfolio] = React.useState(true);
  const remaining = useCountdown(attempt?.dueAt ?? new Date(0).toISOString(), attempt?.status === "STARTED");
  const limit = formatMinutes(task.timeLimitMinutes, copy);

  function start() {
    startTransition(async () => {
      const result = await startTrialAttempt(task.id);
      if (result.error) { toast.error(appMessage(result.error, locale)); return; }
      toast.success(copy("Czas start! Powodzenia.", "The clock is running. Good luck!"));
      router.refresh();
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!attempt) return;
    startTransition(async () => {
      const result = await submitTrialAttempt(attempt.id, { url, note, addToPortfolio: portfolio });
      if (result.error) { toast.error(appMessage(result.error, locale)); return; }
      toast.success(copy("Wynik oddany. Właściciel dostał powiadomienie.", "Submitted. The owner has been notified."));
      router.refresh();
    });
  }

  const shell = "mt-3 rounded-[var(--bc-radius)] border border-dashed border-[var(--bc-accent-strong)]/60 bg-[var(--bc-accent-soft)] p-3.5";
  const header = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-accent-ink)]">
      <Timer className="h-3.5 w-3.5" aria-hidden="true" />
      {copy("Mini-próba", "Trial task")}
      <span className="font-medium normal-case tracking-normal text-[var(--bc-muted)]">· {limit}</span>
    </div>
  );

  if (!attempt) {
    return (
      <div className={shell}>
        {header}
        <p className="mt-1.5 text-[14px] font-medium text-[var(--bc-ink)]">{task.title}</p>
        <p className="mt-1 text-[13px] text-[var(--bc-muted)]">
          {copy("Pokaż, co potrafisz, zanim dołączysz. Opis zadania zobaczysz po rozpoczęciu, a czas zacznie wtedy płynąć.", "Show what you can do before joining. You will see the brief once you start, and the clock starts then.")}
        </p>
        <Button type="button" size="sm" className="mt-3" onClick={start} disabled={pending}>
          {pending ? copy("Rozpoczynanie…", "Starting…") : copy("Rozpocznij próbę", "Start the trial")}
        </Button>
      </div>
    );
  }

  if (attempt.status === "STARTED") {
    const late = remaining <= 0;
    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          {header}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums ${late ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200" : "bg-[#1c1b17] text-[#c8f169]"}`} role="timer" aria-live="off">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {late ? copy("Po czasie", "Over time") : clock(remaining)}
          </span>
        </div>
        <p className="mt-2 text-[14px] font-semibold text-[var(--bc-ink)]">{task.title}</p>
        {task.brief ? <p className="mt-1 whitespace-pre-line text-[13px] leading-5 text-[var(--bc-muted)]">{task.brief}</p> : null}
        <form onSubmit={submit} className="mt-3 space-y-3 border-t border-[var(--bc-line)] pt-3">
          <div className="space-y-1.5">
            <Label htmlFor={`trial-url-${attempt.id}`}>{copy("Link do wyniku (opcjonalnie)", "Link to your result (optional)")}</Label>
            <Input id={`trial-url-${attempt.id}`} type="url" inputMode="url" placeholder="https://" value={url} onChange={(event) => setUrl(event.target.value)} maxLength={500} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`trial-note-${attempt.id}`}>{copy("Krótki opis", "Short description")}</Label>
            <Textarea id={`trial-note-${attempt.id}`} rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1500} placeholder={copy("Co zrobiłeś(-aś) i co byś poprawił(a) mając więcej czasu?", "What did you do, and what would you improve with more time?")} />
          </div>
          <label className="flex items-start gap-2 text-[13px] text-[var(--bc-muted)]">
            <input type="checkbox" checked={portfolio} onChange={(event) => setPortfolio(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#a8cf3d]" />
            {copy("Dodaj wynik do mojego portfolio, jeśli próba zostanie zaliczona.", "Add the result to my portfolio if the trial is passed.")}
          </label>
          <Button type="submit" size="sm" disabled={pending || (!url.trim() && !note.trim())}>
            {pending ? copy("Wysyłanie…", "Submitting…") : copy("Oddaj wynik", "Submit result")}
          </Button>
        </form>
      </div>
    );
  }

  if (attempt.status === "SUBMITTED") {
    return (
      <div className={shell}>
        {header}
        <p className="mt-1.5 flex items-center gap-2 text-[14px] font-medium text-[var(--bc-ink)]"><Hourglass className="h-4 w-4 text-[var(--bc-accent-ink)]" aria-hidden="true" />{copy("Oddane. Czeka na ocenę właściciela.", "Submitted. Waiting for the owner's review.")}</p>
      </div>
    );
  }

  const passed = attempt.status === "PASSED";
  return (
    <div className={shell}>
      {header}
      <p className="mt-1.5 flex items-center gap-2 text-[14px] font-semibold text-[var(--bc-ink)]">
        {passed ? <CheckCircle2 className="h-4 w-4 text-[var(--bc-accent-ink)]" aria-hidden="true" /> : <XCircle className="h-4 w-4 text-[var(--bc-muted)]" aria-hidden="true" />}
        {passed ? copy("Zaliczona. Możesz zgłosić się do tej roli.", "Passed. You can now apply for this role.") : copy("Oceniona. Dziękujemy za podjęcie próby.", "Reviewed. Thanks for taking the trial.")}
      </p>
      {attempt.reviewNote ? <p className="mt-1 text-[13px] text-[var(--bc-muted)]">&ldquo;{attempt.reviewNote}&rdquo;</p> : null}
    </div>
  );
}
