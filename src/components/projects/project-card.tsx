import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { COMMITMENT_LABELS, ROLE_LABELS, STAGE_LABELS } from "@/lib/constants";
import type { Commitment, RoleType, Stage } from "@/db/schema";

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
    <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold tracking-tight">{project.name}</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{project.tagline}</p>
        </div>
        <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
          {STAGE_LABELS[project.stage]}
        </Badge>
      </div>

      {project.technologies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 4).map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex-1">
        {project.openRoles.length > 0 ? (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">Szukamy</p>
            <div className="flex flex-wrap gap-1.5">
              {project.openRoles.map((r, i) => (
                <Badge key={i}>{ROLE_LABELS[r.roleType]}</Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-400">Zespół obecnie kompletny</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {project.members.slice(0, 3).map((m) => (
              <Avatar
                key={m.userId}
                emoji={m.profile?.avatarEmoji ?? "🙂"}
                size="sm"
                className="border-2 border-white dark:border-neutral-900"
              />
            ))}
          </div>
          {project.commitment && <span className="text-xs text-neutral-400">{COMMITMENT_LABELS[project.commitment]}</span>}
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          Zobacz <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
