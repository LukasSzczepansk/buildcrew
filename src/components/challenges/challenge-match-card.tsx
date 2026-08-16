"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCopy, useLocale } from "@/components/i18n/locale-provider";
import { labelsFor } from "@/lib/constants-i18n";
import { appMessage } from "@/lib/server-copy";
import type { RoleType } from "@/db/schema";
import { sendBuildProposal } from "@/server/actions/crews";
export function ChallengeMatchCard({ challengeId, candidate }: { challengeId: string; candidate: { userId: string; username: string; avatarEmoji: string; role: RoleType | null; score: number; reasons: string[] } }) {
  const copy = useCopy(); const locale = useLocale(); const labels = labelsFor(locale); const [pending, setPending] = React.useState(false);
  async function invite() { setPending(true); const result = await sendBuildProposal(candidate.userId, copy("Hey! BuildCrew matched us for this challenge. Want to build it together?", "Hey! BuildCrew matched us for this challenge. Want to build it together?"), challengeId); setPending(false); if (result?.error) toast.error(appMessage(result.error, locale)); else toast.success(copy("Team proposal sent!", "Team proposal sent!")); }
  return <Card className="p-4"><div className="flex items-start justify-between gap-3"><Link href={`/builders/${candidate.userId}`} className="flex items-center gap-3"><Avatar username={candidate.username} seed={candidate.userId} /><div><p className="font-semibold">{candidate.username}</p><p className="text-[13px] text-neutral-500">{candidate.role ? labels.roles[candidate.role] : "Builder"}</p></div></Link><Badge>{candidate.score}%</Badge></div>{candidate.reasons.length ? <ul className="mt-3 space-y-1 text-[13px] text-neutral-500">{candidate.reasons.slice(0,3).map((reason) => <li key={reason}>✓ {reason}</li>)}</ul> : null}<Button className="mt-4 w-full" size="sm" onClick={invite} disabled={pending}>{pending ? copy("Sending…", "Sending…") : copy("Propose teaming up", "Propose teaming up")}</Button></Card>;
}
