import Link from "next/link";
import { ArrowRight, Clock3, ExternalLink, UsersRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { COMMITMENT_LABELS, ROLE_LABELS, STAGE_LABELS } from "@/lib/constants";
import type { Commitment, RoleType, Stage } from "@/db/schema";
import { ShareProjectButton } from "@/components/projects/share-project-button";

export type ProjectCardData = {
  id: string;
  name: string;
  tagline: string;
  stage: Stage;
  commitment: Commitment | null;
  technologies: string[];
  openRoles: { id: string; roleType: RoleType }[];
  members: { userId: string; profile: { avatarEmoji: string; username?: string } | null }[];
  owner: { avatarEmoji: string; username: string } | null;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const openRoles = project.openRoles.slice(0, 3).map((role) => ROLE_LABELS[role.roleType]);

  return (
    <article className="group rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] transition-colors hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface-subtle)]">
      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(360px,1fr)_230px_190px] xl:items-center xl:gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href={`/projects/${project.id}`} className="text-[17px] font-semibold tracking-[-0.018em] text-[var(--bc-ink)] hover:underline">{project.name}</Link>
            <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--bc-line)] px-2 py-0.5 text-[10px] font-medium text-[var(--bc-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--bc-accent-strong)]" />{STAGE_LABELS[project.stage]}</span>
          </div>
          <p className="bc-truncate-2 mt-1.5 max-w-[720px] text-[13px] leading-5 text-[var(--bc-muted)]">{project.tagline}</p>
          {project.technologies.length > 0 ? <TechnologyStack items={project.technologies} max={5} compact className="mt-3 gap-1.5" /> : null}
        </div>

        <div className="border-t border-[var(--bc-line)] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Szukamy</p>
          <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-5 text-[var(--bc-ink)]">{openRoles.length > 0 ? openRoles.join(" · ") : "Ekipa kompletna"}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--bc-muted)]">
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{project.commitment ? COMMITMENT_LABELS[project.commitment] : "Do ustalenia"}</span>
            <span className="inline-flex items-center gap-1"><UsersRound className="h-3 w-3" />{Math.max(project.members.length, 1)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--bc-line)] pt-4 xl:justify-end xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <div className="flex -space-x-2">
            {project.members.slice(0, 3).map((member) => <Avatar key={member.userId} username={member.profile?.username ?? "Builder"} seed={member.userId} size="sm" className="h-7 w-7 border-2 border-[var(--bc-surface)] text-[10px]" />)}
          </div>
          <div className="flex items-center gap-2">
            <ShareProjectButton projectId={project.id} projectName={project.name} projectTagline={project.tagline} openRoles={project.openRoles} compact />
            <Link href={`/p/${project.id}`} aria-label="Publiczna strona projektu" className="text-[var(--bc-faint)] hover:text-[var(--bc-ink)]"><ExternalLink className="h-3.5 w-3.5" /></Link>
            <Link href={`/projects/${project.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-[7px] bg-neutral-950 px-3.5 text-[13px] font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950">Zobacz <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </div>
    </article>
  );
}
