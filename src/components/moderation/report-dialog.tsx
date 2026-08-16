"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { appMessage } from "@/lib/server-copy";
import { reportUser } from "@/server/actions/moderation";
import type { ReportReason } from "@/db/schema";

const EN_REASONS: Record<ReportReason, string> = {
  spam: "Spam",
  harassment: "Harassment",
  scam: "Scam or fraud",
  inappropriate: "Inappropriate content",
  other: "Other",
};

export function ReportDialog({ open, onOpenChange, reportedId }: { open: boolean; onOpenChange: (v: boolean) => void; reportedId: string }) {
  const copy = useCopy();
  const locale = useLocale();
  const [reason, setReason] = React.useState<ReportReason>("spam");
  const [description, setDescription] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSubmit() {
    setPending(true);
    const res = await reportUser({ reportedId, reason, description });
    setPending(false);
    if (res?.error) { toast.error(appMessage(res.error, locale)); return; }
    toast.success(copy("Dziękujemy za zgłoszenie.", "Thanks for the report."));
    onOpenChange(false);
    setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{copy("Zgłoś użytkownika", "Report user")}</DialogTitle><DialogDescription>{copy("Pomóż nam utrzymać BuildCrew bezpieczne dla wszystkich.", "Help us keep BuildCrew safe for everyone.")}</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-4">
          <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(REPORT_REASON_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{locale === "en" ? EN_REASONS[value as ReportReason] : label}</SelectItem>)}</SelectContent></Select>
          <Textarea placeholder={copy("Opisz sytuację (opcjonalnie)", "Describe what happened (optional)")} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={pending} variant="destructive">{pending ? copy("Wysyłanie…", "Sending…") : copy("Wyślij zgłoszenie", "Submit report")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
