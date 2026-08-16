import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filters/filter-bar";
import { ProjectCard } from "@/components/projects/project-card";
import { DiscoveryTabs } from "@/components/discovery/discovery-tabs";
import { INTEREST_OPTIONS, ALL_SKILLS } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { listProjects } from "@/server/data/projects";
import type { Commitment, Level, RoleType, Stage } from "@/db/schema";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Projects - BuildCrew" : "Projekty - BuildCrew" };
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getRequestLocale();
  const en = locale === "en";
  const labels = labelsFor(locale);
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
      <Topbar
        title={en ? "Projects" : "Projekty"}
        subtitle={en ? "Check the stack, open roles and expected time commitment without opening every card." : "Sprawdź stack, otwarte role i wymagany czas - bez przeklikiwania każdej karty."}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DiscoveryTabs active="projects" />
        <Button asChild variant="outline" size="sm"><Link href="/my-projects">{en ? "My projects" : "Moje projekty"}</Link></Button>
      </div>

      <div className="mt-5">
        <FilterBar
          showSearch
          searchPlaceholder={en ? "Search projects or technologies" : "Szukaj projektu lub technologii"}
          filters={[
            { key: "role", label: en ? "Role" : "Rola", options: Object.entries(labels.roles).map(([value, label]) => ({ value, label })) },
            { key: "technology", label: en ? "Technology" : "Technologia", options: ALL_SKILLS.map((s) => ({ value: s, label: s })) },
            { key: "stage", label: en ? "Stage" : "Etap", options: Object.entries(labels.stages).map(([value, label]) => ({ value, label })) },
            { key: "level", label: en ? "Level" : "Poziom", options: Object.entries(labels.levels).map(([value, label]) => ({ value, label })) },
            { key: "interest", label: en ? "Area" : "Obszar", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
            { key: "commitment", label: en ? "Time" : "Czas", options: Object.entries(labels.commitments).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>

      {projects.length === 0 ? (
        <div className="mt-6 border-y border-[var(--bc-line)] py-7">
          <h2 className="text-[16px] font-semibold">{en ? "Can’t find a project for you?" : "Nie widzisz projektu dla siebie?"}</h2>
          <p className="mt-1 max-w-[620px] text-sm leading-5 text-[var(--bc-muted)]">
            {en ? "Meet people with a similar direction and start something together, or browse early-stage ideas." : "Zobacz pomysły innych osób albo znajdź ludzi o podobnym kierunku i zacznijcie własny projekt."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/ideas" className="inline-flex h-9 items-center rounded-[6px] bg-[var(--bc-accent)] px-3.5 text-sm font-medium text-[#111]">{en ? "Browse ideas" : "Zobacz pomysły"}</a>
            <a href="/build" className="inline-flex h-9 items-center rounded-[6px] border border-[var(--bc-line-strong)] px-3.5 text-sm font-medium">{en ? "Find people" : "Znajdź ludzi"}</a>
          </div>
        </div>
      ) : (
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-[18px] font-semibold tracking-[-0.015em]">{en ? "Open projects" : "Otwarte projekty"}</h2>
            <span className="text-[13px] tabular-nums text-[var(--bc-faint)]">
              {projects.length} {en ? (projects.length === 1 ? "project" : "projects") : (projects.length === 1 ? "projekt" : "projektów")}
            </span>
          </div>
          <div className="space-y-2.5">{projects.map((project) => <ProjectCard key={project.id} project={project} locale={locale} />)}</div>
        </section>
      )}
    </div>
  );
}
