import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateReportAction } from "@/server/actions/admin";
import { listAdminReports } from "@/server/data/admin";

export const metadata: Metadata = { title: "Zgłoszenia — Admin BuildCrew" };

const statusLabel: Record<string, string> = { open: "Otwarte", in_review: "W trakcie", resolved: "Rozwiązane", dismissed: "Odrzucone" };
const reasonLabel: Record<string, string> = { spam: "Spam", scam: "Scam / oszustwo", harassment: "Nękanie", inappropriate: "Nieodpowiednie treści", other: "Inne" };

export default async function AdminReportsPage() {
  const rows = await listAdminReports();
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold">Zgłoszenia użytkowników</h2><p className="text-sm text-neutral-500">Przeglądaj zgłoszenia, zapisuj notatkę moderacyjną i zmieniaj status sprawy.</p></div>
      <div className="space-y-4">
        {rows.map((report) => (
          <Card key={report.id} className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><Badge variant={report.status === "open" ? "destructive" : report.status === "resolved" ? "success" : "secondary"}>{statusLabel[report.status] ?? report.status}</Badge><Badge variant="outline">{reasonLabel[report.reason] ?? report.reason}</Badge><span className="text-xs text-neutral-400">{report.createdAt.toLocaleString("pl-PL")}</span></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50"><p className="text-xs text-neutral-400">Zgłaszający</p><p className="mt-1 text-sm font-medium">{report.reporter?.avatarEmoji ?? "🙂"} {report.reporter?.username ?? "Brak profilu"}</p><p className="text-xs text-neutral-400">{report.reporter?.email}</p></div>
                  <div className="rounded-xl bg-red-50/60 p-3 dark:bg-red-500/5"><p className="text-xs text-neutral-400">Zgłoszony</p><Link href={report.reported ? `/builders/${report.reported.id}` : "#"} className="mt-1 block text-sm font-medium hover:text-violet-600">{report.reported?.avatarEmoji ?? "🙂"} {report.reported?.username ?? "Brak profilu"}</Link><p className="text-xs text-neutral-400">{report.reported?.email}</p>{report.reported?.isSuspended ? <Badge variant="destructive" className="mt-2">Konto zawieszone</Badge> : null}</div>
                </div>
                {report.description ? <div className="mt-3 rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800"><p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">Opis użytkownika</p>{report.description}</div> : null}
              </div>

              <form action={updateReportAction} className="w-full space-y-3 rounded-xl border border-neutral-200 p-4 xl:w-[360px] dark:border-neutral-800">
                <input type="hidden" name="reportId" value={report.id}/>
                <label className="block text-xs font-medium text-neutral-500">Status</label>
                <select name="status" defaultValue={report.status} className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900">
                  <option value="open">Otwarte</option><option value="in_review">W trakcie</option><option value="resolved">Rozwiązane</option><option value="dismissed">Odrzucone</option>
                </select>
                <label className="block text-xs font-medium text-neutral-500">Notatka administratora</label>
                <Textarea name="note" defaultValue={report.adminNote ?? ""} placeholder="Co sprawdzono / jaka była decyzja?" className="min-h-[86px]" />
                <Button type="submit" className="w-full">Zapisz decyzję</Button>
              </form>
            </div>
          </Card>
        ))}
        {!rows.length ? <Card className="p-10 text-center text-sm text-neutral-400">Nie ma jeszcze żadnych zgłoszeń.</Card> : null}
      </div>
    </div>
  );
}
