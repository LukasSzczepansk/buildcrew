"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { COMMITMENT_LABELS, LEVEL_LABELS, ROLE_LABELS } from "@/lib/constants";
import type { Commitment, Level, RoleType } from "@/db/schema";
import { respondToApplication } from "@/server/actions/projects";

export type ApplicationCardData = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message: string | null;
  role: { roleType: RoleType };
  matchScore: number;
  reasons: string[];
  applicant: { userId: string; username: string; avatarEmoji: string; level: Level | null; weeklyHours: Commitment | null; skills: string[] };
};

export function ApplicationCard({ application }: { application: ApplicationCardData }) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState(application.status);

  async function respond(decision: "ACCEPTED" | "REJECTED") {
    setPending(true);
    const res = await respondToApplication(application.id, decision);
    setPending(false);
    if (res?.error) { toast.error(res.error); return; }
    setStatus(decision);
    toast.success(decision === "ACCEPTED" ? "Zaakceptowano zgłoszenie" : "Zgłoszenie odrzucone");
  }

  return (
    <article className="grid gap-4 border-b border-[var(--bc-line)] py-4 first:border-t sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <Link href={`/builders/${application.applicant.userId}`}><Avatar username={application.applicant.username} seed={application.applicant.userId} /></Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2"><Link href={`/builders/${application.applicant.userId}`} className="font-semibold hover:underline">{application.applicant.username}</Link><span className="text-[13px] text-[var(--bc-muted)]">{ROLE_LABELS[application.role.roleType]}</span></div>
          <div className="mt-2"><TechnologyStack items={application.applicant.skills} max={4} compact className="gap-1.5" /></div>
          <p className="mt-2 truncate text-[12px] text-[var(--bc-muted)]">{application.reasons[0] || application.message || "Sprawdź profil kandydata."}</p>
          <p className="mt-1 text-[12px] text-[var(--bc-faint)]">{application.applicant.level ? LEVEL_LABELS[application.applicant.level] : ""}{application.applicant.weeklyHours ? ` · ${COMMITMENT_LABELS[application.applicant.weeklyHours]}` : ""}</p>
        </div>
      </div>

      <div><p className="text-[11px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">Match</p><p className="mt-1 text-[22px] font-semibold text-[#94bf28]">{application.matchScore}%</p></div>

      <div className="flex shrink-0 items-center gap-2">
        {status === "PENDING" ? <><Button size="sm" className="gap-1" onClick={() => respond("ACCEPTED")} disabled={pending}><Check className="h-3.5 w-3.5" /> Akceptuj</Button><Button size="sm" variant="outline" onClick={() => respond("REJECTED")} disabled={pending} aria-label="Odrzuć"><X className="h-3.5 w-3.5" /></Button></> : <Badge variant={status === "ACCEPTED" ? "success" : "destructive"}>{status === "ACCEPTED" ? "Zaakceptowano" : "Odrzucono"}</Badge>}
      </div>
    </article>
  );
}
