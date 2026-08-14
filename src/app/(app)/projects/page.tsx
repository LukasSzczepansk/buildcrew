import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { FilterBar } from "@/components/filters/filter-bar";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/empty-state";
import { DiscoveryTabs } from "@/components/discovery/discovery-tabs";
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
      <Topbar title="Projekty" subtitle="Sprawdź stack, otwarte role i wymagany czas — bez przeklikiwania każdej karty." />
      <DiscoveryTabs active="projects" />

      <div className="mt-5">
      <FilterBar
        showSearch
        searchPlaceholder="Szukaj projektu lub technologii"
        filters={[
          { key: "role", label: "Rola", options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "technology", label: "Technologia", options: ALL_SKILLS.map((s) => ({ value: s, label: s })) },
          { key: "stage", label: "Etap", options: Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "level", label: "Poziom", options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })) },
          { key: "interest", label: "Obszar", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
          { key: "commitment", label: "Czas", options: Object.entries(COMMITMENT_LABELS).map(([value, label]) => ({ value, label })) },
        ]}
      />
      </div>

      {projects.length === 0 ? (
        <div className="mt-6 border-y border-[var(--bc-line)] py-7">
          <h2 className="text-[16px] font-semibold">Nie widzisz projektu dla siebie?</h2>
          <p className="mt-1 max-w-[620px] text-[13px] leading-5 text-[var(--bc-muted)]">Zobacz pomysły innych osób albo znajdź ludzi o podobnym kierunku i zacznijcie własny projekt.</p>
          <div className="mt-4 flex flex-wrap gap-2"><a href="/ideas" className="inline-flex h-9 items-center rounded-[6px] bg-[var(--bc-accent)] px-3.5 text-[13px] font-medium text-[#111]">Zobacz pomysły</a><a href="/build" className="inline-flex h-9 items-center rounded-[6px] border border-[var(--bc-line-strong)] px-3.5 text-[13px] font-medium">Znajdź ludzi</a></div>
        </div>
      ) : (
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-[18px] font-semibold tracking-[-0.015em]">Otwarte projekty</h2>
            <span className="text-[12px] tabular-nums text-[var(--bc-faint)]">{projects.length} {projects.length === 1 ? "projekt" : "projektów"}</span>
          </div>
          <div className="space-y-2.5">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
        </section>
      )}
    </div>
  );
}
