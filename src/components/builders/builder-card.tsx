import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
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

export function BuilderCard({ builder, action, matchScore, matchReasons = [] }: { builder: BuilderCardData; action?: React.ReactNode; matchScore?: number; matchReasons?: string[] }) {
  const openToBuild = builder.lookingFor.includes("OPEN_TO_BUILD");
  const activityState = getActivityState(builder.lastActiveAt);
  const activityColor = activityState === "TODAY" ? "bg-[#86b52c]" : activityState === "THIS_WEEK" ? "bg-amber-500" : "bg-neutral-300 dark:bg-neutral-600";

  return (
    <article className="group border-b border-[#d8d8d0] py-5 first:border-t dark:border-neutral-700">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px] md:gap-8">
        <div className="flex min-w-0 gap-3.5">
          <Avatar emoji={builder.avatarEmoji} className="mt-0.5 h-10 w-10 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <Link href={`/builders/${builder.userId}`} className="truncate text-[15px] font-semibold tracking-[-0.01em] hover:underline">{builder.username}</Link>
              {builder.isDemo ? <span className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">demo</span> : null}
              <span className="text-[12px] text-neutral-500">{builder.role ? ROLE_LABELS[builder.role] : "Builder"}</span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 ${activityColor}`} />{activityLabel(builder.lastActiveAt)}</span>
              {openToBuild ? <span className="font-medium text-neutral-700 dark:text-neutral-300">otwarty na współpracę</span> : null}
              {builder.level ? <span>{LEVEL_LABELS[builder.level]}</span> : null}
              {builder.weeklyHours ? <span>{COMMITMENT_LABELS[builder.weeklyHours]}</span> : null}
            </div>

            {builder.skills.length > 0 ? <p className="mt-2 text-[12px] leading-5 text-neutral-600 dark:text-neutral-300">{builder.skills.slice(0, 5).join(" · ")}</p> : null}
            {matchReasons.length > 0 ? <p className="mt-2 max-w-2xl text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">{matchReasons.slice(0, 2).join(" — ")}</p> : builder.lookingFor.length > 0 ? <p className="mt-2 text-[12px] leading-5 text-neutral-500">{builder.lookingFor.map((item) => LOOKING_FOR_LABELS[item]).join(" · ")}</p> : null}
            {builder.interests.length > 0 ? <p className="mt-1 text-[11px] text-neutral-400">{builder.interests.slice(0, 3).join(" · ")}</p> : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pl-[54px] md:flex-col md:items-end md:justify-between md:pl-0">
          {typeof matchScore === "number" ? (
            <div className="text-left md:text-right">
              <p className="text-[18px] font-semibold tabular-nums tracking-[-0.02em]">{Math.min(100, Math.max(0, matchScore))}%</p>
              <p className="text-[10px] text-neutral-400">dopasowania</p>
            </div>
          ) : <div />}
          <div className="flex items-center gap-2">
            {action}
            <Link href={`/builders/${builder.userId}`} className="inline-flex items-center gap-1 text-[12px] font-medium hover:underline">Profil <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </div>
    </article>
  );
}
