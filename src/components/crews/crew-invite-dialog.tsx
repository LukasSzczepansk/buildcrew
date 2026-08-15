"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants";
import { inviteToCrew } from "@/server/actions/crews";
import type { RoleType } from "@/db/schema";

export function CrewInviteDialog({
  crewId,
  candidates,
}: {
  crewId: string;
  candidates: { userId: string; username: string; role: RoleType | null }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [inviteeId, setInviteeId] = React.useState(candidates[0]?.userId ?? "");
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSend() {
    if (!inviteeId) return;
    setPending(true);
    const res = await inviteToCrew(crewId, inviteeId, message);
    setPending(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Zaproszenie wysłane!");
    setOpen(false);
    setMessage("");
  }

  if (candidates.length === 0) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <UserPlus className="h-4 w-4" /> Brak dostępnych osób
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" /> Zaproś kolejnego buildera
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zaproś do ekipy</DialogTitle>
          <DialogDescription>Wybierz osobę z Build Pool, którą chcesz zaprosić.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Select value={inviteeId} onValueChange={setInviteeId}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz osobę" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.userId} value={c.userId}>
                  {c.username} {c.role ? `- ${ROLE_LABELS[c.role]}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea placeholder="Krótka wiadomość (opcjonalnie)" maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={handleSend} disabled={pending || !inviteeId}>
            {pending ? "Wysyłanie…" : "Wyślij zaproszenie"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
