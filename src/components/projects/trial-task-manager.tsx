"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Check, ExternalLink, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { archiveTrialTask, createTrialTask, reviewTrialAttempt } from "@/server/actions/trial-tasks";
import { formatMinutes } from "@/components/projects/trial-task-panel";
import type { RoleType, TrialAttemptStatus } from "@/db/schema";

export type ManagerRole = {
  id: string;
  roleType: RoleType;
  task: { id: string; title: string; brief: string; timeLimitMinutes: number } | null;
};

export type ManagerAttempt = {
  id: string;
  trialTaskId: string;
  roleId: string;
  userId: string;
  username: string;
  status: TrialAttemptStatus;
  startedAt: string;
  dueAt: string;
  submittedAt: string | null;
  submissionUrl: string | null;
  submissionNote: string | null;
  addToPortfolio: boolean;
  reviewNote: string | null;
};

const TIME_OPTIONS = [30, 60, 90, 120, 180, 240, 480];

/** Owner screen: attach a trial task to each role and review what candidates hand in. */
export function TrialTaskManager({ projectId, roles, attempts }: { projectId: string; roles: ManagerRole[]; attempts: ManagerAttempt[] }) {
  const copy = useCopy();
  const locale = useLocale();
  const labels = labelsFor(locale);

  return (
    <section id="trial-tasks" className="scroll-mt-20">
      <div className="mb-4">
        <h2 className="text-[17px] font-semibold text-[var(--bc-ink)]">{copy("Mini-próby", "Trial tasks")}</h2>
        <p className="mt-1 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">
          {copy(
            "Dodaj do roli krótkie zadanie na 30 minut - 8 godzin. Kandydat wykona je przed dołączeniem, a Ty zobaczysz realny wynik zamiast samego CV.",
            "Attach a short task (30 minutes to 8 hours) to a role. Candidates do it before joining, so you see real work instead of just a CV.",
          )}
        </p>
      </div>
      <div className="space-y-4">
        {roles.map((role) => (
          <RoleTrial key={role.id} projectId={projectId} role={role} roleLabel={labels.roles[role.roleType]} attempts={attempts.filter((item) => item.roleId === role.id)} />
        ))}
      </div>
    </section>
  );
}

