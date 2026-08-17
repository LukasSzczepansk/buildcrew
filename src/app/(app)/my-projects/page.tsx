import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FolderKanban, RefreshCw, UsersRound } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProjectIdentityMark } from "@/components/projects/project-identity-mark";
import { Button } from "@/components/ui/button";
import { TechnologyStack } from "@/components/ui/technology-badge";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { getProjectFreshness } from "@/lib/project-freshness";
import { getRequestLocale } from "@/lib/site-server";
import { listApplicationsForProject } from "@/server/data/applications";
import { listProjectsForMember, listProjectsForOwner } from "@/server/data/projects";
import { refreshProjectRecruitmentAction } from "@/server/actions/projects";
import type { AppLocale } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "My projects - BuildCrew" };
}

type View = "owned" | "joined";
type Labels = ReturnType<typeof labelsFor>;

export default async function MyProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getRequestLocale();
  const labels = labelsFor(locale);

  const params = await searchParams;
  const view: View = params.view === "joined" ? "joined" : "owned";

  const [owned, allMemberships] = await Promise.all([
    listProjectsForOwner(user.id),
    listProjectsForMember(user.id),
  ]);
  const joined = allMemberships.filter((project) => project.ownerId !== user.id);

  const pendingByProject = new Map<string, number>();
  await Promise.all(owned.map(async (project) => {
    const applications = await listApplicationsForProject(project.id);
    pendingByProject.set(project.id, applications.filter((item) => item.status === "PENDING").length);
  }));

  return (
    <div>
      <Topbar title="My projects" subtitle="Projects you lead and teams you belong to, all in one place." />

      <nav aria-label="My projects view" className="mb-5 flex items-center gap-6 border-b border-[var(--bc-line)]">
        <TabLink href="/my-projects?view=owned" active={view === "owned"} count={owned.length} ariaLabel={`${owned.length} projects`}>
          Leading
        </TabLink>
        <TabLink href="/my-projects?view=joined" active={view === "joined"} count={joined.length} ariaLabel={`${joined.length} projects`}>
          Member
        </TabLink>
      </nav>

      {view === "owned" ? (
        <OwnedProjects projects={owned} pendingByProject={pendingByProject} locale={locale} labels={labels} />
      ) : (
        <JoinedProjects projects={joined} userId={user.id} labels={labels} />
      )}
    </div>
  );
}

