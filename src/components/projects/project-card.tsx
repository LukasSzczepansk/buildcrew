import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
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
  openRoles: { roleType: RoleType }[];
  members: { userId: string; profile: { avatarEmoji: string } | null }[];
  owner: { avatarEmoji: string; username: string } | null;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const openRoles = project.openRoles.slice(0, 3).map((role) => ROLE_LABELS[role.roleType]);

  return (
    <article className="group border-b border-[var(--bc-line)] transition-colors first:border-t hover:bg-black/[0.025] dark:hover:bg-white/[0.03]">
      <div className="grid gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_244px] lg:gap-x-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Link href={`/projects/${project.id}`} className="text-[17px] font-semibold leading-6 tracking-[-0.015em] text-[var(--bc-ink)] hover:underline">
              {project.name}
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--bc-line)] px-2 py-1 text-[11px] font-medium text-[var(--bc-muted)]">
              <span className="h-1.5 w-1.5 bg-[#c8f169]" aria-hidden="true" />
              {STAGE_LABELS[project.stage]}
            </span>
          </div>

          <p className="mt-2 max-w-[720px] text-[14px] leading-[21px] text-[var(--bc-muted)]">{project.tagline}</p>

          {project.technologies.length > 0 ? <TechnologyStack items={project.technologies} max={5} compact className="mt-3" /> : null}

          <div className="mt-4 grid gap-3 text-[12px] leading-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="font-medium text-[var(--bc-ink)]">Szukamy</p>
              <p className="mt-1 text-[var(--bc-muted)]">{openRoles.length > 0 ? openRoles.join(" · ") : "Ekipa jest obecnie kompletna"}</p>
            </div>
            <div>
              <p className="font-medium text-[var(--bc-ink)]">Zaangażowanie</p>
              <p className="mt-1 text-[var(--bc-muted)]">{project.commitment ? COMMITMENT_LABELS[project.commitment] : "Do ustalenia"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 lg:items-end">
          <div className="w-full rounded-[10px] border border-[var(--bc-line)] bg-[var(--bc-surface)] px-4 py-3 lg:max-w-[244px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Zespół</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex -space-x-2" aria-label="Członkowie projektu">
                {project.members.slice(0, 4).map((member) => (
                  <Avatar key={member.userId} emoji={member.profile?.avatarEmoji ?? "🙂"} size="sm" className="h-8 w-8 border-2 border-[var(--bc-canvas)] bg-[var(--bc-surface-subtle)] text-[13px]" />
                ))}
              </div>
              <p className="text-[12px] text-[var(--bc-muted)]">{Math.max(project.members.length, 1)} {project.members.length === 1 ? "osoba" : "osoby"}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <ShareProjectButton projectId={project.id} projectName={project.name} compact />
            <Link href={`/p/${project.id}`} aria-label="Publiczna strona projektu" title="Publiczna strona projektu" className="inline-flex min-h-9 items-center text-[var(--bc-faint)] transition-colors hover:text-[var(--bc-ink)]">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/projects/${project.id}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-[6px] border border-[var(--bc-line)] px-3 text-[13px] font-medium text-[var(--bc-ink)] transition-colors hover:border-[var(--bc-line-strong)] hover:bg-[var(--bc-surface)] hover:text-[#799c25] dark:hover:text-[#c8f169]">
              Zobacz projekt <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
