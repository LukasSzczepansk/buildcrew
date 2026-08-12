import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COMMITMENT_LABELS, LEVEL_LABELS, LOOKING_FOR_LABELS, ROLE_LABELS } from "@/lib/constants";
import { activityLabel, getActivityState } from "@/lib/activity";
import type { Commitment, Level, LookingFor, RoleType } from "@/db/schema";

export type BuilderCardData = {
  userId: string;
  username: string;
  avatarEmoji: string;
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  skills: string[];
  interests: string[];
  lookingFor: LookingFor[];
  isDemo?: boolean;
  lastActiveAt?: Date | string | null;
};

export function BuilderCard({
  builder,
  action,
  matchScore,
  matchReasons = [],
}: {
  builder: BuilderCardData;
  action?: React.ReactNode;
  matchScore?: number;
  matchReasons?: string[];
}) {
  const openToBuild = builder.lookingFor.includes("OPEN_TO_BUILD");
  const wantsProject = builder.lookingFor.includes("WANTS_PROJECT");
  const hasProject = builder.lookingFor.includes("HAS_PROJECT");
  const activityState = getActivityState(builder.lastActiveAt);

  return (
    <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar emoji={builder.avatarEmoji} />
          <div className="min-w-0">
            <div className="flex items-center gap-2"><p className="truncate font-semibold">{builder.username}</p>{builder.isDemo ? <Badge variant="outline">Demo</Badge> : null}</div>
            <p className="text-sm text-neutral-500">{builder.role ? ROLE_LABELS[builder.role] : "Builder"}</p>
          </div>
        </div>
        {typeof matchScore === "number" ? (
          <Badge className="shrink-0 gap-1 bg-violet-600 text-white hover:bg-violet-600">
            <Sparkles className="h-3 w-3" /> {Math.min(100, Math.max(0, matchScore))}%
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant={activityState === "TODAY" ? "success" : "outline"}>
          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${activityState === "TODAY" ? "bg-emerald-500" : activityState === "THIS_WEEK" ? "bg-amber-400" : "bg-neutral-300 dark:bg-neutral-600"}`} />
          {activityLabel(builder.lastActiveAt)}
        </Badge>
        {openToBuild ? <Badge variant="success">Otwarty na pomysły</Badge> : null}
        {wantsProject ? <Badge variant="secondary">Chce dołączyć do projektu</Badge> : null}
        {hasProject ? <Badge variant="secondary">Ma własny pomysł</Badge> : null}
      </div>

      {builder.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {builder.skills.slice(0, 4).map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        {builder.level && <span>{LEVEL_LABELS[builder.level]}</span>}
        {builder.weeklyHours && <><span>·</span><span>{COMMITMENT_LABELS[builder.weeklyHours]}</span></>}
      </div>

      {builder.interests.length > 0 ? (
        <p className="mt-3 text-xs text-neutral-400">Interesuje się: <span className="text-neutral-600 dark:text-neutral-300">{builder.interests.slice(0, 3).join(", ")}</span></p>
      ) : null}

      {matchReasons.length > 0 ? (
        <div className="mt-4 flex-1 rounded-xl bg-violet-50/70 p-3 dark:bg-violet-500/5">
          <p className="mb-1 text-xs font-semibold text-violet-700 dark:text-violet-300">Dlaczego możecie pasować:</p>
          <ul className="space-y-1 text-xs text-violet-700/80 dark:text-violet-300/80">
            {matchReasons.slice(0, 2).map((reason) => <li key={reason}>✓ {reason}</li>)}
          </ul>
        </div>
      ) : builder.lookingFor.length > 0 ? (
        <p className="mt-3 flex-1 text-xs text-neutral-400">Aktualnie: <span className="text-neutral-600 dark:text-neutral-300">{builder.lookingFor.map((l) => LOOKING_FOR_LABELS[l]).join(", ")}</span></p>
      ) : <div className="flex-1" />}

      <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <Button asChild variant="outline" size="sm" className="flex-1"><Link href={`/builders/${builder.userId}`}>Poznaj buildera</Link></Button>
        {action}
      </div>
    </Card>
  );
}
