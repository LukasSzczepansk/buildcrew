"use client";

import * as React from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Users2 } from "lucide-react";
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
import { COMMITMENT_LABELS, LEVEL_LABELS, ROLE_LABELS } from "@/lib/constants";
import type { Commitment, Level, RoleType } from "@/db/schema";
import { inviteToCrew, sendBuildProposal } from "@/server/actions/crews";

export type BuildPoolPerson = {
  userId: string;
  username: string;
  avatarEmoji: string;
  headline: string;
  role: RoleType;
  level: Level;
  weeklyHours: Commitment;
  technologies: string[];
  wantsToBuild: string;
  avoids: string | null;
  preferredCrewSize: number;
  description: string | null;
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
          <p className="text-sm text-neutral-500">{ROLE_LABELS[person.role]}</p>
        </div>
      </Link>

      <h3 className="mt-4 font-semibold leading-snug">{person.headline}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-300">{person.wantsToBuild}</p>

      {person.technologies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {person.technologies.slice(0, 5).map((technology) => (
            <Badge key={technology} variant="outline">{technology}</Badge>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        <span>{LEVEL_LABELS[person.level]}</span>
        <span>·</span>
        <span>{COMMITMENT_LABELS[person.weeklyHours]}</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1"><Users2 className="h-3.5 w-3.5" /> ekipa {person.preferredCrewSize} os.</span>
      </div>

      {person.description ? <p className="mt-3 text-xs text-neutral-500">{person.description}</p> : null}
      {person.avoids ? <p className="mt-2 text-xs text-neutral-400"><span className="font-medium">Nie szuka:</span> {person.avoids}</p> : null}

      {person.reasons.length > 0 && (
        <div className="mt-4 flex-1 rounded-xl bg-violet-50/60 p-3 dark:bg-violet-500/5">
          <p className="mb-1 text-xs font-semibold text-violet-700 dark:text-violet-300">Pasujecie, bo:</p>
          <ul className="space-y-0.5 text-xs text-violet-700/80 dark:text-violet-300/80">
            {person.reasons.map((reason, index) => <li key={index}>✓ {reason}</li>)}
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
            onChange={(event) => setMessage(event.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleSend} disabled={pending}>{pending ? "Wysyłanie…" : "Wyślij propozycję"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
