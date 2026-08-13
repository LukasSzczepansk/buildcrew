import Link from "next/link";
import { ArrowRight, Clock3, ExternalLink, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
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
  return (
    <article className="group border-b border-[#d8d8d0] py-5 first:border-t dark:border-neutral-700">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_170px] md:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href={`/projects/${project.id}`} className="text-[17px] font-semibold tracking-[-0.015em] text-neutral-950 hover:underline dark:text-neutral-50">
              {project.name}
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="h-1.5 w-1.5 bg-[#a7d841]" />
              {STAGE_LABELS[project.stage]}
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">{project.tagline}</p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
            {project.openRoles.length > 0 ? (
              <span><span className="font-medium text-neutral-800 dark:text-neutral-200">Szukamy:</span> {project.openRoles.slice(0, 3).map((role) => ROLE_LABELS[role.roleType]).join(" · ")}</span>
            ) : (
              <span>Ekipa kompletna</span>
            )}
            {project.technologies.length > 0 ? <span>{project.technologies.slice(0, 5).join(" · ")}</span> : null}
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 md:flex-col md:items-end md:justify-between">
          <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
            <div className="flex -space-x-1.5" aria-label="Członkowie projektu">
              {project.members.slice(0, 3).map((member) => (
                <Avatar key={member.userId} emoji={member.profile?.avatarEmoji ?? "🙂"} size="sm" className="h-6 w-6 border-2 border-[#f4f4ef] text-[11px] dark:border-[#11110f]" />
              ))}
            </div>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {Math.max(project.members.length, 1)}</span>
            {project.commitment ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> {COMMITMENT_LABELS[project.commitment]}</span> : null}
          </div>

          <div className="flex items-center gap-3">
            <ShareProjectButton projectId={project.id} projectName={project.name} compact />
            <Link href={`/p/${project.id}`} aria-label="Publiczna strona projektu" title="Publiczna strona projektu" className="text-neutral-400 transition-colors hover:text-neutral-950 dark:hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></Link>
            <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-950 hover:underline dark:text-neutral-100">
              Otwórz <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