function TabLink({ href, active, count, children, ariaLabel }: { href: string; active: boolean; count: number; children: React.ReactNode; ariaLabel: string }) {
  return (
    <Link href={href} className={`relative flex min-h-10 items-center gap-2 pb-3 text-sm font-medium transition-colors ${active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>
      <span>{children}</span>
      <span className={`text-[12px] ${active ? "text-[var(--bc-ink)]" : "text-[var(--bc-faint)]"}`} aria-label={ariaLabel}>{count}</span>
      {active ? <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--bc-accent)]" /> : null}
    </Link>
  );
}

function OwnedProjects({ projects, pendingByProject, locale, labels }: {
  projects: Awaited<ReturnType<typeof listProjectsForOwner>>;
  pendingByProject: Map<string, number>;
  locale: AppLocale;
  labels: Labels;
}) {
  if (!projects.length) {
    return <EmptyState title="You are not leading a project yet." description="Create a project, describe who you need, and start meeting people who can help you build it." actionHref="/projects/new" actionLabel="Create project" />;
  }

  return (
    <section aria-labelledby="owned-projects-heading">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <h2 id="owned-projects-heading" className="text-[15px] font-semibold text-[var(--bc-ink)]">Projects you lead</h2>
          <p className="mt-1 text-[13px] text-[var(--bc-muted)]">Applications and recruiting activity that need your attention appear first.</p>
        </div>
      </div>

      <div className="border-y border-[var(--bc-line)]">
        {projects.map((project, index) => {
          const pending = pendingByProject.get(project.id) ?? 0;
          const memberCount = Math.max(project.members.length, 1);
          const openRoleCount = project.openRoles.length;
          const openSlots = project.openRoles.reduce((sum, role) => sum + Math.max(0, role.open ?? 0), 0);
          const freshness = getProjectFreshness(project.updatedAt, new Date(), locale);
          const staleRecruitment = project.lifecycleStatus === "ACTIVE" && openSlots > 0 && freshness.stale;
          const openRoleNames = project.openRoles.slice(0, 2).map((role) => labels.roles[role.roleType]).join(", ");

          return (
            <article key={project.id} className={`grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_220px_150px] lg:items-center ${index > 0 ? "border-t border-[var(--bc-line)]" : ""}`}>
              <div className="flex min-w-0 gap-3.5">
                <ProjectIdentityMark name={project.name} tagline={project.tagline} projectType={project.projectType} technologies={project.technologies} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <Link href={`/projects/${project.id}`} className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--bc-ink)] hover:underline">{project.name}</Link>
                    <span className="text-[11px] font-medium text-[var(--bc-faint)]">{labels.stages[project.stage]}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 max-w-[700px] text-[13px] leading-5 text-[var(--bc-muted)]">{project.tagline}</p>
                  <TechnologyStack items={project.technologies} max={3} compact className="mt-2.5 gap-1.5" />
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--bc-faint)]">
                    <span className="inline-flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5" strokeWidth={1.7} />{memberCount} {memberCount === 1 ? "person" : "people"}</span>
                    {openRoleCount > 0 ? <span>Looking for: <span className="text-[var(--bc-muted)]">{openRoleNames}{openRoleCount > 2 ? ` +${openRoleCount - 2}` : ""}</span></span> : <span>Team complete</span>}
                    {openSlots === 1 ? <span className="rounded-[5px] bg-[#C8F169] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-neutral-950">Last spot</span> : null}
                    {openRoleCount > 0 ? <span className={staleRecruitment ? "font-medium text-amber-700 dark:text-amber-300" : ""}>{freshness.shortLabel}</span> : null}
                  </div>
                </div>
              </div>

              <div className="lg:border-l lg:border-[var(--bc-line)] lg:pl-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">{pending > 0 ? "Needs review" : openRoleCount > 0 ? "Recruiting" : "Team"}</p>
                {pending > 0 ? (
                  <>
                    <p className="mt-1.5 text-sm font-semibold text-[var(--bc-ink)]">{pending} {pending === 1 ? "new application" : "new applications"}</p>
                    <Link href={`/projects/${project.id}/applications`} className="mt-1 inline-flex text-[12px] font-medium text-[var(--bc-muted)] underline decoration-[var(--bc-line-strong)] underline-offset-4 hover:text-[var(--bc-ink)]">Review applications</Link>
                  </>
                ) : openRoleCount > 0 ? (
                  <>
                    <p className="mt-1.5 text-sm font-medium text-[var(--bc-ink)]">{staleRecruitment ? "Still looking for people?" : `${openRoleCount} ${openRoleCount === 1 ? "open role" : "open roles"}`}</p>
                    <p className={`mt-1 line-clamp-2 text-[12px] ${staleRecruitment ? "text-amber-700 dark:text-amber-300" : "text-[var(--bc-muted)]"}`}>{staleRecruitment ? freshness.label : openRoleNames}</p>
                    {staleRecruitment ? <form action={refreshProjectRecruitmentAction} className="mt-2"><input type="hidden" name="projectId" value={project.id} /><Button type="submit" variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-[12px]"><RefreshCw className="h-3.5 w-3.5" />Still recruiting</Button></form> : null}
                  </>
                ) : (
                  <><p className="mt-1.5 text-sm font-medium text-[var(--bc-ink)]">Team complete</p><p className="mt-1 text-[12px] text-[var(--bc-muted)]">No open roles.</p></>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button asChild variant="outline" size="sm"><Link href={`/projects/${project.id}`}>View</Link></Button>
                <Button asChild size="sm"><Link href={`/projects/${project.id}/manage`}>Manage <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function JoinedProjects({ projects, userId, labels }: {
  projects: Awaited<ReturnType<typeof listProjectsForMember>>;
  userId: string;
  labels: Labels;
}) {
  if (!projects.length) {
    return <EmptyState title="You are not a member of another project yet." description="Browse projects and find a team that needs your skills." actionHref="/projects" actionLabel="Browse projects" />;
  }

  return (
    <section aria-labelledby="joined-projects-heading">
      <div className="mb-3">
        <h2 id="joined-projects-heading" className="text-[15px] font-semibold text-[var(--bc-ink)]">Teams you belong to</h2>
        <p className="mt-1 text-[13px] text-[var(--bc-muted)]">Projects where you are already building with other people.</p>
      </div>

      <div className="border-y border-[var(--bc-line)]">
        {projects.map((project, index) => {
          const membership = project.members.find((member) => member.userId === userId);
          const roleLabel = membership?.roleType ? labels.roles[membership.roleType] : "Team member";
          const memberCount = Math.max(project.members.length, 1);

          return (
            <article key={project.id} className={`grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_190px_150px] lg:items-center ${index > 0 ? "border-t border-[var(--bc-line)]" : ""}`}>
              <div className="flex min-w-0 gap-3.5">
                <ProjectIdentityMark name={project.name} tagline={project.tagline} projectType={project.projectType} technologies={project.technologies} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><Link href={`/projects/${project.id}`} className="text-[15px] font-semibold text-[var(--bc-ink)] hover:underline">{project.name}</Link><span className="text-[11px] font-medium text-[var(--bc-faint)]">{labels.stages[project.stage]}</span></div>
                  <p className="mt-1 line-clamp-1 max-w-[700px] text-[13px] leading-5 text-[var(--bc-muted)]">{project.tagline}</p>
                  <TechnologyStack items={project.technologies} max={3} compact className="mt-2.5 gap-1.5" />
                </div>
              </div>

              <div className="lg:border-l lg:border-[var(--bc-line)] lg:pl-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bc-faint)]">Your role</p>
                <p className="mt-1.5 text-sm font-medium text-[var(--bc-ink)]">{roleLabel}</p>
                <p className="mt-1 text-[12px] text-[var(--bc-muted)]">{memberCount} {memberCount === 1 ? "person" : "people"} on the team</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button asChild size="sm"><Link href={`/projects/${project.id}`}>Open project <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EmptyState({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref: string; actionLabel: string }) {
  return (
    <section className="border-y border-[var(--bc-line)] py-8">
      <div className="flex max-w-[760px] items-start justify-between gap-5">
        <div className="flex items-start gap-3"><FolderKanban className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bc-faint)]" strokeWidth={1.7} /><div><p className="text-sm font-medium text-[var(--bc-ink)]">{title}</p><p className="mt-1 text-[13px] leading-5 text-[var(--bc-muted)]">{description}</p></div></div>
        <Button asChild variant="outline" size="sm" className="shrink-0"><Link href={actionHref}>{actionLabel}</Link></Button>
      </div>
    </section>
  );
}
