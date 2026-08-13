"use client";

import * as React from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Users2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  matchScore: number;
};

export function BuildPoolCard({ person, myCrewId }: { person: BuildPoolPerson; myCrewId: string | null }) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSend() {
    setPending(true);
    const res = myCrewId ? await inviteToCrew(myCrewId, person.userId, message) : await sendBuildProposal(person.userId, message);
    setPending(false);
    if (res?.error) { toast.error(res.error); return; }
    toast.success(myCrewId ? "Zaproszenie do ekipy wysłane!" : "Propozycja wysłana!");
    setOpen(false);
    setMessage("");
  }

  return (
    <article className="border-b border-[#d8d8d0] py-5 first:border-t dark:border-neutral-700">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_150px] lg:gap-8">
        <div className="flex gap-3.5">
          <Link href={`/builders/${person.userId}`} className="shrink-0"><Avatar emoji={person.avatarEmoji} className="h-10 w-10 text-lg" /></Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Link href={`/builders/${person.userId}`} className="text-[15px] font-semibold hover:underline">{person.username}</Link>
              <span className="text-[12px] text-neutral-500">{ROLE_LABELS[person.role]}</span>
            </div>
            <h3 className="mt-1.5 text-[14px] font-medium leading-5">{person.headline}</h3>
            <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-neutral-600 dark:text-neutral-300">{person.wantsToBuild}</p>

            <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span>{LEVEL_LABELS[person.level]}</span>
              <span>{COMMITMENT_LABELS[person.weeklyHours]}</span>
              <span className="inline-flex items-center gap-1"><Users2 className="h-3 w-3" /> ekipa {person.preferredCrewSize} os.</span>
              {person.technologies.length > 0 ? <span>{person.technologies.slice(0, 5).join(" · ")}</span> : null}
            </div>

            {person.reasons.length > 0 ? <p className="mt-2.5 max-w-3xl border-l-2 border-[#c8f169] pl-2.5 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">{person.reasons.slice(0, 2).join(" — ")}</p> : null}
            {person.avoids ? <p className="mt-2 text-[11px] text-neutral-400">Nie szuka: {person.avoids}</p> : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pl-[54px] lg:flex-col lg:items-end lg:justify-between lg:pl-0">
          <div className="text-left lg:text-right">
            <p className="text-[18px] font-semibold tabular-nums tracking-[-0.02em]">{Math.min(100, Math.max(0, person.matchScore))}%</p>
            <p className="text-[10px] text-neutral-400">dopasowania</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm">{myCrewId ? "Zaproś do ekipy" : "Napisz"}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{myCrewId ? `Zaproś ${person.username} do ekipy` : `Napisz do ${person.username}`}</DialogTitle>
                <DialogDescription>{myCrewId ? "Osoba zobaczy członków Waszej ekipy i wspólne zainteresowania." : "Napisz krótko, co moglibyście razem spróbować zbudować."}</DialogDescription>
              </DialogHeader>
              <Textarea placeholder="Cześć! Widzę, że mamy podobny kierunek. Może spróbujemy zrobić coś razem?" maxLength={300} value={message} onChange={(event) => setMessage(event.target.value)} />
              <DialogFooter><Button onClick={handleSend} disabled={pending}>{pending ? "Wysyłanie…" : "Wyślij"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </article>
  );
}
