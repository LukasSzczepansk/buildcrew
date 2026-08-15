"use client";

import * as React from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, Clock3, UsersRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TechnologyStack } from "@/components/ui/technology-badge";
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
  const insight = person.reasons[0] || person.wantsToBuild;

  async function handleSend() {
    setPending(true);
    const res = myCrewId ? await inviteToCrew(myCrewId, person.userId, message) : await sendBuildProposal(person.userId, message);
    setPending(false);
    if (res?.error) { toast.error(res.error); return; }
    toast.success(myCrewId ? "Zaproszenie wysłane" : "Wiadomość wysłana");
    setOpen(false);
    setMessage("");
  }

  return (
    <article className="rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] transition-colors hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]">
      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[230px_minmax(320px,1fr)_104px_170px] xl:items-center xl:gap-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <Link href={`/builders/${person.userId}`} className="shrink-0"><Avatar username={person.username} seed={person.userId} className="h-14 w-14 text-[19px]" /></Link>
          <div className="min-w-0">
            <Link href={`/builders/${person.userId}`} className="truncate text-[17px] font-semibold tracking-[-0.018em] hover:underline">{person.username}</Link>
            <p className="mt-0.5 text-sm text-[var(--bc-muted)]">{ROLE_LABELS[person.role]}</p>
            <p className="mt-2 line-clamp-1 text-[13px] font-medium text-[var(--bc-ink)]">{person.headline}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--bc-muted)]">
              <span>{LEVEL_LABELS[person.level]}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{COMMITMENT_LABELS[person.weeklyHours]}</span>
              <span className="inline-flex items-center gap-1"><UsersRound className="h-3 w-3" />{person.preferredCrewSize} os.</span>
            </div>
          </div>
        </div>

        <div className="min-w-0 border-t border-[var(--bc-line)] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          {person.technologies.length > 0 ? <TechnologyStack items={person.technologies} max={5} compact className="gap-1.5" /> : null}
          <p className="mt-3 truncate text-[13px] text-[var(--bc-muted)]"><span className="font-medium text-[var(--bc-ink)]">Wspólny punkt: </span>{insight}</p>
        </div>

        <div className="border-t border-[var(--bc-line)] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Match</p>
          <p className={`mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em] ${strongMatch ? "text-[#94bf28] dark:text-[var(--bc-accent)]" : "text-[var(--bc-ink)]"}`}>{score}%</p>
          <div className="mt-2.5 h-[3px] w-full bg-black/8 dark:bg-white/10"><div className="h-[3px] bg-[var(--bc-accent-strong)]" style={{ width: `${score}%` }} /></div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--bc-line)] pt-4 xl:justify-end xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm">{myCrewId ? "Zaproś" : "Napisz"}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{myCrewId ? `Zaproś ${person.username}` : `Napisz do ${person.username}`}</DialogTitle>
                <DialogDescription>{myCrewId ? "Dodaj krótką wiadomość do zaproszenia." : "Napisz konkretnie, co moglibyście zbudować."}</DialogDescription>
              </DialogHeader>
              <Textarea placeholder="Cześć! Mamy podobny kierunek…" maxLength={300} value={message} onChange={(event) => setMessage(event.target.value)} />
              <DialogFooter><Button onClick={handleSend} disabled={pending}>{pending ? "Wysyłanie…" : "Wyślij"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Link href={`/builders/${person.userId}`} className="inline-flex h-9 items-center gap-1.5 rounded-[7px] border border-[var(--bc-line)] px-3 text-[13px] font-medium text-[var(--bc-ink)] hover:bg-[var(--bc-surface-subtle)]">Profil <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </article>
  );
}
