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

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
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
      <Topbar title="Projekty" subtitle="Znajdź coś, co warto zbudować." />

      <FilterBar
        showSearch
        filters={[
          { key: "role", label: "Rola", options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "technology", label: "Technologie", options: ALL_SKILLS.map((s) => ({ value: s, label: s })) },
          { key: "level", label: "Poziom", options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "interest", label: "Zainteresowania", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
          { key: "commitment", label: "Czas w tygodniu", options: Object.entries(COMMITMENT_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "stage", label: "Etap", options: Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label })) },
        ]}
      />

      {projects.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="🧩"
          title="Jeszcze nic tu nie pasuje. Może zamiast czekać znajdziesz ekipę i zaczniecie od zera?"
          ctaLabel="Przejdź do Build Pool"
          ctaHref="/build"
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
