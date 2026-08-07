"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REPORT_REASON_LABELS } from "@/lib/constants";
import { reportUser } from "@/server/actions/moderation";
import type { ReportReason } from "@/db/schema";

export function ReportDialog({
  open,
  onOpenChange,
  reportedId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reportedId: string;
}) {
  const [reason, setReason] = React.useState<ReportReason>("spam");
  const [description, setDescription] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSubmit() {
    setPending(true);
    const res = await reportUser({ reportedId, reason, description });
    setPending(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Dziękujemy za zgłoszenie.");
    onOpenChange(false);
    setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zgłoś użytkownika</DialogTitle>
          <DialogDescription>Pomóż nam utrzymać BuildCrew bezpieczne dla wszystkich.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Opisz sytuację (opcjonalnie)"
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending} variant="destructive">
            {pending ? "Wysyłanie…" : "Wyślij zgłoszenie"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
