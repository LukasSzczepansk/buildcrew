import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getRequestLocale } from "@/lib/site-server";
import { updateReportAction } from "@/server/actions/admin";
import { listAdminReports } from "@/server/data/admin";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Reports - BuildCrew Admin" : "Zgłoszenia - BuildCrew Admin" };
}

const statusLabels = {
  pl: { open: "Otwarte", in_review: "W trakcie", resolved: "Rozwiązane", dismissed: "Odrzucone" },
  en: { open: "Open", in_review: "In progress", resolved: "Resolved", dismissed: "Dismissed" },
} as const;

const reasonLabels = {
  pl: { spam: "Spam", scam: "Oszustwo", harassment: "Nękanie", inappropriate: "Nieodpowiednia treść", other: "Inne" },
  en: { spam: "Spam", scam: "Scam / fraud", harassment: "Harassment", inappropriate: "Inappropriate content", other: "Other" },
} as const;

const targetLabels = {
  pl: { USER: "Użytkownik", PROJECT: "Projekt", MESSAGE: "Wiadomość" },
  en: { USER: "User", PROJECT: "Project", MESSAGE: "Message" },
} as const;

export default async function AdminReportsPage() {
  const locale = await getRequestLocale();
  const en = locale === "en";
  const rows = await listAdminReports();
  const statusLabel = statusLabels[locale];
  const reasonLabel = reasonLabels[locale];
  const targetLabel = targetLabels[locale];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{en ? "Reports" : "Zgłoszenia"}</h2>
        <p className="text-sm text-neutral-500">{en ? "Review profile, project and message reports, save moderation notes, and update case status." : "Przeglądaj zgłoszenia profili, projektów i wiadomości, zapisuj notatki moderacyjne i aktualizuj status sprawy."}</p>
      </div>
      <div className="space-y-4">
        {rows.map((report) => (
          <Card key={report.id} className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={report.status === "open" ? "destructive" : report.status === "resolved" ? "success" : "secondary"}>{statusLabel[report.status as keyof typeof statusLabel] ?? report.status}</Badge>
                  <Badge variant="outline">{targetLabel[report.targetType as keyof typeof targetLabel] ?? report.targetType}</Badge>
                  <Badge variant="outline">{reasonLabel[report.reason as keyof typeof reasonLabel] ?? report.reason}</Badge>
                  <span className="text-[13px] text-neutral-400">{report.createdAt.toLocaleString(en ? "en-US" : "pl-PL")}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[6px] bg-neutral-50 p-3 dark:bg-neutral-800/50">
                    <p className="text-[13px] text-neutral-400">{en ? "Reporter" : "Zgłaszający"}</p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <Avatar username={report.reporter?.username ?? (en ? "No profile" : "Brak profilu")} seed={report.reporter?.id ?? report.reporterId} size="sm" />
                      <div><p className="text-sm font-medium">{report.reporter?.username ?? (en ? "No profile" : "Brak profilu")}</p><p className="text-[13px] text-neutral-400">{report.reporter?.email}</p></div>
                    </div>
                  </div>
                  <div className="rounded-[6px] bg-red-50/60 p-3 dark:bg-red-500/5">
                    <p className="text-[13px] text-neutral-400">{en ? "Reported user" : "Zgłoszony użytkownik"}</p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <Avatar username={report.reported?.username ?? (en ? "No profile" : "Brak profilu")} seed={report.reported?.id ?? report.reportedId} size="sm" />
                      <div><Link href={report.reported ? `/builders/${report.reported.id}` : "#"} className="block text-sm font-medium hover:text-lime-600">{report.reported?.username ?? (en ? "No profile" : "Brak profilu")}</Link><p className="text-[13px] text-neutral-400">{report.reported?.email}</p></div>
                    </div>
                    {report.reported?.isSuspended ? <Badge variant="destructive" className="mt-2">{en ? "Account suspended" : "Konto zawieszone"}</Badge> : null}
                    {report.targetType === "PROJECT" && report.targetId ? <Link href={`/projects/${report.targetId}`} className="mt-2 block text-[12px] font-medium text-lime-700 hover:underline dark:text-lime-400">{en ? "Open reported project" : "Otwórz zgłoszony projekt"}</Link> : null}
                    {report.targetType === "MESSAGE" && report.targetId ? <p className="mt-2 text-[11px] text-neutral-400">{en ? "Reported message ID" : "ID zgłoszonej wiadomości"}: {report.targetId}</p> : null}
                  </div>
                </div>
                {report.description ? <div className="mt-3 rounded-[6px] border border-neutral-200 p-3 text-sm dark:border-neutral-800"><p className="mb-1 text-[13px] font-medium uppercase tracking-wide text-neutral-400">{en ? "Report context" : "Kontekst zgłoszenia"}</p>{report.description}</div> : null}
              </div>

              <form action={updateReportAction} className="w-full space-y-3 rounded-[6px] border border-neutral-200 p-4 xl:w-[360px] dark:border-neutral-800">
                <input type="hidden" name="reportId" value={report.id} />
                <label className="block text-[13px] font-medium text-neutral-500">{en ? "Status" : "Status"}</label>
                <select name="status" defaultValue={report.status} className="h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900">
                  <option value="open">{en ? "Open" : "Otwarte"}</option>
                  <option value="in_review">{en ? "In progress" : "W trakcie"}</option>
                  <option value="resolved">{en ? "Resolved" : "Rozwiązane"}</option>
                  <option value="dismissed">{en ? "Dismissed" : "Odrzucone"}</option>
                </select>
                <label className="block text-[13px] font-medium text-neutral-500">{en ? "Moderator note" : "Notatka moderatora"}</label>
                <Textarea name="note" defaultValue={report.adminNote ?? ""} placeholder={en ? "What was reviewed / what was the decision?" : "Co zostało sprawdzone i jaka była decyzja?"} className="min-h-[86px]" />
                <Button type="submit" className="w-full">{en ? "Save decision" : "Zapisz decyzję"}</Button>
              </form>
            </div>
          </Card>
        ))}
        {!rows.length ? <Card className="p-10 text-center text-sm text-neutral-400">{en ? "There are no reports yet." : "Nie ma jeszcze żadnych zgłoszeń."}</Card> : null}
      </div>
    </div>
  );
}
