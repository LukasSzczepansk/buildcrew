"use client";

import * as React from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { appMessage } from "@/lib/server-copy";
import { reportContent } from "@/server/actions/moderation";
import type { ReportReason, ReportTargetType } from "@/db/schema";


export function ContentReportDialog({ targetType, targetId, label = "Report", compact = false }: { targetType: Exclude<ReportTargetType, "USER">; targetId: string; label?: string; compact?: boolean }) {
  const copy = useCopy();
  const locale = useLocale();
  const reasons: { value: ReportReason; label: string }[] = [
    { value: "spam", label: "Spam" },
    { value: "scam", label: copy("Oszustwo lub wprowadzająca w błąd treść", "Scam or misleading content") },
    { value: "harassment", label: copy("Nękanie", "Harassment") },
    { value: "inappropriate", label: copy("Nieodpowiednia treść", "Inappropriate content") },
    { value: "other", label: copy("Inne", "Other") },
  ];
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<ReportReason>("spam");
  const [description, setDescription] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function submit() {
    startTransition(async () => {
      const result = await reportContent({ targetType, targetId, reason, description });
      if (result && "error" in result && result.error) {
        toast.error(appMessage(result.error, locale));
        return;
      }
      toast.success(copy("Zgłoszenie wysłane. Dziękujemy za pomoc w dbaniu o bezpieczeństwo BuildCrew.", "Report submitted. Thank you for helping keep BuildCrew useful and safe."));
      setDescription("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size={compact ? "sm" : "default"} className="gap-1.5 text-[var(--bc-muted)]"><Flag className="h-3.5 w-3.5" />{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{targetType === "PROJECT" ? copy("Zgłoś projekt", "Report project") : copy("Zgłoś wiadomość", "Report message")}</DialogTitle>
          <DialogDescription>{copy("Zgłoszenia są sprawdzane przez BuildCrew. Nie używaj tej funkcji do sporów, które można rozwiązać bezpośrednio.", "Reports are reviewed by BuildCrew. Do not use this for disagreements that can be resolved directly.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{reasons.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={800} placeholder={copy("Opcjonalny kontekst dla zespołu moderacji", "Optional context for the moderation team")} />
        </div>
        <DialogFooter><Button onClick={submit} disabled={pending}>{pending ? copy("Wysyłanie...", "Submitting...") : copy("Wyślij zgłoszenie", "Submit report")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
