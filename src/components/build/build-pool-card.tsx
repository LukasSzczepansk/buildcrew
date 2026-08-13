"use client";

import * as React from "react";
import { toast } from "sonner";
import Link from "next/link";
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
  const score = Math.min(100, Math.max(0, person.matchScore));
  const strongMatch = score >= 70;
  const technologies = person.technologies.slice(0, 5);
  const remainingTechnologies = Math.max(0, person.technologies.length - technologies.length);

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
    <article className="group border-b border-[var(--bc-line)] transition-colors first:border-t hover:bg-black/[0.022] dark:hover:bg-white/[0.025]">
      <div className="grid gap-4 py-6 sm:grid-cols-[52px_minmax(0,1fr)] sm:gap-x-4 lg:grid-cols-[52px_minmax(0,1fr)_104px_132px] lg:gap-x-6">
        <Link href={`/builders/${person.userId}`} className="shrink-0 self-start" aria-label={`Profil ${person.username}`}>
          <Avatar emoji={person.avatarEmoji} className="h-12 w-12 text-[21px] sm:h-[52px] sm:w-[52px]" />
        </Link>

        <div className="min-w-0">
          <Link href={`/builders/${person.userId}`} className="text-[16px] font-semibold leading-[22px] tracking-[-0.012em] hover:underline">{person.username}</Link>
          <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--bc-muted)]">{ROLE_LABELS[person.role]}</p>

          <h3 className="mt-3 text-[14px] font-medium leading-5 text-[var(--bc-ink)]">{person.headline}</h3>
          <p className="mt-1.5 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">{person.wantsToBuild}</p>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] leading-4 text-[var(--bc-muted)]">
            <span>{LEVEL_LABELS[person.level]}</span>
            <span>{COMMITMENT_LABELS[person.weeklyHours]}</span>
            <span>Ekipa {person.preferredCrewSize} os.</span>
          </div>

          {technologies.length > 0 ? (
            <p className="mt-3 text-[13px] leading-5 text-[var(--bc-ink)]">{technologies.join(" · ")}{remainingTechnologies > 0 ? ` +${remainingTechnologies}` : ""}</p>
          ) : null}

          {person.reasons.length > 0 ? (
            <div className="mt-3 max-w-[680px] text-[12px] leading-5">
              <span className="font-medium text-[var(--bc-ink)]">Dlaczego warto porozmawiać: </span>
              <span className="text-[var(--bc-muted)]">{person.reasons.slice(0, 2).join(" · ")}</span>
            </div>
          ) : null}
          {person.avoids ? <p className="mt-2 text-[11px] text-[var(--bc-faint)]">Nie szuka: {person.avoids}</p> : null}
        </div>

        <div className="pl-16 sm:col-start-2 sm:pl-0 lg:col-start-3 lg:row-start-1 lg:text-right">
          <p className={`text-[22px] font-semibold leading-7 tabular-nums tracking-[-0.025em] ${strongMatch ? "text-[#a6cf47] dark:text-[#c8f169]" : "text-[var(--bc-ink)]"}`}>{score}%</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">match</p>
        </div>

        <div className="flex items-start gap-3 pl-16 sm:col-start-2 sm:pl-0 lg:col-start-4 lg:row-start-1 lg:justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm">{myCrewId ? "Zaproś" : "Napisz"}</Button></DialogTrigger>
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
