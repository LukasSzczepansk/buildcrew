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
import { labelsFor } from "@/lib/constants-i18n";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
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
  const locale = useLocale();
  const copy = useCopy();
  const labels = labelsFor(locale);
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
    toast.success(copy("Twoja chęć dołączenia została wysłana!", "Your request to join has been sent!"));
    setOpen(false);
    setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{copy("Chcę dołączyć", "I want to join")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy("Dołącz jako", "Join as")} {labels.roles[roleType]}</DialogTitle>
          <DialogDescription>{copy("To nie rozmowa o pracę. Autor projektu zobaczy Twój profil i krótką wiadomość o tym, co chcesz wnieść do wspólnego projektu.", "This is not a job application. The project owner will see your profile and a short note about what you want to contribute.")}</DialogDescription>
        </DialogHeader>

        <div className="rounded-[6px] bg-neutral-50 p-4 text-sm dark:bg-neutral-800/50">
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{copy("Twoje dane", "Your profile")}</p>
          <div className="flex flex-col gap-1.5">
            <p>
              <span className="text-neutral-400">{copy("Rola:", "Role:")}</span> {myProfile.role ? labels.roles[myProfile.role] : "-"}
            </p>
            <p>
              <span className="text-neutral-400">{copy("Poziom:", "Level:")}</span> {myProfile.level ? labels.levels[myProfile.level] : "-"}
            </p>
            <p>
              <span className="text-neutral-400">{copy("Dostępność:", "Availability:")}</span> {myProfile.weeklyHours ? labels.commitments[myProfile.weeklyHours] : "-"}
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
          <label className="text-sm font-medium">{copy("Co chciałbyś wnieść do projektu?", "What would you like to contribute?")}</label>
          <Textarea placeholder={copy("Np. Mogę ogarnąć frontend i chciałbym razem dowieźć pierwsze MVP…", "For example: I can take care of the frontend and help ship the first MVP…")} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
          <p className="text-right text-[13px] text-neutral-400">{message.length}/500</p>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? copy("Wysyłanie…", "Sending…") : copy("Wyślij chęć dołączenia", "Send request")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
