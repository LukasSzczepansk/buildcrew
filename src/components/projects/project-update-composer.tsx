"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publishProjectUpdate } from "@/server/actions/social-projects";
import type { ProjectUpdateKind } from "@/db/schema";

const LABELS: Record<ProjectUpdateKind, string> = {
  PROGRESS: "Postęp",
  ROLE: "Zespół / rekrutacja",
  MILESTONE: "Milestone",
  LAUNCH: "Premiera / demo",
};

export function ProjectUpdateComposer({ projectId }: { projectId: string }) {
  const [kind, setKind] = React.useState<ProjectUpdateKind>("PROGRESS");
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function submit() {
    startTransition(async () => {
      const result = await publishProjectUpdate({ projectId, kind, body });
      if (result?.error) { toast.error(result.error); return; }
      setBody("");
      setKind("PROGRESS");
      toast.success("Aktualizacja opublikowana.");
    });
  }

  return (
    <div className="border-y border-[var(--bc-line)] py-4">
      <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
        <Select value={kind} onValueChange={(value) => setKind(value as ProjectUpdateKind)}>
          <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={600} placeholder="Co realnie zmieniło się w projekcie? Np. działa import z pierwszej sieci i otwieramy rolę UI/UX." className="min-h-[88px] resize-y" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-4 text-[var(--bc-faint)]">Aktualizację zobaczą obserwujący projekt. Krótko, konkretnie, bez marketingowego posta.</p>
        <Button type="button" size="sm" onClick={submit} disabled={pending || body.trim().length < 10}>{pending ? "Publikowanie…" : "Opublikuj"}</Button>
      </div>
    </div>
  );
}
