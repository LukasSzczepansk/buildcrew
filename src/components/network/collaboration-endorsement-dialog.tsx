"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { endorseCollaborator } from "@/server/actions/network";
import type { CollaborationEndorsementStrength } from "@/db/schema";

const OPTIONS: { key: CollaborationEndorsementStrength; pl: string; en: string }[] = [
  { key: "DELIVERY", pl: "Delivery", en: "Delivery" },
  { key: "COMMUNICATION", pl: "Komunikacja", en: "Communication" },
  { key: "TECHNICAL", pl: "Technical skills", en: "Technical skills" },
  { key: "PRODUCT", pl: "Product thinking", en: "Product thinking" },
  { key: "DESIGN", pl: "Design", en: "Design" },
  { key: "RELIABILITY", pl: "Reliability", en: "Reliability" },
];

export function CollaborationEndorsementDialog({ targetUserId, targetUsername, projects, defaultProjectId }: { targetUserId: string; targetUsername: string; projects: { id: string; name: string }[]; defaultProjectId?: string }) {
  const copy = useCopy();
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const [projectId, setProjectId] = React.useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [strengths, setStrengths] = React.useState<CollaborationEndorsementStrength[]>([]);
  const [wouldAgain, setWouldAgain] = React.useState(true);
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function toggleStrength(key: CollaborationEndorsementStrength) { setStrengths((current) => current.includes(key) ? current.filter((item) => item !== key) : current.length >= 3 ? current : [...current, key]); }
  async function submit() {
    if (!projectId) return toast.error(copy("Wybierz wspólny projekt.", "Choose a project you worked on together."));
    if (!strengths.length) return toast.error(copy("Wybierz przynajmniej jedną rzecz.", "Choose at least one strength."));
    setPending(true);
    const result = await endorseCollaborator({ projectId, targetUserId, strengths, wouldCollaborateAgain: wouldAgain, note });
    setPending(false);
    if (result?.error) return toast.error(appMessage(result.error, locale));
    toast.success(copy("Rekomendacja współpracy zapisana.", "Collaboration recommendation saved."));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline">{copy("Poleć współpracę", "Recommend collaboration")}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{copy(`What was it like working with ${targetUsername}?`, `What was it like working with ${targetUsername}?`)}</DialogTitle><DialogDescription>{copy("To nie jest ranking ani ocena gwiazdkowa. Zaznacz tylko rzeczy, które wynikają z Waszej realnej współpracy.", "This is not a ranking or star rating. Choose only strengths you observed while actually working together.")}</DialogDescription></DialogHeader>
        <div className="space-y-5">
          <div><p className="mb-2 text-[13px] font-medium text-[var(--bc-ink)]">{copy("Wspólny projekt", "Shared project")}</p><select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-10 w-full rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm outline-none focus:border-[var(--bc-line-strong)]">{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
          <div><p className="mb-2 text-[13px] font-medium text-[var(--bc-ink)]">{copy("Za co możesz polecić tę osobę?", "What would you recommend this person for?")} <span className="font-normal text-[var(--bc-faint)]">{copy("maks. 3", "max. 3")}</span></p><div className="grid gap-2 sm:grid-cols-2">{OPTIONS.map((option) => <label key={option.key} className="flex cursor-pointer items-center gap-2 border-b border-[var(--bc-line)] py-2 text-sm last:border-b-0"><Checkbox checked={strengths.includes(option.key)} onCheckedChange={() => toggleStrength(option.key)} /><span>{copy(option.en, option.en)}</span></label>)}</div></div>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={wouldAgain} onCheckedChange={(value) => setWouldAgain(Boolean(value))} /><span>{copy("Chętnie pracowałbym / pracowałabym z tą osobą ponownie", "I would happily work with this person again")}</span></label>
          <div><p className="mb-1.5 text-[13px] font-medium text-[var(--bc-ink)]">{copy("Krótka notatka", "Short note")} <span className="font-normal text-[var(--bc-faint)]">{copy("opcjonalnie", "optional")}</span></p><Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder={copy("Jedno konkretne zdanie o współpracy.", "One concrete sentence about working together.")} /><p className="mt-1 text-right text-[11px] text-[var(--bc-faint)]">{note.length}/240</p></div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={pending || !projectId || !strengths.length}>{pending ? copy("Zapisywanie…", "Saving…") : copy("Zapisz rekomendację", "Save recommendation")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
