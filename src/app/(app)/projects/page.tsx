import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filters/filter-bar";
import { ProjectCard } from "@/components/projects/project-card";
import { INTEREST_OPTIONS, ALL_SKILLS } from "@/lib/constants";
import { labelsFor } from "@/lib/constants-i18n";
import { internationalLabels, COUNTRY_OPTIONS, PROJECT_LANGUAGE_OPTIONS, PROJECT_MARKET_SCOPE_OPTIONS, PROJECT_NEED_OPTIONS } from "@/lib/international";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/lib/site-server";
import { computeProjectMatch } from "@/lib/project-matching";
import { getProfileByUserId } from "@/server/data/profiles";
import { listProjects } from "@/server/data/projects";
import type { Commitment, Level, ProjectLanguage, ProjectMarketScope, ProjectNeed, RoleType, Stage } from "@/db/schema";

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
  const intl = internationalLabels(locale);
  const params = await searchParams;

  const [myProfile, projects] = await Promise.all([
    getProfileByUserId(user.id),
    listProjects({
      role: params.role as RoleType | undefined,
      technology: params.technology,
      level: params.level as Level | undefined,
      interest: params.interest,
      commitment: params.commitment as Commitment | undefined,
      stage: params.stage as Stage | undefined,
      projectLanguage: params.language as ProjectLanguage | undefined,
      marketScope: params.market as ProjectMarketScope | undefined,
      need: params.need as ProjectNeed | undefined,
      country: params.country,
      search: params.q,
    }, user.id),
  ]);
  if (!myProfile) redirect("/onboarding");

  const ranked = projects
    .map((project) => {
      const match = computeProjectMatch({
        role: myProfile.role,
        level: myProfile.level,
        weeklyHours: myProfile.weeklyHours,
        skills: myProfile.skills,
        interests: myProfile.interests,
        languages: myProfile.languages,
        country: myProfile.country,
        workModePreference: myProfile.workModePreference,
      }, {
        commitment: project.commitment,
        interests: project.interests,
        technologies: project.technologies,
        collaborationMode: project.collaborationMode,
        projectLanguage: project.projectLanguage,
        country: project.country,
        marketScope: project.marketScope,
        openRoles: project.openRoles.map((role) => ({ roleType: role.roleType, preferredLevel: role.preferredLevel, skills: role.skills })),
      }, locale);
      return { project, ...match };
    })
    .sort((a, b) => b.score - a.score || new Date(b.project.updatedAt).getTime() - new Date(a.project.updatedAt).getTime());

  const stageLinks: Array<{ label: string; stage?: Stage }> = [
    { label: en ? "For you" : "Dla Ciebie" },
    { label: en ? "Planning" : "Planowanie", stage: "DESIGN" },
    { label: en ? "Building" : "W budowie", stage: "BUILDING" },
    { label: en ? "Testing" : "Testowanie", stage: "TESTING" },
    { label: en ? "Launched" : "Uruchomione", stage: "LAUNCHED" },
  ];

  return (
    <div>
      <Topbar
        title={en ? "Projects" : "Projekty"}
        subtitle={en ? "Projects ranked by how well they fit your skills, availability, language and preferred way of working." : "Projekty uporządkowane według dopasowania do Twoich umiejętności, dostępności, języka i sposobu pracy."}
      />

      <div className="flex flex-col gap-3 border-b border-[var(--bc-line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 text-[13px] font-medium">
          {stageLinks.map((item) => {
            const active = item.stage ? params.stage === item.stage : !params.stage;
            const href = item.stage ? `/projects?stage=${item.stage}` : "/projects";
            return <Link key={item.label} href={href} className={`rounded-[6px] px-3 py-2 transition-colors ${active ? "bg-[var(--bc-accent-soft)] text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:bg-[var(--bc-surface-subtle)] hover:text-[var(--bc-ink)]"}`}>{item.label}</Link>;
          })}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/my-projects">{en ? "My projects" : "Moje projekty"}</Link></Button>
          <Button asChild size="sm"><Link href="/projects/new">{en ? "Create project" : "Dodaj projekt"}</Link></Button>
        </div>
      </div>

      <div className="mt-5">
        <FilterBar
          showSearch
          searchPlaceholder={en ? "Search projects, roles or technologies" : "Szukaj projektu, roli lub technologii"}
          filters={[
            { key: "role", label: en ? "Role" : "Rola", options: Object.entries(labels.roles).map(([value, label]) => ({ value, label })) },
            { key: "technology", label: en ? "Technology" : "Technologia", options: ALL_SKILLS.map((s) => ({ value: s, label: s })) },
            { key: "language", label: en ? "Project language" : "Język projektu", options: PROJECT_LANGUAGE_OPTIONS.map((value) => ({ value, label: intl.projectLanguage[value] })) },
            { key: "market", label: en ? "Reach" : "Zasięg", options: PROJECT_MARKET_SCOPE_OPTIONS.map((value) => ({ value, label: intl.marketScope[value] })) },
            { key: "need", label: en ? "Needs" : "Potrzebuje", options: PROJECT_NEED_OPTIONS.map((value) => ({ value, label: intl.needs[value] })) },
            { key: "country", label: en ? "Country" : "Kraj", options: COUNTRY_OPTIONS.map((country) => ({ value: country, label: country })) },
            { key: "level", label: en ? "Level" : "Poziom", options: Object.entries(labels.levels).map(([value, label]) => ({ value, label })) },
            { key: "interest", label: en ? "Area" : "Obszar", options: INTEREST_OPTIONS.map((i) => ({ value: i, label: i })) },
            { key: "commitment", label: en ? "Time" : "Czas", options: Object.entries(labels.commitments).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>

      {ranked.length === 0 ? (
        <div className="mt-6 border-y border-[var(--bc-line)] py-7">
          <h2 className="text-[16px] font-semibold">{en ? "No project matches these filters yet" : "Na razie żaden projekt nie pasuje do tych filtrów"}</h2>
          <p className="mt-1 max-w-[620px] text-sm leading-5 text-[var(--bc-muted)]">
            {en ? "Try broader filters or meet people who are open to building something new." : "Poszerz filtry albo poznaj osoby otwarte na zbudowanie czegoś nowego."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/builders" className="inline-flex h-9 items-center rounded-[6px] bg-[var(--bc-accent)] px-3.5 text-sm font-medium text-[#111]">{en ? "Find people" : "Znajdź ludzi"}</Link>
            <Link href="/projects/new" className="inline-flex h-9 items-center rounded-[6px] border border-[var(--bc-line-strong)] px-3.5 text-sm font-medium">{en ? "Start a project" : "Utwórz projekt"}</Link>
          </div>
        </div>
      ) : (
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.015em]">{params.stage ? (en ? "Matching projects" : "Pasujące projekty") : (en ? "Recommended for you" : "Polecane dla Ciebie")}</h2>
              <p className="mt-0.5 text-[12px] text-[var(--bc-faint)]">{en ? "Best matches appear first." : "Najlepsze dopasowania są wyżej."}</p>
            </div>
            <span className="text-[13px] tabular-nums text-[var(--bc-faint)]">
              {ranked.length} {en ? (ranked.length === 1 ? "project" : "projects") : (ranked.length === 1 ? "projekt" : "projektów")}
            </span>
          </div>
          <div className="space-y-2.5">{ranked.map(({ project, score, reasons }) => <ProjectCard key={project.id} project={project} locale={locale} matchScore={score} matchReasons={reasons} />)}</div>
        </section>
      )}
    </div>
  );
}
