import Link from "next/link";
import { ArrowRight, Clock3, UsersRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ActivityVisual } from "@/components/feed/activity-visual";
import { ProjectFollowButton } from "@/components/projects/project-follow-button";
import type { AppLocale } from "@/lib/site-config";
import type { Commitment, RoleType, Stage } from "@/db/schema";
import { labelsFor } from "@/lib/constants-i18n";
import { countryLabel } from "@/lib/countries";
import { timeAgo } from "@/lib/utils";

export type FeedProjectSpotlightData = {
  id: string;
  name: string;
  tagline: string;
  stage: Stage;
  country?: string | null;
  commitment?: Commitment | null;
  updatedAt: Date | string;
  technologies: string[];
  openRoles: { id: string; roleType: RoleType; open?: number }[];
  members: { userId: string; profile: { avatarEmoji: string; username?: string } | null }[];
  owner: { username: string; avatarEmoji: string } | null;
  viewerFollowing?: boolean;
  viewerCanFollow?: boolean;
  followerCount?: number;
};

export function FeedProjectSpotlightCard({ project, locale }: { project: FeedProjectSpotlightData; locale: AppLocale }) {
  const en = locale === "en";
  const labels = labelsFor(locale);
  const openRole = project.openRoles[0];
  const team = project.members.slice(0, 3);

  return (
    <article className="overflow-hidden rounded-[12px] border border-[var(--bc-line)] bg-[var(--bc-surface)] transition-colors hover:border-[var(--bc-line-strong)]">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ActivityVisual compact title={project.name} label={en ? "Active project" : "Aktywny projekt"} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-accent-strong)]">{en ? "Project spotlight" : "Projekt wart poznania"}</p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--bc-faint)]">{project.owner ? `@${project.owner.username}` : "BuildCrew"} · {timeAgo(project.updatedAt, locale)}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-2.5 py-1 text-[10px] font-medium text-[var(--bc-muted)]">{labels.stages[project.stage]}</span>
        </div>

        <Link href={`/projects/${project.id}`} className="mt-4 block">
          <h3 className="text-[18px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)] sm:text-[20px]">{project.name}</h3>
          <p className="mt-1.5 bc-truncate-2 text-[13px] leading-5 text-[var(--bc-muted)] sm:text-[14px]">{project.tagline}</p>
        </Link>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 5).map((technology) => (
            <span key={technology} className="rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-2 py-1 text-[10px] font-medium text-[var(--bc-muted)] sm:text-[11px]">{technology}</span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-[var(--bc-faint)] sm:text-[12px]">
          {project.country ? <span>{countryLabel(project.country)}</span> : null}
          <span className="inline-flex items-center gap-1"><UsersRound className="h-3.5 w-3.5" />{Math.max(project.members.length, 1)} {en ? "people" : "os."}</span>
          {project.commitment ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{labels.commitments[project.commitment]}</span> : null}
          {openRole ? <span className="font-medium text-[var(--bc-ink)]">{en ? "Looking for" : "Szukają"}: {labels.roles[openRole.roleType]}</span> : <span>{en ? "Team complete" : "Ekipa kompletna"}</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--bc-line)] px-4 py-3 sm:px-5">
        <div className="flex items-center -space-x-2">
          {team.length ? team.map((member) => (
            <Avatar key={member.userId} username={member.profile?.username ?? "Builder"} seed={member.profile?.avatarEmoji || member.userId} size="sm" className="h-7 w-7 border-2 border-[var(--bc-surface)] text-[10px]" />
          )) : project.owner ? <Avatar username={project.owner.username} seed={project.owner.avatarEmoji || project.id} size="sm" className="h-7 w-7 border-2 border-[var(--bc-surface)] text-[10px]" /> : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {project.viewerCanFollow ? <ProjectFollowButton projectId={project.id} initialFollowing={Boolean(project.viewerFollowing)} initialFollowers={project.followerCount ?? 0} compact /> : null}
          <Link href={`/projects/${project.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-[7px] bg-[var(--bc-ink)] px-3.5 text-[12px] font-medium text-[var(--bc-surface)] transition-opacity hover:opacity-85">
            {en ? "View project" : "Zobacz projekt"}<ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
