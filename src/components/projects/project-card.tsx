import Link from "next/link";
import { ArrowRight, Clock3, ExternalLink, Globe2, Tags, UsersRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { labelsFor } from "@/lib/constants-i18n";
import type { AppLocale } from "@/lib/site-config";
import type { Character, Commitment, ProjectType, RoleType, Stage } from "@/db/schema";
import { ShareProjectButton } from "@/components/projects/share-project-button";
import { activityLabel, getActivityState } from "@/lib/activity";
import { getProjectFreshness } from "@/lib/project-freshness";
import {
  inferProjectCategoryLabel,
  inferProjectVisualKind,
  ProjectIdentityMark,
} from "@/components/projects/project-identity-mark";

export type ProjectCardData = {
  id: string;
  name: string;
  tagline: string;
  stage: Stage;
  updatedAt: Date | string;
  commitment: Commitment | null;
  technologies: string[];
  projectType?: ProjectType | null;
  character?: Character[] | null;
  openRoles: { id: string; roleType: RoleType; open?: number }[];
  members: { userId: string; profile: { avatarEmoji: string; username?: string } | null }[];
  owner: { avatarEmoji: string; username: string; lastActiveAt?: Date | string | null } | null;
};

export function ProjectCard({ project, locale = "pl" }: { project: ProjectCardData; locale?: AppLocale }) {
  const labels = labelsFor(locale);
  const en = locale === "en";
  const visibleRoles = project.openRoles.slice(0, 2);
  const remainingRoles = Math.max(0, project.openRoles.length - visibleRoles.length);
  const teamSize = Math.max(project.members.length, 1);
  const visibleMembers = project.members.slice(0, 3);
  const visualKind = inferProjectVisualKind(project);
  const categoryLabel = inferProjectCategoryLabel(visualKind, locale);
  const typeLabel = project.projectType ? labels.projectTypes[project.projectType] : inferTypeLabel(visualKind, locale);
  const characterLabel = project.character?.[0] ? labels.characters[project.character[0]] : null;
  const identityLabels = uniqueLabels([typeLabel, categoryLabel, characterLabel]).slice(0, 3);
  const openSlots = project.openRoles.reduce((sum, role) => sum + Math.max(1, role.open ?? 1), 0);
  const ownerActivity = getActivityState(project.owner?.lastActiveAt);
  const freshness = getProjectFreshness(project.updatedAt, new Date(), locale);

  return (
    <article className="group overflow-hidden rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] transition-colors hover:border-[var(--bc-line-strong)]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <ProjectIdentityMark
              name={project.name}
              tagline={project.tagline}
              projectType={project.projectType}
              technologies={project.technologies}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-[18px] font-semibold tracking-[-0.025em] text-[var(--bc-ink)] hover:underline sm:text-[19px]"
                >
                  {project.name}
                </Link>
                <span className="inline-flex h-6 items-center gap-1.5 rounded-[6px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-2 text-[11px] font-medium text-[var(--bc-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--bc-accent)]" />
                  {labels.stages[project.stage]}
                </span>
              </div>

              {identityLabels.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {identityLabels.map((label, index) => (
                    <IdentityChip key={label} label={label} index={index} />
                  ))}
                </div>
              ) : null}

              <p className="bc-truncate-2 mt-2.5 max-w-[720px] text-sm leading-5 text-[var(--bc-muted)] sm:text-[14px]">
                {project.tagline}
              </p>

              {project.technologies.length > 0 ? (
                <TechnologyStack items={project.technologies} max={4} compact className="mt-3 gap-1.5" />
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--bc-line)] lg:border-l lg:border-t-0">
          <div className="flex h-full flex-col justify-center gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-faint)]">{en ? "Looking for" : "Szukamy"}</p>
                <div className="mt-1.5 flex min-h-7 flex-wrap items-center gap-1.5">
                  {openSlots === 1 ? <span className="inline-flex h-6 items-center rounded-[5px] bg-[#C8F169] px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-950">{en ? "Last spot" : "Ostatnie miejsce"}</span> : null}
                  {visibleRoles.length > 0 ? (
                    <>
                      {visibleRoles.map((role) => (
                        <span key={role.id} className="text-sm font-semibold text-[var(--bc-ink)]">
                          {labels.roles[role.roleType]}
                        </span>
                      ))}
                      {remainingRoles > 0 ? (
                        <span className="text-[12px] font-medium text-[var(--bc-muted)]">+{remainingRoles}</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-[var(--bc-ink)]">{en ? "Team complete" : "Ekipa kompletna"}</span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-[var(--bc-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {project.commitment ? labels.commitments[project.commitment] : en ? "Flexible" : "Do ustalenia"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
                    {teamSize}
                  </span>
                  {project.owner?.lastActiveAt && ownerActivity !== "INACTIVE" && ownerActivity !== "UNKNOWN" ? <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--bc-accent-strong)]" />Owner: {activityLabel(project.owner.lastActiveAt, locale).toLowerCase()}</span> : null}
                  <span className={`inline-flex items-center gap-1.5 ${freshness.stale && openSlots > 0 ? "font-medium text-amber-700 dark:text-amber-300" : ""}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${freshness.recent ? "bg-[var(--bc-accent-strong)]" : freshness.stale && openSlots > 0 ? "bg-amber-400" : "bg-[var(--bc-line-strong)]"}`} />
                    {freshness.shortLabel}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center -space-x-2">
                {visibleMembers.length > 0 ? (
                  visibleMembers.map((member) => (
                    <Avatar
                      key={member.userId}
                      username={member.profile?.username ?? "Builder"}
                      seed={member.userId}
                      size="sm"
                      className="h-8 w-8 border-2 border-[var(--bc-surface)] text-[11px]"
                    />
                  ))
                ) : project.owner ? (
                  <Avatar
                    username={project.owner.username}
                    seed={project.id}
                    size="sm"
                    className="h-8 w-8 border-2 border-[var(--bc-surface)] text-[11px]"
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ShareProjectButton
                projectId={project.id}
                projectName={project.name}
                projectTagline={project.tagline}
                openRoles={project.openRoles}
                compact
              />

              <Link
                href={`/p/${project.id}`}
                aria-label={`${en ? "Open public project page" : "Otwórz publiczną stronę projektu"} ${project.name}`}
                title={en ? "Public link" : "Publiczny link"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] text-[var(--bc-faint)] transition-colors hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>

              <Link
                href={`/projects/${project.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-[var(--bc-ink)] px-3.5 text-[13px] font-medium text-[var(--bc-surface)] transition-opacity hover:opacity-85"
              >
                {en ? "View" : "Zobacz"}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function IdentityChip({ label, index }: { label: string; index: number }) {
  const Icon = index === 0 ? Globe2 : Tags;

  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-[6px] border border-[var(--bc-line)] px-2 text-[11px] font-medium text-[var(--bc-muted)]">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

function inferTypeLabel(kind: ReturnType<typeof inferProjectVisualKind>, locale: AppLocale) {
  const en = locale === "en";
  switch (kind) {
    case "mobile":
      return en ? "Mobile app" : "Aplikacja mobilna";
    case "devtool":
      return "Developer tool";
    case "opensource":
      return "Open source";
    case "marketplace":
      return "Marketplace";
    case "game":
      return en ? "Game" : "Gra";
    case "community":
      return "Community";
    default:
      return en ? "Web app" : "Aplikacja webowa";
  }
}

function uniqueLabels(values: Array<string | null | undefined>) {
  return values.filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index);
}
