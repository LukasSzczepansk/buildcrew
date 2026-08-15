"use client";

import * as React from "react";
import { CheckCircle2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { completeProject, setProjectLifecycleStatus } from "@/server/actions/social-projects";

export function ProjectLifecycleControls({ projectId, status }: { projectId: string; status: "ACTIVE" | "PAUSED" | "COMPLETED" }) {
  const [outcome, setOutcome] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function changeStatus(next: "ACTIVE" | "PAUSED") {
    startTransition(async () => {
      const result = await setProjectLifecycleStatus(projectId, next);
      if (result?.error) { toast.error(result.error); return; }
      toast.success(next === "PAUSED" ? "Projekt został wstrzymany." : "Projekt jest ponownie aktywny.");
    });
  }

  function finish() {
    startTransition(async () => {
      const result = await completeProject({ projectId, outcome });
      if (result?.error) { toast.error(result.error); return; }
      setOpen(false);
      toast.success("Projekt ukończony. Credits zespołu zostały zapisane.");
    });
  }

  if (status === "COMPLETED") {
    return <div className="border-y border-[var(--bc-line)] py-4"><p className="inline-flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-4 w-4" />Projekt ukończony</p><p className="mt-1 text-[12px] leading-4 text-[var(--bc-muted)]">Historia zespołu i credits są zachowane na profilach współtwórców.</p></div>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-[var(--bc-line)] py-4">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => changeStatus(status === "PAUSED" ? "ACTIVE" : "PAUSED")} className="gap-1.5">
        {status === "PAUSED" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        {status === "PAUSED" ? "Wznów projekt" : "Wstrzymaj projekt"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button type="button" size="sm" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Oznacz jako ukończony</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zamknij projekt i zapisz credits zespołu</DialogTitle>
            <DialogDescription>BuildCrew zapisze aktualny skład zespołu, role i rezultat jako historię współpracy. Tego statusu nie traktuj jak zwykłego checkboxa.</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-[13px] font-medium">Jaki jest rezultat?</label>
            <Textarea className="mt-1.5 min-h-[120px]" value={outcome} onChange={(event) => setOutcome(event.target.value)} maxLength={800} placeholder="Np. działające MVP z porównaniem koszyka dla 3 sieci, publiczne demo i repozytorium." />
            <p className="mt-1 text-[11px] text-[var(--bc-faint)]">Minimum 20 znaków. Ten opis będzie widoczny przy historii ukończonego projektu.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Anuluj</Button>
            <Button type="button" onClick={finish} disabled={pending || outcome.trim().length < 20}>{pending ? "Zapisywanie…" : "Ukończ projekt"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
