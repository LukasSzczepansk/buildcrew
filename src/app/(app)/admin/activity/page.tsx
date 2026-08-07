import type { Metadata } from "next";
import { Activity, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAdminAnalytics, listAdminActivity } from "@/server/data/admin";

export const metadata: Metadata = { title: "Aktywność — Admin BuildCrew" };

const eventLabels: Record<string, string> = {
  profile_created: "Utworzone profile",
  project_created: "Utworzone projekty",
  project_application_sent: "Wysłane zgłoszenia",
  project_application_accepted: "Zaakceptowane zgłoszenia",
  builder_invite_sent: "Zaproszenia builderów",
  crew_invite_sent: "Zaproszenia do crew",
  crew_created: "Utworzone crew",
  crew_converted_to_project: "Crew → projekt",
  contact_revealed: "Ujawnione kontakty",
  question_created: "Utworzone pytania",
  answer_marked_helpful: "Pomocne odpowiedzi",
};

export default async function AdminActivityPage() {
  const [activity, analytics] = await Promise.all([listAdminActivity(), getAdminAnalytics()]);
  const max = Math.max(1, ...analytics.map((a) => a.count));
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <div className="mb-5 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-violet-600"/><div><h2 className="font-semibold">Aktywność produktu</h2><p className="text-xs text-neutral-400">Zdarzenia zapisane przez aplikację.</p></div></div>
        <div className="space-y-4">{analytics.length ? analytics.map((item) => <div key={item.eventType}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span>{eventLabels[item.eventType] ?? item.eventType}</span><span className="font-semibold">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.max(4, Math.round(item.count / max * 100))}%` }}/></div></div>) : <p className="py-8 text-center text-sm text-neutral-400">Brak eventów analytics.</p>}</div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800"><Activity className="h-5 w-5 text-violet-600"/><div><h2 className="font-semibold">Dziennik administracyjny</h2><p className="text-xs text-neutral-400">Historia działań wykonanych przez administratorów.</p></div></div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">{activity.length ? activity.map((row) => <div key={row.id} className="px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge variant="outline">{row.action}</Badge><span className="text-sm">{row.targetType}</span></div><span className="text-xs text-neutral-400">{row.createdAt.toLocaleString("pl-PL")}</span></div><div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-400"><span>Admin: {row.adminEmail ?? "usunięte konto"}</span>{row.targetId ? <span>ID: {row.targetId}</span> : null}</div>{row.details ? <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-50 p-2 text-[11px] text-neutral-500 dark:bg-neutral-800/60">{JSON.stringify(row.details, null, 2)}</pre> : null}</div>) : <p className="p-10 text-center text-sm text-neutral-400">Brak działań administracyjnych.</p>}</div>
      </Card>
    </div>
  );
}
