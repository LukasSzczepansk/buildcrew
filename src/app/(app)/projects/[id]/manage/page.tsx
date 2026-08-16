import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProjectTeamManager } from "@/components/projects/project-team-manager";
import { ProjectLifecycleControls } from "@/components/projects/project-completion-dialog";
import { ProjectInternationalSettings } from "@/components/projects/project-international-settings";
import { ProjectEnglishContentForm } from "@/components/projects/project-english-content-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { listApplicationsForProject } from "@/server/data/applications";
import { getProjectById } from "@/server/data/projects";
import { listProjectUpdates } from "@/server/data/social-projects";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "Manage project - BuildCrew" : "Manage project - BuildCrew", robots: { index: false, follow: false } }; }

export default async function ManageProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getRequestLocale();
  const en = locale === "en";
  const labels = labelsFor(locale);
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();
  if (project.ownerId !== user.id) redirect(`/projects/${id}`);

  const [applications, updates] = await Promise.all([
    listApplicationsForProject(id),
    listProjectUpdates(id, 30),
  ]);
  const pending = applications.filter((item) => item.status === "PENDING").length;
  const nonOwnerMembers = project.members.filter((member) => !member.isOwner).length;

  return (
    <div>
      <Topbar />

      <header className="border-b border-[var(--bc-line)] pb-5">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3"><Link href="/my-projects"><ArrowLeft className="h-3.5 w-3.5" /> {en ? "My projects" : "My Projects"}</Link></Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">{en ? "Project management" : "Project management"}</p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-[var(--bc-ink)]">{project.name}</h1>
            <p className="mt-2 max-w-[700px] text-sm leading-5 text-[var(--bc-muted)]">{en ? "Team, applications and ongoing work in one place." : "Manage the team, applications, and ongoing project work in one place."}</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link href={`/p/${id}`} target="_blank"> {en ? "Public view" : "Public view"} <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
        </div>
      </header>

      <nav className="flex gap-6 overflow-x-auto border-b border-[var(--bc-line)]" aria-label={en ? "Project management" : "Project management"}>
        <ManageTab href={`/projects/${id}`} label={en ? "Overview" : "Preview"} />
        <ManageTab href={`/projects/${id}/manage`} label={en ? "Team" : "Team"} active />
        <ManageTab href={`/projects/${id}/applications`} label={`${en ? "Applications" : "Applications"}${pending ? ` (${pending})` : ""}`} />
        <ManageTab href={`/projects/${id}/workspace`} label="Workspace" />
      </nav>

      <div className="mt-7">
        <ProjectEnglishContentForm
          projectId={id}
          initial={{
            name: project.name,
            tagline: project.tagline,
            description: project.description,
            goal: project.goal,
            ownerContribution: project.ownerContribution,
            outcome: project.outcome,
            fundingUse: project.fundingUse,
            projectLanguage: project.projectLanguage,
            roles: project.roles.map((role) => ({ id: role.id, roleType: role.roleType, description: role.description })),
            updates: updates.map((update) => ({ id: update.id, body: update.body, kind: update.kind, createdAt: update.createdAt.toISOString() })),
          }}
        />
      </div>

      <div className="mt-7 grid gap-9 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main>
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-[var(--bc-ink)]">{en ? "Team" : "Team"}</h2>
            <p className="mt-1 max-w-[680px] text-[13px] leading-5 text-[var(--bc-muted)]">{en ? "Only the project owner can remove team members. Removed members lose access to the private workspace." : <>Only the project owner can remove people from the team. Once removed, a member loses access to the private workspace.</>}</p>
          </div>
          <ProjectTeamManager
            projectId={id}
            members={project.members.map((member) => ({
              userId: member.userId,
              isOwner: member.isOwner,
              roleType: member.roleType,
              joinedAt: member.joinedAt.toISOString(),
              profile: member.profile ? { username: member.profile.username, role: member.profile.role } : null,
            }))}
          />
        </main>

        <aside className="space-y-6">
          <section className="border-b border-[var(--bc-line)] pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Discovery settings</p>
            <p className="mt-2 text-[12px] leading-4 text-[var(--bc-muted)]">Set reach, location and current needs so the right people can discover the project.</p>
            <div className="mt-4"><ProjectInternationalSettings projectId={id} initial={{ projectLanguage: project.projectLanguage, country: project.country, marketScope: project.marketScope, needs: project.needs, fundingStage: project.fundingStage, fundingAmount: project.fundingAmount, fundingUse: project.fundingUse, pitchDeckUrl: project.pitchDeckUrl }} /></div>
          </section>
          <section className="border-b border-[var(--bc-line)] pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Project status" : "Project status"}</p>
            <dl className="mt-3 space-y-3 text-[13px]">
              <Summary label="Status" value={project.lifecycleStatus === "COMPLETED" ? (en ? "Completed" : "Completed") : project.lifecycleStatus === "PAUSED" ? (en ? "Paused" : "Paused") : (en ? "Active" : "Active")} />
              <Summary label={en ? "Team" : "Team"} value={`${nonOwnerMembers + 1} people`} />
              <Summary label={en ? "New applications" : "New applications"} value={String(pending)} />
              <Summary label={en ? "Open roles" : "Open roles"} value={String(project.openRoles.length)} />
            </dl>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Project lifecycle" : "Project lifecycle"}</p>
            <p className="mt-2 text-[12px] leading-4 text-[var(--bc-muted)]">{en ? "Pause an inactive project or complete it when the team has shipped a result. Completion saves contributor credits." : "Pause an inactive project or complete it when the team has delivered a result. Completion saves contributor credits."}</p>
            <ProjectLifecycleControls projectId={id} status={project.lifecycleStatus} />
          </section>

          <section className="border-b border-[var(--bc-line)] pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Open roles" : "Open roles"}</p>
            <div className="mt-3 space-y-2">
              {project.openRoles.length ? project.openRoles.map((role) => (
                <div key={role.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-[var(--bc-ink)]">{labels.roles[role.roleType]}</span>
                  <span className="text-[var(--bc-faint)]">{role.open} {en ? (role.open === 1 ? "open" : "open") : "wolne"}</span>
                </div>
              )) : <p className="text-[13px] text-[var(--bc-muted)]">{en ? "The team is complete." : "The team is complete."}</p>}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">{en ? "Shortcuts" : "Shortcuts"}</p>
            <div className="mt-2 flex flex-col items-start gap-1">
              <Link href={`/projects/${id}/applications`} className="text-[13px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">{en ? "Open applications" : "Go to applications"}</Link>
              <Link href={`/projects/${id}/workspace`} className="text-[13px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">{en ? "Open workspace" : "Open workspace"}</Link>
              <Link href={`/builders`} className="text-[13px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">{en ? "Find more people" : "Find more people"}</Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ManageTab({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return <Link href={href} className={`relative shrink-0 py-3 text-[13px] font-medium ${active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>{label}{active ? <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[var(--bc-accent)]" /> : null}</Link>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-[var(--bc-muted)]">{label}</dt><dd className="font-medium text-[var(--bc-ink)]">{value}</dd></div>;
}
