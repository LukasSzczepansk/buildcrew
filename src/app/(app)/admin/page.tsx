import type { Metadata } from "next";
import Link from "next/link";
import { Activity, FileQuestion, Flag, FolderKanban, Users, UsersRound } from "lucide-react";
import { AdminStatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAdminOverview } from "@/server/data/admin";

export const metadata: Metadata = { title: "Admin — BuildCrew" };

function date(value: Date) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}

export default async function AdminPage() {
  const data = await getAdminOverview();
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={Users} label="Użytkownicy" value={data.users} helper={`${data.suspendedUsers} zawieszonych`} />
        <AdminStatCard icon={FolderKanban} label="Projekty" value={data.projects} helper={`${data.applications} zgłoszeń do projektów`} />
        <AdminStatCard icon={UsersRound} label="Ekipy" value={data.crews} helper="Crew utworzone w Build Pool" />
        <AdminStatCard icon={Flag} label="Otwarte zgłoszenia" value={data.openReports} helper="Wymagają sprawdzenia" />
        <AdminStatCard icon={FileQuestion} label="Pytania" value={data.questions} helper={`${data.answers} odpowiedzi`} />
        <AdminStatCard icon={Activity} label="Akcje produktu / 7 dni" value={data.events7d} helper="Eventy zapisane w analytics_events" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
            <div>
              <h2 className="font-semibold">Najnowsze zgłoszenia</h2>
              <p className="text-xs text-neutral-400">Priorytet dla moderacji.</p>
            </div>
            <Link href="/admin/reports" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">Zobacz wszystkie</Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.recentReports.length ? data.recentReports.map((report) => (
              <div key={report.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{report.reported?.username ?? report.reported?.email ?? "Użytkownik"}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">{report.reason} · zgłosił {report.reporter?.username ?? "użytkownik"}</p>
                </div>
                <div className="text-right">
                  <Badge variant={report.status === "open" ? "destructive" : "secondary"}>{report.status}</Badge>
                  <p className="mt-1 text-[11px] text-neutral-400">{date(report.createdAt)}</p>
                </div>
              </div>
            )) : <p className="px-5 py-8 text-center text-sm text-neutral-400">Brak zgłoszeń.</p>}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
            <div>
              <h2 className="font-semibold">Nowi użytkownicy</h2>
              <p className="text-xs text-neutral-400">Ostatnie utworzone konta.</p>
            </div>
            <Link href="/admin/users" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">Użytkownicy</Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.avatarEmoji ?? "🙂"} {user.username ?? "Bez profilu"}</p>
                  <p className="truncate text-xs text-neutral-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.isSuspended ? <Badge variant="destructive">Zawieszony</Badge> : <Badge variant="success">Aktywny</Badge>}
                  <span className="text-[11px] text-neutral-400">{date(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
          <div>
            <h2 className="font-semibold">Ostatnie działania administratorów</h2>
            <p className="text-xs text-neutral-400">Log zmian wykonanych z panelu.</p>
          </div>
          <Link href="/admin/activity" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">Pełny log</Link>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {data.recentEvents.length ? data.recentEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
              <div><span className="font-medium">{event.action}</span> <span className="text-neutral-400">· {event.targetType}</span></div>
              <div className="text-xs text-neutral-400">{event.adminEmail ?? "admin"} · {date(event.createdAt)}</div>
            </div>
          )) : <p className="px-5 py-8 text-center text-sm text-neutral-400">Log administracyjny jest jeszcze pusty.</p>}
        </div>
      </Card>
    </div>
  );
}
