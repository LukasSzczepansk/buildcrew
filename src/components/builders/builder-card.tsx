import Link from "next/link";
import { ArrowRight, Clock3, Globe2, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { LOOKING_FOR_LABELS } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import type { AppLocale } from "@/lib/site-config";
import { activityLabel, getActivityState } from "@/lib/activity";
import { opportunityStatusLabel } from "@/lib/opportunities";
import { locationLabel } from "@/lib/countries";
import type { Commitment, Level, LookingFor, RoleType, WorkModePreference } from "@/db/schema";

export type BuilderCardData = {
  userId: string;
  username: string;
  headline?: string | null;
  avatarEmoji: string;
  role: RoleType | null;
  level: Level | null;
  weeklyHours: Commitment | null;
  skills: string[];
  interests: string[];
  lookingFor: LookingFor[];
  languages?: string[];
  country?: string | null;
  city?: string | null;
  workModePreference?: WorkModePreference | null;
  isDemo?: boolean;
  lastActiveAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export function BuilderCard({ builder, action, matchScore, matchReasons = [], locale = "pl" }: { builder: BuilderCardData; action?: React.ReactNode; matchScore?: number; matchReasons?: string[]; locale?: AppLocale }) {
  const labels = labelsFor(locale);
  const en = locale === "en";
  const opportunityStatus = opportunityStatusLabel(builder.lookingFor, locale);
  const createdAt = builder.createdAt ? new Date(builder.createdAt) : null;
  const isNew = createdAt && !Number.isNaN(createdAt.getTime()) && Date.now() - createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
  const activityState = getActivityState(builder.lastActiveAt);
  const activityColor = activityState === "TODAY" ? "bg-[#9bc432]" : activityState === "THIS_WEEK" ? "bg-amber-400" : "bg-neutral-400 dark:bg-neutral-600";
  const score = typeof matchScore === "number" ? Math.min(100, Math.max(0, matchScore)) : null;
  const strongMatch = score !== null && score >= 70;
  const matchLabel = score === null ? null : score >= 80 ? (en ? "Strong match" : "Bardzo dobre") : score >= 60 ? (en ? "Good match" : "Dobre") : (en ? "Possible match" : "Możliwe");
  const insights = matchReasons.length ? matchReasons.slice(0, 2) : (builder.lookingFor.length > 0 ? builder.lookingFor.map((item) => locale === "en" ? labels.lookingFor[item] : LOOKING_FOR_LABELS[item]).slice(0, 2) : [en ? "Check the profile and your shared signals." : "Sprawdź profil i zobacz, co Was łączy."]);

  return (
    <article className="bc-lift group rounded-[var(--bc-radius-lg)] border border-[var(--bc-line)] bg-[var(--bc-surface)] shadow-[var(--bc-shadow-xs)]">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <Link href={`/builders/${builder.userId}`} aria-label={`${en ? "Profile" : "Profil"} ${builder.username}`} className="shrink-0">
              <Avatar username={builder.username} seed={builder.userId} className="h-14 w-14 text-[19px]" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <Link href={`/builders/${builder.userId}`} className="truncate text-[18px] font-semibold tracking-[-0.018em] text-[var(--bc-ink)] hover:underline">{builder.username}</Link>
                {isNew ? <span className="rounded-full bg-[var(--bc-accent-soft)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--bc-accent-ink)]">{en ? "New" : "Nowy"}</span> : null}
                {builder.isDemo ? <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">BuildCrew Lab</span> : null}
              </div>
              <p className="mt-0.5 truncate text-[14px] text-[var(--bc-muted)]">{builder.headline || (builder.role ? labels.roles[builder.role] : "Builder")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--bc-muted)]">
                <span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${activityColor}`} />{activityLabel(builder.lastActiveAt, locale)}</span>
                {opportunityStatus ? <span className="font-medium text-[var(--bc-ink)]">{opportunityStatus}</span> : null}
                {builder.weeklyHours ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" aria-hidden="true" />{labels.commitments[builder.weeklyHours]}</span> : null}
                {(builder.city || builder.country) ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-[var(--bc-faint)]" aria-hidden="true" />{locationLabel(builder.city, builder.country)}</span> : null}
                {builder.languages?.length ? <span className="inline-flex items-center gap-1"><Globe2 className="h-3 w-3" aria-hidden="true" />{builder.languages.slice(0, 2).join(", ")}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
            {score !== null ? (
              <span
                className={`inline-flex h-10 items-center gap-1.5 rounded-[var(--bc-radius)] px-3 text-[13px] font-semibold tabular-nums ${strongMatch ? "bg-[var(--bc-accent)] text-[#1c1b17]" : "border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] text-[var(--bc-ink)]"}`}
                title={matchLabel ?? undefined}
              >
                {score}% <span className="font-medium opacity-80">{en ? "match" : "dopasowania"}</span>
              </span>
            ) : null}
            {action}
            <Link href={`/builders/${builder.userId}`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--bc-radius)] bg-[#1c1b17] px-3.5 text-sm font-medium text-white shadow-[var(--bc-shadow-sm)] transition-colors hover:bg-[#33312a] dark:bg-[#f2f0e8] dark:text-[#1c1b17]">
              {en ? "View profile" : "Zobacz profil"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {builder.skills.length > 0 || insights.length > 0 ? (
          <div className="mt-4 grid gap-4 border-t border-[var(--bc-line)] pt-4 md:grid-cols-2">
            {builder.skills.length > 0 ? <TechnologyStack items={builder.skills} max={5} compact className="content-start gap-1.5" /> : <div />}
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Why connect" : "Dlaczego warto"}</p>
              <ul className="mt-1.5 space-y-1 text-[13px] leading-5 text-[var(--bc-muted)]">
                {insights.map((reason) => <li key={reason} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--bc-accent-strong)]" aria-hidden="true" /><span>{reason}</span></li>)}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
