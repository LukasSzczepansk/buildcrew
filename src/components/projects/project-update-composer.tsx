"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publishProjectUpdate } from "@/server/actions/social-projects";
import type { ProjectUpdateKind } from "@/db/schema";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";

const LABELS_PL: Record<ProjectUpdateKind, string> = {
  PROGRESS: "Postęp",
  ROLE: "Zespół / rekrutacja",
  MILESTONE: "Milestone",
  LAUNCH: "Premiera / demo",
};

const LABELS_EN: Record<ProjectUpdateKind, string> = {
  PROGRESS: "Progress",
  ROLE: "Team / recruiting",
  MILESTONE: "Milestone",
  LAUNCH: "Launch / demo",
};

export function ProjectUpdateComposer({ projectId }: { projectId: string }) {
  const locale = useLocale();
  const copy = useCopy();
  const labels = locale === "en" ? LABELS_EN : LABELS_PL;
  const [kind, setKind] = React.useState<ProjectUpdateKind>("PROGRESS");
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function submit() {
    startTransition(async () => {
      const result = await publishProjectUpdate({ projectId, kind, body });
      if (result?.error) { toast.error(result.error); return; }
      setBody("");
      setKind("PROGRESS");
      toast.success(copy("Aktualizacja opublikowana.", "Update published."));
    });
  }

  return (
    <div className="border-y border-[var(--bc-line)] py-4">
      <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
        <Select value={kind} onValueChange={(value) => setKind(value as ProjectUpdateKind)}>
          <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(labels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={600} placeholder={copy("Co realnie zmieniło się w projekcie? Np. działa import z pierwszej sieci i otwieramy rolę UI/UX.", "What actually changed in the project? For example: the first integration works and we are opening a UI/UX role.")} className="min-h-[88px] resize-y" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-4 text-[var(--bc-faint)]">{copy("Aktualizację zobaczą obserwujący projekt. Krótko, konkretnie, bez marketingowego posta.", "People following the project will see this update. Keep it short, specific, and useful.")}</p>
        <Button type="button" size="sm" onClick={submit} disabled={pending || body.trim().length < 10}>{pending ? copy("Publikowanie…", "Publishing…") : copy("Opublikuj", "Publish")}</Button>
      </div>
    </div>
  );
}
