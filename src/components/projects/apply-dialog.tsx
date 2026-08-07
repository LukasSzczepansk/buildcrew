"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { COMMITMENT_LABELS, LEVEL_LABELS, ROLE_LABELS } from "@/lib/constants";
import type { Commitment, Level, RoleType } from "@/db/schema";
import { applyToProject } from "@/server/actions/projects";

export function ApplyDialog({
  projectId,
  roleId,
  roleType,
  myProfile,
}: {
  projectId: string;
  roleId: string;
  roleType: RoleType;
  myProfile: { role: RoleType | null; skills: string[]; level: Level | null; weeklyHours: Commitment | null };
}) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSubmit() {
    setPending(true);
    const res = await applyToProject(projectId, { roleId, message });
    setPending(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Zgłoszenie wysłane!");
    setOpen(false);
    setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Chcę dołączyć</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplikuj na rolę: {ROLE_LABELS[roleType]}</DialogTitle>
          <DialogDescription>Właściciel zobaczy Twój profil i wiadomość poniżej.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-neutral-50 p-4 text-sm dark:bg-neutral-800/50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Twoje dane</p>
          <div className="flex flex-col gap-1.5">
            <p>
              <span className="text-neutral-400">Rola:</span> {myProfile.role ? ROLE_LABELS[myProfile.role] : "—"}
            </p>
            <p>
              <span className="text-neutral-400">Poziom:</span> {myProfile.level ? LEVEL_LABELS[myProfile.level] : "—"}
            </p>
            <p>
              <span className="text-neutral-400">Dostępność:</span> {myProfile.weeklyHours ? COMMITMENT_LABELS[myProfile.weeklyHours] : "—"}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {myProfile.skills.slice(0, 6).map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Dlaczego chcesz dołączyć?</label>
          <Textarea placeholder="Napisz kilka słów…" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
          <p className="text-right text-xs text-neutral-400">{message.length}/500</p>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Wysyłanie…" : "Wyślij zgłoszenie"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
