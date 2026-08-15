import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TechnologyStack } from "@/components/ui/technology-badge";
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
  createdAt?: Date | string | null;
};

export function BuilderCard({ builder, action, matchScore, matchReasons = [] }: { builder: BuilderCardData; action?: React.ReactNode; matchScore?: number; matchReasons?: string[] }) {
  const openToBuild = builder.lookingFor.includes("OPEN_TO_BUILD") || builder.lookingFor.includes("WANTS_PROJECT");
  const createdAt = builder.createdAt ? new Date(builder.createdAt) : null;
  const isNew = createdAt && !Number.isNaN(createdAt.getTime()) && Date.now() - createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
  const activityState = getActivityState(builder.lastActiveAt);
  const activityColor = activityState === "TODAY" ? "bg-[#9bc432]" : activityState === "THIS_WEEK" ? "bg-amber-400" : "bg-neutral-400 dark:bg-neutral-600";
  const score = typeof matchScore === "number" ? Math.min(100, Math.max(0, matchScore)) : null;
  const strongMatch = score !== null && score >= 70;
  const insights = matchReasons.length ? matchReasons.slice(0, 2) : (builder.lookingFor.length > 0 ? builder.lookingFor.map((item) => LOOKING_FOR_LABELS[item]).slice(0, 2) : ["Sprawdź profil i wspólne punkty."]);

  return (
    <article className="group rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] transition-colors hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]">
      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[240px_minmax(320px,1fr)_100px_250px] xl:items-center xl:gap-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <Link href={`/builders/${builder.userId}`} aria-label={`Profil ${builder.username}`} className="shrink-0">
            <Avatar username={builder.username} seed={builder.userId} className="h-14 w-14 text-[19px]" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <Link href={`/builders/${builder.userId}`} className="truncate text-[17px] font-semibold tracking-[-0.018em] text-[var(--bc-ink)] hover:underline">{builder.username}</Link>
              {builder.isDemo ? <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">demo</span> : null}
              {isNew ? <span className="rounded-[5px] border border-[var(--bc-line)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--bc-muted)]">Nowy</span> : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-[var(--bc-muted)]">{builder.role ? ROLE_LABELS[builder.role] : "Builder"}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-[var(--bc-muted)]">
              <span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${activityColor}`} />{activityLabel(builder.lastActiveAt)}</span>
              {openToBuild ? <span className="font-medium text-[var(--bc-ink)]">Otwarty na współpracę</span> : null}
              {builder.weeklyHours ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{COMMITMENT_LABELS[builder.weeklyHours]}</span> : null}
              {builder.level ? <span className="hidden 2xl:inline">{LEVEL_LABELS[builder.level]}</span> : null}
            </div>
          </div>
        </div>

        <div className="min-w-0 border-t border-[var(--bc-line)] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          {builder.skills.length > 0 ? <TechnologyStack items={builder.skills} max={5} compact className="gap-1.5" /> : null}
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Dlaczego warto porozmawiać</p>
            <p className="mt-1.5 text-[13px] leading-[19px] text-[var(--bc-muted)]">{insights.join(" · ")}</p>
          </div>
        </div>

        {score !== null ? (
          <div className="min-w-0 border-t border-[var(--bc-line)] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Match</p>
            <p className={`mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em] ${strongMatch ? "text-[#94bf28] dark:text-[var(--bc-accent)]" : "text-[var(--bc-ink)]"}`}>{score}%</p>
            <div className="mt-2.5 h-[3px] w-full bg-black/8 dark:bg-white/10"><div className="h-[3px] bg-[var(--bc-accent-strong)]" style={{ width: `${score}%` }} /></div>
          </div>
        ) : <div className="hidden xl:block" />}

        <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-[var(--bc-line)] pt-4 xl:flex-nowrap xl:justify-end xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          {action}
          <Link href={`/builders/${builder.userId}`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[7px] bg-neutral-950 px-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950">
            Zobacz profil <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
