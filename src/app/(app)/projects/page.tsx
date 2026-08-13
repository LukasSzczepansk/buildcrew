import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FilterBar } from "@/components/filters/filter-bar";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/empty-state";
import { COMMITMENT_LABELS, INTEREST_OPTIONS, LEVEL_LABELS, ROLE_LABELS, STAGE_LABELS, ALL_SKILLS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { listProjects } from "@/server/data/projects";
import type { Commitment, Level, RoleType, Stage } from "@/db/schema";

export const metadata: Metadata = { title: "Projekty — BuildCrew" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;

  const projects = await listProjects({
    role: params.role as RoleType | undefined,
    technology: params.technology,
    level: params.level as Level | undefined,
    interest: params.interest,
    commitment: params.commitment as Commitment | undefined,
    stage: params.stage as Stage | undefined,
    search: params.q,
  }, user.id);

  return (
    <div>
      <Topbar title="Projekty" subtitle="Aktywne projekty, które szukają współtwórców." />

      <div className="pb-5">
        <FilterBar
          showSearch
          filters={[
            { key: "role", label: "Rola", options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
            { key: "technology", label: "Technologia", options: ALL_SKILLS.map((s) => ({ value: s, label: s })) },
            { key: "level", label: "Poziom", options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
            { key: "interest", label: "Obszar", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
            { key: "commitment", label: "Czas", options: Object.entries(COMMITMENT_LABELS).map(([value, label]) => ({ value, label })) },
            { key: "stage", label: "Etap", options: Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>

      <div className="flex items-center justify-between border-b border-[#d8d8d0] pb-2 text-[11px] text-neutral-400 dark:border-neutral-700">
        <span>{projects.length} {projects.length === 1 ? "projekt" : "projektów"}</span>
        <span className="hidden sm:inline">Nazwa · role · technologie · zespół</span>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Brak projektów pasujących do filtrów."
          description="Zmień filtry albo zacznij od znalezienia ludzi w Build Pool."
          ctaLabel="Przejdź do Build Pool"
          ctaHref="/build"
        />
      ) : (
        <div>{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
      )}
    </div>
  );
}
