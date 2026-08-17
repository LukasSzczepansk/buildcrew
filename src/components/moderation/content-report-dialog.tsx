"use client";

import * as React from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reportContent } from "@/server/actions/moderation";
import type { ReportReason, ReportTargetType } from "@/db/schema";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "scam", label: "Scam or misleading content" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

export function ContentReportDialog({ targetType, targetId, label = "Report", compact = false }: { targetType: Exclude<ReportTargetType, "USER">; targetId: string; label?: string; compact?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<ReportReason>("spam");
  const [description, setDescription] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function submit() {
    startTransition(async () => {
      const result = await reportContent({ targetType, targetId, reason, description });
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Report submitted. Thank you for helping keep BuildCrew useful and safe.");
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
          <DialogTitle>Report {targetType === "PROJECT" ? "project" : "message"}</DialogTitle>
          <DialogDescription>Reports are reviewed by BuildCrew. Do not use this for disagreements that can be resolved directly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REASONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={800} placeholder="Optional context for the moderation team" />
        </div>
        <DialogFooter><Button onClick={submit} disabled={pending}>{pending ? "Submitting…" : "Submit report"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
