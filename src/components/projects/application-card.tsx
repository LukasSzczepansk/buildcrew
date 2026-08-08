"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  applicant: {
    userId: string;
    username: string;
    avatarEmoji: string;
    level: Level | null;
    weeklyHours: Commitment | null;
    skills: string[];
  };
};

export function ApplicationCard({ application }: { application: ApplicationCardData }) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState(application.status);

  async function respond(decision: "ACCEPTED" | "REJECTED") {
    setPending(true);
    const res = await respondToApplication(application.id, decision);
    setPending(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    setStatus(decision);
    toast.success(decision === "ACCEPTED" ? "Zaakceptowano zgłoszenie!" : "Zgłoszenie odrzucone.");
  }

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Link href={`/builders/${application.applicant.userId}`}>
          <Avatar emoji={application.applicant.avatarEmoji} />
        </Link>
        <div>
          <Link href={`/builders/${application.applicant.userId}`} className="font-medium hover:underline">
            {application.applicant.username}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-2"><p className="text-sm text-neutral-500">Rola: {ROLE_LABELS[application.role.roleType]}</p><Badge>{application.matchScore}% dopasowania</Badge></div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {application.applicant.skills.slice(0, 4).map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            {application.applicant.level ? LEVEL_LABELS[application.applicant.level] : ""}
            {application.applicant.weeklyHours ? ` · ${COMMITMENT_LABELS[application.applicant.weeklyHours]}` : ""}
          </p>
          {application.reasons.length ? <p className="mt-2 text-xs text-violet-600 dark:text-violet-400">✓ {application.reasons.slice(0, 3).join(" · ")}</p> : null}
          {application.message && <p className="mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-300">&ldquo;{application.message}&rdquo;</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {status === "PENDING" ? (
          <>
            <Button size="sm" className="gap-1" onClick={() => respond("ACCEPTED")} disabled={pending}>
              <Check className="h-4 w-4" /> Pasuje
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => respond("REJECTED")} disabled={pending}>
              <X className="h-4 w-4" /> Odrzuć
            </Button>
          </>
        ) : (
          <Badge variant={status === "ACCEPTED" ? "success" : "destructive"}>{status === "ACCEPTED" ? "Zaakceptowano" : "Odrzucono"}</Badge>
        )}
      </div>
    </Card>
  );
}
