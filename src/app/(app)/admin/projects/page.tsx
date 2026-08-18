import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { deleteProjectAdminAction } from "@/server/actions/admin";
import { listAdminProjects } from "@/server/data/admin";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Projects - BuildCrew Admin" : "Projekty - BuildCrew Admin" };
}

export default async function AdminProjectsPage() {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const labels = labelsFor(locale);
  const rows = await listAdminProjects();
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold">{en ? "Projects" : "Projekty"}</h2><p className="text-sm text-neutral-500">{en ? "Review published projects, teams, and incoming applications." : "Przeglądaj opublikowane projekty, zespoły i nadchodzące aplikacje."}</p></div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-neutral-50 text-[13px] uppercase tracking-wide text-neutral-400 dark:bg-neutral-900/60"><tr><th className="px-5 py-3">{en ? "Project" : "Projekt"}</th><th className="px-4 py-3">{en ? "Owner" : "Właściciel"}</th><th className="px-4 py-3">{en ? "Stage" : "Etap"}</th><th className="px-4 py-3">{en ? "Team" : "Zespół"}</th><th className="px-4 py-3">{en ? "Applications" : "Aplikacje"}</th><th className="px-4 py-3">{en ? "Time" : "Czas"}</th><th className="px-5 py-3 text-right">{en ? "Actions" : "Akcje"}</th></tr></thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {rows.map((project) => <tr key={project.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30">
                <td className="px-5 py-4"><Link href={`/projects/${project.id}`} className="font-medium hover:text-lime-600">{project.name}</Link><p className="mt-0.5 max-w-md truncate text-[13px] text-neutral-400">{project.tagline}</p></td>
                <td className="px-4 py-4"><p>{project.ownerAvatar ?? "🙂"} {project.ownerUsername ?? (en ? "No profile" : "Brak profilu")}</p>{project.ownerSuspended ? <Badge variant="destructive" className="mt-1">{en ? "Owner suspended" : "Właściciel zawieszony"}</Badge> : null}</td>
                <td className="px-4 py-4"><Badge variant="secondary">{labels.stages[project.stage]}</Badge></td>
                <td className="px-4 py-4"><p>{project.memberCount} {en ? "people" : "os."}</p><p className="text-[13px] text-neutral-400">{project.openRoleDefinitions} {en ? "roles" : "ról"}</p></td>
                <td className="px-4 py-4">{project.applicationCount}</td>
                <td className="px-4 py-4">{project.commitment ? labels.commitments[project.commitment] : "-"}</td>
                <td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/projects/${project.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-[13px] font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"><ExternalLink className="h-3.5 w-3.5"/> {en ? "Open" : "Otwórz"}</Link><form action={deleteProjectAdminAction}><input type="hidden" name="projectId" value={project.id}/><ConfirmSubmit message={en ? `Delete project “${project.name}”? This action cannot be undone.` : `Usunąć projekt „${project.name}”? Tej operacji nie można cofnąć.`} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5"/> {en ? "Delete" : "Usuń"}</ConfirmSubmit></form></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {!rows.length ? <p className="p-10 text-center text-sm text-neutral-400">{en ? "No projects." : "Brak projektów."}</p> : null}
      </Card>
    </div>
  );
}
