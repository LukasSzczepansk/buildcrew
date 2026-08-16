"use client";

import * as React from "react";
import { CheckCircle2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { completeProject, setProjectLifecycleStatus } from "@/server/actions/social-projects";

export function ProjectLifecycleControls({ projectId, status }: { projectId: string; status: "ACTIVE" | "PAUSED" | "COMPLETED" }) {
  const copy = useCopy();
  const locale = useLocale();
  const [outcome, setOutcome] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function changeStatus(next: "ACTIVE" | "PAUSED") {
    startTransition(async () => {
      const result = await setProjectLifecycleStatus(projectId, next);
      if (result?.error) { toast.error(appMessage(result.error, locale)); return; }
      toast.success(next === "PAUSED" ? copy("Projekt został wstrzymany.", "Project paused.") : copy("Projekt jest ponownie aktywny.", "Project is active again."));
    });
  }

  function finish() {
    startTransition(async () => {
      const result = await completeProject({ projectId, outcome });
      if (result?.error) { toast.error(appMessage(result.error, locale)); return; }
      setOpen(false);
      toast.success(copy("Projekt ukończony. Credits zespołu zostały zapisane.", "Project completed. Team credits have been saved."));
    });
  }

  if (status === "COMPLETED") return <div className="border-y border-[var(--bc-line)] py-4"><p className="inline-flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-4 w-4" />{copy("Projekt ukończony", "Project completed")}</p><p className="mt-1 text-[12px] leading-4 text-[var(--bc-muted)]">{copy("Historia zespołu i credits są zachowane na profilach współtwórców.", "The team's history and credits are preserved on collaborators' profiles.")}</p></div>;

  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-[var(--bc-line)] py-4">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => changeStatus(status === "PAUSED" ? "ACTIVE" : "PAUSED")} className="gap-1.5">{status === "PAUSED" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}{status === "PAUSED" ? copy("Wznów projekt", "Resume project") : copy("Wstrzymaj projekt", "Pause project")}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button type="button" size="sm" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />{copy("Oznacz jako ukończony", "Mark as completed")}</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{copy("Zamknij projekt i zapisz credits zespołu", "Complete the project and save team credits")}</DialogTitle><DialogDescription>{copy("BuildCrew zapisze aktualny skład zespołu, role i rezultat jako historię współpracy. Tego statusu nie traktuj jak zwykłego checkboxa.", "BuildCrew will save the current team, roles and outcome as collaboration history. Treat this as a meaningful project milestone, not just a checkbox.")}</DialogDescription></DialogHeader>
          <div><label className="text-[13px] font-medium">{copy("Jaki jest rezultat?", "What did you build?")}</label><Textarea className="mt-1.5 min-h-[120px]" value={outcome} onChange={(event) => setOutcome(event.target.value)} maxLength={800} placeholder={copy("Np. działające MVP z porównaniem koszyka dla 3 sieci, publiczne demo i repozytorium.", "For example: a working MVP, public demo and repository, with the main product outcome described clearly.")} /><p className="mt-1 text-[11px] text-[var(--bc-faint)]">{copy("Minimum 20 znaków. Ten opis będzie widoczny przy historii ukończonego projektu.", "Minimum 20 characters. This description will appear in the completed project history.")}</p></div>
          <DialogFooter><Button variant="outline" type="button" onClick={() => setOpen(false)}>{copy("Anuluj", "Cancel")}</Button><Button type="button" onClick={finish} disabled={pending || outcome.trim().length < 20}>{pending ? copy("Zapisywanie…", "Saving…") : copy("Ukończ projekt", "Complete project")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
