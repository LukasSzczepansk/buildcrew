import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CheckCircle2, FileQuestion, Flag, FolderKanban, Image as ImageIcon, UserPlus, UserRoundCheck, Users, UsersRound, type LucideIcon } from "lucide-react";
import { AdminStatCard } from "@/components/admin/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAdminOverview } from "@/server/data/admin";

export const metadata: Metadata = { title: "Admin - BuildCrew" };

function date(value: Date) {
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}

export default async function AdminPage() {
  const data = await getAdminOverview();
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={Users} label="Users" value={data.users} helper={`${data.suspendedUsers} zawieszonych`} />
        <AdminStatCard icon={FolderKanban} label="Projects" value={data.projects} helper={`${data.applications} project applications`} />
        <AdminStatCard icon={UsersRound} label="Crews" value={data.crews} helper="Crews created in Build Pool" />
        <AdminStatCard icon={Flag} label="Open reports" value={data.openReports} helper="Need review" />
        <AdminStatCard icon={ImageIcon} label="Photos to moderate" value={data.pendingAvatars} helper="Not public yet" />
        <AdminStatCard icon={FileQuestion} label="Questions" value={data.questions} helper={`${data.answers} answers`} />
        <AdminStatCard icon={Activity} label="Product actions / 7 days" value={data.events7d} helper="Events recorded in analytics_events" />
      </div>

      <section className="border-y border-[var(--bc-line)] py-5">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Collaborations / 7 days</p>
            <h2 className="mt-1 text-[17px] font-semibold">Are people actually starting to build together?</h2>
          </div>
          <Link href="/admin/activity" className="hidden text-[12px] font-medium text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:underline sm:inline">Full events</Link>
        </div>
        <div className="grid gap-px overflow-hidden rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-line)] sm:grid-cols-2 xl:grid-cols-5">
          <FunnelStat icon={Users} value={data.activeUsers7d} label="active people" helper={`+${data.newUsers7d} new accounts`} />
          <FunnelStat icon={UserPlus} value={data.projectApplications7d} label="project applications" helper="real intent to join" />
          <FunnelStat icon={UserRoundCheck} value={data.acceptedApplications7d} label="team acceptances" helper={data.projectApplications7d > 0 ? `${Math.round((data.acceptedApplications7d / data.projectApplications7d) * 100)}% of applications` : "no applications"} />
          <FunnelStat icon={UsersRound} value={data.teamsFormed7d} label="new crews" helper="Build Pool + hackathons" />
          <FunnelStat icon={CheckCircle2} value={data.completedProjects7d} label="completed projects" helper="strongest value signal" />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
            <div>
              <h2 className="font-semibold">Latest applications</h2>
              <p className="text-[13px] text-neutral-400">Moderation priority.</p>
            </div>
            <Link href="/admin/reports" className="text-sm font-medium text-lime-600 hover:underline dark:text-lime-400">View all</Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.recentReports.length ? data.recentReports.map((report) => (
              <div key={report.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{report.reported?.username ?? report.reported?.email ?? "User"}</p>
                  <p className="mt-0.5 truncate text-[13px] text-neutral-500">{report.reason} · applied to {report.reporter?.username ?? "user"}</p>
                </div>
                <div className="text-right">
                  <Badge variant={report.status === "open" ? "destructive" : "secondary"}>{report.status}</Badge>
                  <p className="mt-1 text-[12px] text-neutral-400">{date(report.createdAt)}</p>
                </div>
              </div>
            )) : <p className="px-5 py-8 text-center text-sm text-neutral-400">No applications.</p>}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
            <div>
              <h2 className="font-semibold">New users</h2>
              <p className="text-[13px] text-neutral-400">Recently created accounts.</p>
            </div>
            <Link href="/admin/users" className="text-sm font-medium text-lime-600 hover:underline dark:text-lime-400">Users</Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar username={user.username ?? "No profile"} seed={user.id} size="sm" />
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{user.username ?? "No profile"}</p><p className="truncate text-[13px] text-neutral-400">{user.email}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {user.isSuspended ? <Badge variant="destructive">Zawieszony</Badge> : <Badge variant="success">Active</Badge>}
                  <span className="text-[12px] text-neutral-400">{date(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
          <div>
            <h2 className="font-semibold">Recent administrator actions</h2>
            <p className="text-[13px] text-neutral-400">Log of changes made from the admin panel.</p>
          </div>
          <Link href="/admin/activity" className="text-sm font-medium text-lime-600 hover:underline dark:text-lime-400">Full log</Link>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {data.recentEvents.length ? data.recentEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
              <div><span className="font-medium">{event.action}</span> <span className="text-neutral-400">· {event.targetType}</span></div>
              <div className="text-[13px] text-neutral-400">{event.adminEmail ?? "admin"} · {date(event.createdAt)}</div>
            </div>
          )) : <p className="px-5 py-8 text-center text-sm text-neutral-400">The admin log is still empty.</p>}
        </div>
      </Card>
    </div>
  );
}

function FunnelStat({ icon: Icon, value, label, helper }: { icon: LucideIcon; value: number; label: string; helper: string }) {
  return (
    <div className="bg-[var(--bc-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-4 w-4 text-[var(--bc-muted)]" />
        <span className="text-[22px] font-semibold tabular-nums tracking-[-0.03em]">{value}</span>
      </div>
      <p className="mt-3 text-[12px] font-medium text-[var(--bc-ink)]">{label}</p>
      <p className="mt-1 text-[11px] leading-4 text-[var(--bc-faint)]">{helper}</p>
    </div>
  );
}