function RoleTrial({ projectId, role, roleLabel, attempts }: { projectId: string; role: ManagerRole; roleLabel: string; attempts: ManagerAttempt[] }) {
  const copy = useCopy();
  const locale = useLocale();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [brief, setBrief] = React.useState("");
  const [minutes, setMinutes] = React.useState("120");

  function create(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createTrialTask(projectId, { roleId: role.id, title, brief, timeLimitMinutes: Number(minutes) });
      if (result.error) { toast.error(appMessage(result.error, locale)); return; }
      toast.success(copy("Mini-próba dodana.", "Trial task added."));
      setOpen(false); setTitle(""); setBrief("");
      router.refresh();
    });
  }

  async function archive() {
    if (!role.task) return;
    if (!(await confirm({ message: copy("Zarchiwizować tę mini-próbę? Nowi kandydaci jej nie zobaczą, a dotychczasowe wyniki zostaną.", "Archive this trial task? New candidates will not see it; existing results stay."), destructive: true }))) return;
    const taskId = role.task.id;
    startTransition(async () => {
      const result = await archiveTrialTask(taskId);
      if (result.error) { toast.error(appMessage(result.error, locale)); return; }
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4 shadow-[var(--bc-shadow-xs)] sm:p-5">
      {dialog}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-[var(--bc-ink)]">{roleLabel}</p>
        {role.task ? (
          <Button type="button" variant="ghost" size="sm" onClick={archive} disabled={pending} className="gap-1.5"><Archive className="h-3.5 w-3.5" />{copy("Archiwizuj", "Archive")}</Button>
        ) : !open ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />{copy("Dodaj mini-próbę", "Add trial task")}</Button>
        ) : null}
      </div>

      {role.task ? (
        <div className="mt-3 rounded-[var(--bc-radius)] bg-[var(--bc-surface-subtle)] p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-[var(--bc-ink)]">{role.task.title}</p>
            <Badge variant="secondary">{formatMinutes(role.task.timeLimitMinutes, copy)}</Badge>
          </div>
          <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5 text-[var(--bc-muted)]">{role.task.brief}</p>
        </div>
      ) : open ? (
        <form onSubmit={create} className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`trial-title-${role.id}`}>{copy("Tytuł zadania", "Task title")}</Label>
            <Input id={`trial-title-${role.id}`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={90} placeholder={copy("np. Zaprojektuj ekran logowania", "e.g. Design the login screen")} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`trial-brief-${role.id}`}>{copy("Opis i kryteria", "Brief and criteria")}</Label>
            <Textarea id={`trial-brief-${role.id}`} rows={4} value={brief} onChange={(event) => setBrief(event.target.value)} maxLength={1500} placeholder={copy("Co dokładnie ma powstać? Po czym ocenisz wynik?", "What exactly should be made? How will you judge it?")} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`trial-time-${role.id}`}>{copy("Limit czasu", "Time limit")}</Label>
            <Select value={minutes} onValueChange={setMinutes}>
              <SelectTrigger id={`trial-time-${role.id}`} className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{TIME_OPTIONS.map((value) => <SelectItem key={value} value={String(value)}>{formatMinutes(value, copy)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? copy("Zapisywanie…", "Saving…") : copy("Zapisz mini-próbę", "Save trial task")}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>{copy("Anuluj", "Cancel")}</Button>
          </div>
        </form>
      ) : (
        <p className="mt-2 text-[13px] text-[var(--bc-faint)]">{copy("Ta rola nie ma jeszcze mini-próby.", "This role has no trial task yet.")}</p>
      )}

      {attempts.length ? (
        <ul className="mt-4 divide-y divide-[var(--bc-line)] border-t border-[var(--bc-line)]">
          {attempts.map((attempt) => <AttemptRow key={attempt.id} attempt={attempt} />)}
        </ul>
      ) : null}
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: ManagerAttempt }) {
  const copy = useCopy();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [note, setNote] = React.useState("");

  function review(decision: "PASSED" | "FAILED") {
    startTransition(async () => {
      const result = await reviewTrialAttempt(attempt.id, decision, note);
      if (result.error) { toast.error(appMessage(result.error, locale)); return; }
      toast.success(decision === "PASSED" ? copy("Zaliczone. Kandydat dostał powiadomienie.", "Passed. The candidate has been notified.") : copy("Oceniono.", "Reviewed."));
      router.refresh();
    });
  }

  const statusBadge = attempt.status === "PASSED"
    ? <Badge variant="success">{copy("Zaliczona", "Passed")}</Badge>
    : attempt.status === "FAILED" ? <Badge variant="outline">{copy("Niezaliczona", "Not passed")}</Badge>
    : attempt.status === "SUBMITTED" ? <Badge variant="warning">{copy("Do oceny", "Needs review")}</Badge>
    : <Badge variant="secondary">{copy("W trakcie", "In progress")}</Badge>;

  const minutesTaken = attempt.submittedAt ? Math.max(1, Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60_000)) : null;
  const late = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() > new Date(attempt.dueAt).getTime() : false;

  return (
    <li className="py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <a href={`/builders/${attempt.userId}`} className="text-[14px] font-semibold hover:underline">{attempt.username}</a>
        {statusBadge}
        {minutesTaken ? <span className="text-[12px] text-[var(--bc-faint)]">{copy(`czas: ${minutesTaken} min`, `took ${minutesTaken} min`)}{late ? ` · ${copy("po czasie", "over time")}` : ""}</span> : null}
      </div>
      {attempt.submissionNote ? <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5 text-[var(--bc-muted)]">{attempt.submissionNote}</p> : null}
      {attempt.submissionUrl ? (
        <a href={attempt.submissionUrl} target="_blank" rel="noopener noreferrer nofollow ugc" className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium underline underline-offset-2">
          {copy("Zobacz wynik", "View the result")} <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      ) : null}
      {attempt.status === "SUBMITTED" ? (
        <div className="mt-3 space-y-2">
          <Textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder={copy("Krótka opinia dla kandydata (opcjonalnie)", "Short feedback for the candidate (optional)")} className="min-h-[64px]" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => review("PASSED")} disabled={pending} className="gap-1.5"><Check className="h-3.5 w-3.5" />{copy("Zalicz", "Pass")}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => review("FAILED")} disabled={pending} className="gap-1.5"><X className="h-3.5 w-3.5" />{copy("Nie zaliczaj", "Do not pass")}</Button>
          </div>
          {attempt.addToPortfolio ? <p className="text-[12px] text-[var(--bc-faint)]">{copy("Po zaliczeniu wynik trafi do portfolio kandydata (zgodził się).", "If passed, the result is added to the candidate's portfolio (they opted in).")}</p> : null}
        </div>
      ) : attempt.reviewNote ? (
        <p className="mt-1.5 text-[12px] text-[var(--bc-faint)]">{copy("Twoja opinia", "Your feedback")}: {attempt.reviewNote}</p>
      ) : null}
    </li>
  );
}
