import type { Metadata } from "next";
import { ExternalLink, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { siteUrlForLocale } from "@/lib/site-config";
import { getProjectById } from "@/server/data/projects";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getRequestLocale()]);
  const project = await getProjectById(id);
  return {
    title: project ? `${project.name} · BuildCrew` : `${locale === "en" ? "Project" : "Projekt"} · BuildCrew`,
    robots: { index: false, follow: false },
  };
}

export default async function ProjectEmbedWidget({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, locale] = await Promise.all([params, getRequestLocale()]);
  const project = await getProjectById(id);
  const en = locale === "en";

  if (!project) {
    return (
      <div className="flex min-h-[120px] items-center justify-center p-4 text-center text-[13px] text-[var(--bc-faint)]">
        {en ? "This project is not available." : "Ten projekt jest niedostępny."}
      </div>
    );
  }

  const labels = labelsFor(locale);
  const baseUrl = siteUrlForLocale(locale);
  const publicUrl = `${baseUrl}/p/${project.id}`;
  const crewSize = Math.max(project.members.length, project.owner ? 1 : 0);
  const totalSlots = project.roles.reduce((sum, role) => sum + role.slots, 0) + 1;

  return (
    <div className="p-4 sm:p-5">
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start justify-between gap-3 no-underline"
      >
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-5 text-[var(--bc-ink)]">{project.name}</p>
          {project.tagline ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-[var(--bc-muted)]">{project.tagline}</p>
          ) : null}
        </div>
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--bc-faint)]" />
      </a>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">{labels.stages[project.stage]}</Badge>
        {project.lifecycleStatus === "COMPLETED" ? (
          <Badge variant="success">{en ? "Completed" : "Ukończony"}</Badge>
        ) : project.lifecycleStatus === "PAUSED" ? (
          <Badge variant="outline">{en ? "Paused" : "Wstrzymany"}</Badge>
        ) : null}
      </div>

      {project.technologies.length ? (
        <TechnologyStack items={project.technologies} max={4} compact className="mt-3" />
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-[var(--bc-line)] pt-3 text-[12px] text-[var(--bc-faint)]">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {crewSize}/{Math.max(totalSlots, crewSize)}
        </span>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--bc-ink)] no-underline">
          BuildCrew
        </a>
      </div>
    </div>
  );
}
