import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
};

export function BuilderCard({ builder, action, matchScore, matchReasons = [] }: { builder: BuilderCardData; action?: React.ReactNode; matchScore?: number; matchReasons?: string[] }) {
  const openToBuild = builder.lookingFor.includes("OPEN_TO_BUILD");
  const activityState = getActivityState(builder.lastActiveAt);
  const activityColor = activityState === "TODAY" ? "bg-[#c8f169]" : activityState === "THIS_WEEK" ? "bg-amber-400" : "bg-neutral-400 dark:bg-neutral-600";
  const score = typeof matchScore === "number" ? Math.min(100, Math.max(0, matchScore)) : null;
  const strongMatch = score !== null && score >= 70;
  const insight = matchReasons.slice(0, 2).join(" · ");

  return (
    <article className="group relative border-b border-[var(--bc-line)] transition-colors first:border-t hover:bg-black/[0.025] dark:hover:bg-white/[0.03]">
      <div className="grid gap-4 px-0 py-6 sm:grid-cols-[56px_minmax(0,1fr)] lg:grid-cols-[56px_minmax(0,1fr)_116px] xl:grid-cols-[56px_minmax(0,1fr)_116px_168px] xl:gap-x-6">
        <Link href={`/builders/${builder.userId}`} className="shrink-0 self-start" aria-label={`Profil ${builder.username}`}>
          <Avatar emoji={builder.avatarEmoji} className="h-14 w-14 border-[var(--bc-line-strong)] bg-[var(--bc-surface-subtle)] text-[24px]" />
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 xl:hidden">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <Link href={`/builders/${builder.userId}`} className="truncate text-[17px] font-semibold leading-6 tracking-[-0.015em] text-[var(--bc-ink)] hover:underline">
                  {builder.username}
                </Link>
                {builder.isDemo ? <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">demo</span> : null}
              </div>
              <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--bc-muted)]">{builder.role ? ROLE_LABELS[builder.role] : "Builder"}</p>
            </div>
            {score !== null ? (
              <div className="rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 py-2 text-right">
                <p className={`text-[20px] font-semibold leading-5 tabular-nums tracking-[-0.02em] ${strongMatch ? "text-[#9dca38] dark:text-[#c8f169]" : "text-[var(--bc-ink)]"}`}>{score}%</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">match</p>
              </div>
            ) : null}
          </div>

          <div className="hidden min-w-0 xl:block">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={`/builders/${builder.userId}`} className="truncate text-[17px] font-semibold leading-6 tracking-[-0.015em] text-[var(--bc-ink)] hover:underline">
                {builder.username}
              </Link>
              {builder.isDemo ? <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">demo</span> : null}
            </div>
            <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--bc-muted)]">{builder.role ? ROLE_LABELS[builder.role] : "Builder"}</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] leading-4 text-[var(--bc-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 ${activityColor}`} aria-hidden="true" />
              {activityLabel(builder.lastActiveAt)}
            </span>
            {openToBuild ? <span className="inline-flex min-h-6 items-center rounded-full border border-[var(--bc-line)] px-2 text-[11px] font-medium text-[var(--bc-ink)]">Otwarty na współpracę</span> : null}
            {builder.level ? <span>{LEVEL_LABELS[builder.level]}</span> : null}
            {builder.weeklyHours ? <span>{COMMITMENT_LABELS[builder.weeklyHours]}</span> : null}
          </div>

          {builder.skills.length > 0 ? <TechnologyStack items={builder.skills} max={5} compact className="mt-3" /> : null}

          {insight ? (
            <div className="mt-3 max-w-[720px] rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-3 py-2.5 text-[12px] leading-5">
              <span className="font-medium text-[var(--bc-ink)]">Dlaczego warto porozmawiać: </span>
              <span className="text-[var(--bc-muted)]">{insight}</span>
            </div>
          ) : builder.lookingFor.length > 0 ? (
            <p className="mt-3 text-[12px] leading-5 text-[var(--bc-muted)]">{builder.lookingFor.map((item) => LOOKING_FOR_LABELS[item]).join(" · ")}</p>
          ) : null}

          {builder.interests.length > 0 ? <p className="mt-2 text-[11px] leading-4 text-[var(--bc-faint)]">{builder.interests.slice(0, 3).join(" · ")}</p> : null}

          <div className="mt-4 flex flex-wrap items-center gap-3 xl:hidden">
            {action}
            <Link href={`/builders/${builder.userId}`} className="inline-flex min-h-9 items-center gap-1.5 text-[13px] font-medium text-[var(--bc-ink)] transition-colors hover:text-[#799c25] hover:underline dark:hover:text-[#c8f169]">
              Zobacz profil <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {score !== null ? (
          <div className="hidden xl:block xl:text-right">
            <div className="rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-4 py-3">
              <p className={`text-[26px] font-semibold leading-7 tabular-nums tracking-[-0.025em] ${strongMatch ? "text-[#9dca38] dark:text-[#c8f169]" : "text-[var(--bc-ink)]"}`}>{score}%</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">dopasowania</p>
            </div>
          </div>
        ) : <div className="hidden xl:block" />}

        <div className="hidden xl:flex xl:flex-col xl:items-end xl:justify-center xl:gap-3">
          {action}
          <Link href={`/builders/${builder.userId}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-[6px] border border-[var(--bc-line)] px-3 text-[13px] font-medium text-[var(--bc-ink)] transition-colors hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface)] hover:text-[#799c25] dark:hover:text-[#c8f169]">
            Zobacz profil <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
