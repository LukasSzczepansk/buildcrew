"use client";

import * as React from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { COMMITMENT_LABELS, GOAL_LABELS, LEVEL_LABELS, ROLE_LABELS } from "@/lib/constants";
import type { Commitment, Goal, Level, RoleType } from "@/db/schema";
import { sendBuildProposal } from "@/server/actions/crews";
import { inviteToCrew } from "@/server/actions/crews";

export type BuildPoolPerson = {
  userId: string;
  username: string;
  avatarEmoji: string;
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  skills: string[];
  interests: string[];
  goals: Goal[];
  reasons: string[];
};

export function BuildPoolCard({ person, myCrewId }: { person: BuildPoolPerson; myCrewId: string | null }) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSend() {
    setPending(true);
    const res = myCrewId
      ? await inviteToCrew(myCrewId, person.userId, message)
      : await sendBuildProposal(person.userId, message);
    setPending(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(myCrewId ? "Zaproszenie do ekipy wysłane!" : "Propozycja wysłana!");
    setOpen(false);
    setMessage("");
  }

  return (
    <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
      <Link href={`/builders/${person.userId}`} className="flex items-center gap-3">
        <Avatar emoji={person.avatarEmoji} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{person.username}</p>
          <p className="text-sm text-neutral-500">{person.role ? ROLE_LABELS[person.role] : "Builder"}</p>
        </div>
      </Link>

      {person.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {person.skills.slice(0, 4).map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        {person.level && <span>{LEVEL_LABELS[person.level]}</span>}
        {person.weeklyHours && (
          <>
            <span>·</span>
            <span>{COMMITMENT_LABELS[person.weeklyHours]}</span>
          </>
        )}
      </div>

      {person.interests.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {person.interests.slice(0, 3).map((i) => (
            <Badge key={i} variant="secondary">
              {i}
            </Badge>
          ))}
        </div>
      )}

      {person.reasons.length > 0 && (
        <div className="mt-4 flex-1 rounded-xl bg-violet-50/60 p-3 dark:bg-violet-500/5">
          <p className="mb-1 text-xs font-semibold text-violet-700 dark:text-violet-300">Pasujecie, bo:</p>
          <ul className="space-y-0.5 text-xs text-violet-700/80 dark:text-violet-300/80">
            {person.reasons.map((r, i) => (
              <li key={i}>✓ {r}</li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4 w-full">{myCrewId ? "Zaproś do naszej ekipy" : "Zbudujmy coś razem"}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{myCrewId ? `Zaproś ${person.username} do ekipy` : "Hej! Może zbudujemy coś razem?"}</DialogTitle>
            <DialogDescription>
              {myCrewId
                ? "Osoba zobaczy członków Waszej ekipy i wspólne zainteresowania."
                : "Wyślij krótką wiadomość — jeśli druga osoba się zgodzi, powstanie wasza wspólna ekipa."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Cześć! Widzę, że też szukasz ekipy…"
            maxLength={300}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleSend} disabled={pending}>
              {pending ? "Wysyłanie…" : "Wyślij propozycję"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
