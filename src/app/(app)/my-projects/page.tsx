import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FolderKanban, UsersRound } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, STAGE_LABELS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { listApplicationsForProject } from "@/server/data/applications";
import { listProjectsForMember, listProjectsForOwner } from "@/server/data/projects";

export const metadata: Metadata = { title: "Moje projekty — BuildCrew" };

export default async function MyProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
      <Topbar title="Moje projekty" subtitle="W jednym miejscu: projekty, które prowadzisz, oraz zespoły, do których dołączyłeś." />

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-[var(--bc-ink)]">Utworzone przeze mnie</h2>
            <p className="mt-1 text-[12px] text-[var(--bc-muted)]">Zgłoszenia, zespół i workspace bez szukania projektu w katalogu.</p>
          </div>
          <Button asChild size="sm"><Link href="/projects/new">Dodaj projekt</Link></Button>
        </div>

        {owned.length ? (
          <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
            {owned.map((project) => {
              const pending = pendingByProject.get(project.id) ?? 0;
              return (
                <div key={project.id} className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_170px_180px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/projects/${project.id}`} className="truncate text-[15px] font-semibold text-[var(--bc-ink)] hover:underline">{project.name}</Link>
                      <span className="text-[10px] font-medium text-[var(--bc-faint)]">{STAGE_LABELS[project.stage]}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[12px] text-[var(--bc-muted)]">{project.tagline}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--bc-faint)]">
                      <span className="inline-flex items-center gap-1"><UsersRound className="h-3 w-3" /> {Math.max(project.members.length, 1)} w zespole</span>
                      <span>{project.openRoles.length} {project.openRoles.length === 1 ? "otwarta rola" : "otwarte role"}</span>
                    </div>
                  </div>

                  <div className="border-l-0 md:border-l md:border-[var(--bc-line)] md:pl-5">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--bc-faint)]">Do sprawdzenia</p>
                    <p className={`mt-1 text-[13px] font-medium ${pending ? "text-[var(--bc-ink)]" : "text-[var(--bc-muted)]"}`}>{pending ? `${pending} ${pending === 1 ? "nowe zgłoszenie" : "nowe zgłoszenia"}` : "Brak nowych zgłoszeń"}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Button asChild variant="outline" size="sm"><Link href={`/projects/${project.id}/workspace`}>Workspace</Link></Button>
                    <Button asChild size="sm"><Link href={`/projects/${project.id}/manage`}>Zarządzaj <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-y border-[var(--bc-line)] py-8">
            <div className="flex items-start gap-3">
              <FolderKanban className="mt-0.5 h-4 w-4 text-[var(--bc-faint)]" />
              <div>
                <p className="text-[13px] font-medium text-[var(--bc-ink)]">Nie utworzyłeś jeszcze projektu.</p>
                <p className="mt-1 text-[12px] text-[var(--bc-muted)]">Możesz zacząć od prostego szkicu i uzupełnić resztę później.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-9">
        <div className="mb-3">
          <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-[var(--bc-ink)]">Projekty, w których jestem</h2>
          <p className="mt-1 text-[12px] text-[var(--bc-muted)]">Twoje aktywne zespoły i szybki dostęp do ich workspace&apos;ów.</p>
        </div>

        {joined.length ? (
          <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
            {joined.map((project) => {
              const membership = project.members.find((member) => member.userId === user.id);
              return (
                <div key={project.id} className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_170px] md:items-center">
                  <div className="min-w-0">
                    <Link href={`/projects/${project.id}`} className="text-[14px] font-semibold text-[var(--bc-ink)] hover:underline">{project.name}</Link>
                    <p className="mt-1 line-clamp-1 text-[12px] text-[var(--bc-muted)]">{project.tagline}</p>
                    <p className="mt-2 text-[11px] text-[var(--bc-faint)]">{membership?.roleType ? `Rola: ${ROLE_LABELS[membership.roleType]}` : "Członek zespołu"} · {Math.max(project.members.length, 1)} osób</p>
                  </div>
                  <div className="flex gap-2 md:justify-end">
                    <Button asChild variant="outline" size="sm"><Link href={`/projects/${project.id}`}>Projekt</Link></Button>
                    <Button asChild size="sm"><Link href={`/projects/${project.id}/workspace`}>Workspace</Link></Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-y border-[var(--bc-line)] py-7 text-[12px] text-[var(--bc-muted)]">Nie należysz jeszcze do żadnego projektu poza własnymi.</div>
        )}
      </section>
    </div>
  );
}
