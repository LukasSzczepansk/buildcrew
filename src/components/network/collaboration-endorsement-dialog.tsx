"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { endorseCollaborator } from "@/server/actions/network";
import type { CollaborationEndorsementStrength } from "@/db/schema";

const OPTIONS: { key: CollaborationEndorsementStrength; label: string }[] = [
  { key: "DELIVERY", label: "Dowożenie" },
  { key: "COMMUNICATION", label: "Komunikacja" },
  { key: "TECHNICAL", label: "Umiejętności techniczne" },
  { key: "PRODUCT", label: "Myślenie produktowe" },
  { key: "DESIGN", label: "Design" },
  { key: "RELIABILITY", label: "Rzetelność" },
];

export function CollaborationEndorsementDialog({
  targetUserId,
  targetUsername,
  projects,
  defaultProjectId,
}: {
  targetUserId: string;
  targetUsername: string;
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [projectId, setProjectId] = React.useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [strengths, setStrengths] = React.useState<CollaborationEndorsementStrength[]>([]);
  const [wouldAgain, setWouldAgain] = React.useState(true);
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function toggleStrength(key: CollaborationEndorsementStrength) {
    setStrengths((current) => current.includes(key) ? current.filter((item) => item !== key) : current.length >= 3 ? current : [...current, key]);
  }

  async function submit() {
    if (!projectId) return toast.error("Wybierz wspólny projekt.");
    if (!strengths.length) return toast.error("Wybierz przynajmniej jedną rzecz.");
    setPending(true);
    const result = await endorseCollaborator({ projectId, targetUserId, strengths, wouldCollaborateAgain: wouldAgain, note });
    setPending(false);
    if (result?.error) return toast.error(result.error);
    toast.success("Rekomendacja współpracy zapisana.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline">Poleć współpracę</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Jak pracowało Ci się z {targetUsername}?</DialogTitle>
          <DialogDescription>To nie jest ranking ani ocena gwiazdkowa. Zaznacz tylko rzeczy, które wynikają z Waszej realnej współpracy.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[13px] font-medium text-[var(--bc-ink)]">Wspólny projekt</p>
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-10 w-full rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 text-sm outline-none focus:border-[var(--bc-line-strong)]">
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-[var(--bc-ink)]">Za co możesz polecić tę osobę? <span className="font-normal text-[var(--bc-faint)]">maks. 3</span></p>
            <div className="grid gap-2 sm:grid-cols-2">
              {OPTIONS.map((option) => (
                <label key={option.key} className="flex cursor-pointer items-center gap-2 border-b border-[var(--bc-line)] py-2 text-sm last:border-b-0">
                  <Checkbox checked={strengths.includes(option.key)} onCheckedChange={() => toggleStrength(option.key)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={wouldAgain} onCheckedChange={(value) => setWouldAgain(Boolean(value))} />
            <span>Chętnie pracowałbym / pracowałabym z tą osobą ponownie</span>
          </label>

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-[var(--bc-ink)]">Krótka notatka <span className="font-normal text-[var(--bc-faint)]">opcjonalnie</span></p>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder="Jedno konkretne zdanie o współpracy." />
            <p className="mt-1 text-right text-[11px] text-[var(--bc-faint)]">{note.length}/240</p>
          </div>
        </div>

        <DialogFooter><Button onClick={submit} disabled={pending || !projectId || !strengths.length}>{pending ? "Zapisywanie…" : "Zapisz rekomendację"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
