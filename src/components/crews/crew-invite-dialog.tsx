"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import { inviteToCrew } from "@/server/actions/crews";
import type { RoleType } from "@/db/schema";

export function CrewInviteDialog({ crewId, candidates }: { crewId: string; candidates: { userId: string; username: string; role: RoleType | null }[] }) {
  const copy = useCopy();
  const locale = useLocale();
  const roleLabels = labelsFor(locale).roles;
  const [open, setOpen] = React.useState(false);
  const [inviteeId, setInviteeId] = React.useState(candidates[0]?.userId ?? "");
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSend() {
    if (!inviteeId) return;
    setPending(true);
    const res = await inviteToCrew(crewId, inviteeId, message);
    setPending(false);
    if (res?.error) { toast.error(appMessage(res.error, locale)); return; }
    toast.success(copy("Invitation sent!", "Invitation sent!"));
    setOpen(false); setMessage("");
  }

  if (candidates.length === 0) return <Button variant="outline" disabled className="gap-2"><UserPlus className="h-4 w-4" /> {copy("No available people", "No available people")}</Button>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="gap-2"><UserPlus className="h-4 w-4" /> {copy("Invite another builder", "Invite another builder")}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{copy("Invite to crew", "Invite to crew")}</DialogTitle><DialogDescription>{copy("Choose someone from Build Pool to invite.", "Choose someone from Build Pool to invite.")}</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-4"><Select value={inviteeId} onValueChange={setInviteeId}><SelectTrigger><SelectValue placeholder={copy("Choose a person", "Choose a person")} /></SelectTrigger><SelectContent>{candidates.map((c) => <SelectItem key={c.userId} value={c.userId}>{c.username} {c.role ? `- ${roleLabels[c.role]}` : ""}</SelectItem>)}</SelectContent></Select><Textarea placeholder={copy("Short message (optional)", "Short message (optional)")} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        <DialogFooter><Button onClick={handleSend} disabled={pending || !inviteeId}>{pending ? copy("Sending…", "Sending…") : copy("Send invitation", "Send invitation")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
