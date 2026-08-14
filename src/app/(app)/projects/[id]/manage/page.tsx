import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ProjectTeamManager } from "@/components/projects/project-team-manager";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { listApplicationsForProject } from "@/server/data/applications";
import { getProjectById } from "@/server/data/projects";

export const metadata: Metadata = {
  title: "Zarządzaj projektem — BuildCrew",
  robots: { index: false, follow: false },
};

export default async function ManageProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();
  if (project.ownerId !== user.id) redirect(`/projects/${id}`);

  const applications = await listApplicationsForProject(id);
  const pending = applications.filter((item) => item.status === "PENDING").length;
  const nonOwnerMembers = project.members.filter((member) => !member.isOwner).length;

  return (
    <div>
      <Topbar />

      <header className="border-b border-[var(--bc-line)] pb-5">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3"><Link href="/my-projects"><ArrowLeft className="h-3.5 w-3.5" /> Moje projekty</Link></Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Zarządzanie projektem</p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-[var(--bc-ink)]">{project.name}</h1>
            <p className="mt-2 max-w-[700px] text-[13px] leading-5 text-[var(--bc-muted)]">Zespół, zgłoszenia i bieżąca praca nad projektem w jednym miejscu.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link href={`/p/${id}`} target="_blank">Publiczny widok <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
        </div>
      </header>

      <nav className="flex gap-6 overflow-x-auto border-b border-[var(--bc-line)]" aria-label="Zarządzanie projektem">
        <ManageTab href={`/projects/${id}`} label="Podgląd" />
        <ManageTab href={`/projects/${id}/manage`} label="Zespół" active />
        <ManageTab href={`/projects/${id}/applications`} label={`Zgłoszenia${pending ? ` (${pending})` : ""}`} />
        <ManageTab href={`/projects/${id}/workspace`} label="Workspace" />
      </nav>

      <div className="mt-7 grid gap-9 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main>
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-[var(--bc-ink)]">Zespół</h2>
            <p className="mt-1 max-w-[680px] text-[12px] leading-5 text-[var(--bc-muted)]">Tylko twórca projektu może usuwać osoby z zespołu. Po usunięciu członek traci dostęp do prywatnego workspace&apos;u.</p>
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
          <section className="border-b border-[var(--bc-line)] pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Stan projektu</p>
            <dl className="mt-3 space-y-3 text-[12px]">
              <Summary label="Zespół" value={`${nonOwnerMembers + 1} osób`} />
              <Summary label="Nowe zgłoszenia" value={String(pending)} />
              <Summary label="Otwarte role" value={String(project.openRoles.length)} />
            </dl>
          </section>

          <section className="border-b border-[var(--bc-line)] pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Otwarte role</p>
            <div className="mt-3 space-y-2">
              {project.openRoles.length ? project.openRoles.map((role) => (
                <div key={role.id} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-[var(--bc-ink)]">{ROLE_LABELS[role.roleType]}</span>
                  <span className="text-[var(--bc-faint)]">{role.open} wolne</span>
                </div>
              )) : <p className="text-[12px] text-[var(--bc-muted)]">Ekipa jest kompletna.</p>}
            </div>
          </section>

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Skróty</p>
            <div className="mt-2 flex flex-col items-start gap-1">
              <Link href={`/projects/${id}/applications`} className="text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">Przejdź do zgłoszeń</Link>
              <Link href={`/projects/${id}/workspace`} className="text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">Otwórz workspace</Link>
              <Link href={`/builders`} className="text-[12px] text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline">Znajdź kolejne osoby</Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ManageTab({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return <Link href={href} className={`relative shrink-0 py-3 text-[12px] font-medium ${active ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"}`}>{label}{active ? <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[var(--bc-accent)]" /> : null}</Link>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-[var(--bc-muted)]">{label}</dt><dd className="font-medium text-[var(--bc-ink)]">{value}</dd></div>;
}
