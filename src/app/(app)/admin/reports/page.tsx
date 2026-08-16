import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateReportAction } from "@/server/actions/admin";
import { listAdminReports } from "@/server/data/admin";

export const metadata: Metadata = { title: "Reports - BuildCrew Admin" };

const statusLabel: Record<string, string> = { open: "Open", in_review: "In progress", resolved: "Resolved", dismissed: "Rejected" };
const reasonLabel: Record<string, string> = { spam: "Spam", scam: "Scam / fraud", harassment: "Harassment", inappropriate: "Inappropriate content", other: "Inne" };

export default async function AdminReportsPage() {
  const rows = await listAdminReports();
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold">User reports</h2><p className="text-sm text-neutral-500">Review reports, save moderation notes, and update case status.</p></div>
      <div className="space-y-4">
        {rows.map((report) => (
          <Card key={report.id} className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><Badge variant={report.status === "open" ? "destructive" : report.status === "resolved" ? "success" : "secondary"}>{statusLabel[report.status] ?? report.status}</Badge><Badge variant="outline">{reasonLabel[report.reason] ?? report.reason}</Badge><span className="text-[13px] text-neutral-400">{report.createdAt.toLocaleString("en-US")}</span></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[6px] bg-neutral-50 p-3 dark:bg-neutral-800/50"><p className="text-[13px] text-neutral-400">Reporter</p><div className="mt-2 flex items-center gap-2.5"><Avatar username={report.reporter?.username ?? "No profile"} seed={report.reporter?.id ?? report.reporterId} size="sm" /><div><p className="text-sm font-medium">{report.reporter?.username ?? "No profile"}</p><p className="text-[13px] text-neutral-400">{report.reporter?.email}</p></div></div></div>
                  <div className="rounded-[6px] bg-red-50/60 p-3 dark:bg-red-500/5"><p className="text-[13px] text-neutral-400">Reported user</p><div className="mt-2 flex items-center gap-2.5"><Avatar username={report.reported?.username ?? "No profile"} seed={report.reported?.id ?? report.reportedId} size="sm" /><div><Link href={report.reported ? `/builders/${report.reported.id}` : "#"} className="block text-sm font-medium hover:text-lime-600">{report.reported?.username ?? "No profile"}</Link><p className="text-[13px] text-neutral-400">{report.reported?.email}</p></div></div>{report.reported?.isSuspended ? <Badge variant="destructive" className="mt-2">Account suspended</Badge> : null}</div>
                </div>
                {report.description ? <div className="mt-3 rounded-[6px] border border-neutral-200 p-3 text-sm dark:border-neutral-800"><p className="mb-1 text-[13px] font-medium uppercase tracking-wide text-neutral-400">User description</p>{report.description}</div> : null}
              </div>

              <form action={updateReportAction} className="w-full space-y-3 rounded-[6px] border border-neutral-200 p-4 xl:w-[360px] dark:border-neutral-800">
                <input type="hidden" name="reportId" value={report.id}/>
                <label className="block text-[13px] font-medium text-neutral-500">Status</label>
                <select name="status" defaultValue={report.status} className="h-10 w-full rounded-[6px] border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900">
                  <option value="open">Open</option><option value="in_review">In progress</option><option value="resolved">Resolved</option><option value="dismissed">Rejected</option>
                </select>
                <label className="block text-[13px] font-medium text-neutral-500">Notatka administratora</label>
                <Textarea name="note" defaultValue={report.adminNote ?? ""} placeholder="What was reviewed / what was the decision?" className="min-h-[86px]" />
                <Button type="submit" className="w-full">Save decision</Button>
              </form>
            </div>
          </Card>
        ))}
        {!rows.length ? <Card className="p-10 text-center text-sm text-neutral-400">There are no reports yet.</Card> : null}
      </div>
    </div>
  );
}
