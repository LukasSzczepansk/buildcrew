import type { Metadata } from "next";
import { Activity, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAdminAnalytics, listAdminActivity } from "@/server/data/admin";

export const metadata: Metadata = { title: "Activity - BuildCrew Admin" };

const eventLabels: Record<string, string> = {
  profile_created: "Created profiles",
  project_created: "Projects created",
  project_application_sent: "Applications sent",
  project_application_accepted: "Applications accepted",
  builder_invite_sent: "Builder invitations",
  crew_invite_sent: "Crew invitations",
  crew_created: "Crews created",
  crew_converted_to_project: "Crew → project",
  contact_revealed: "Contacts revealed",
  question_created: "Questions created",
  answer_marked_helpful: "Helpful answers",
};

export default async function AdminActivityPage() {
  const [activity, analytics] = await Promise.all([listAdminActivity(), getAdminAnalytics()]);
  const max = Math.max(1, ...analytics.map((a) => a.count));
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <div className="mb-5 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-lime-600"/><div><h2 className="font-semibold">Product activity</h2><p className="text-[13px] text-neutral-400">Events recorded by the application.</p></div></div>
        <div className="space-y-4">{analytics.length ? analytics.map((item) => <div key={item.eventType}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span>{eventLabels[item.eventType] ?? item.eventType}</span><span className="font-semibold">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-lime-600" style={{ width: `${Math.max(4, Math.round(item.count / max * 100))}%` }}/></div></div>) : <p className="py-8 text-center text-sm text-neutral-400">No analytics events.</p>}</div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800"><Activity className="h-5 w-5 text-lime-600"/><div><h2 className="font-semibold">Admin log</h2><p className="text-[13px] text-neutral-400">History of actions performed by administrators.</p></div></div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">{activity.length ? activity.map((row) => <div key={row.id} className="px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge variant="outline">{row.action}</Badge><span className="text-sm">{row.targetType}</span></div><span className="text-[13px] text-neutral-400">{row.createdAt.toLocaleString("en-US")}</span></div><div className="mt-2 flex flex-wrap gap-3 text-[13px] text-neutral-400"><span>Admin: {row.adminEmail ?? "deleted account"}</span>{row.targetId ? <span>ID: {row.targetId}</span> : null}</div>{row.details ? <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-50 p-2 text-[12px] text-neutral-500 dark:bg-neutral-800/60">{JSON.stringify(row.details, null, 2)}</pre> : null}</div>) : <p className="p-10 text-center text-sm text-neutral-400">No administrative actions.</p>}</div>
      </Card>
    </div>
  );
}
