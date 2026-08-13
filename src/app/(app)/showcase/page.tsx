import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ShowcaseCard } from "@/components/showcase/showcase-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { SHOWCASE_CATEGORY_LABELS } from "@/lib/constants";
import { listShowcaseEntries, type ShowcaseTab } from "@/server/data/showcase";

export const metadata: Metadata = { title: "Showcase — BuildCrew" };

export default async function ShowcasePage({ searchParams }: { searchParams: Promise<{ tab?: string; category?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const tab = (["popular", "new", "week", "month"] as const).includes(params.tab as ShowcaseTab) ? params.tab as ShowcaseTab : "popular";
  const entries = await listShowcaseEntries({ tab, category: params.category || undefined, viewerId: user?.id });
  const tabs: [ShowcaseTab, string][] = [["popular","🔥 Popularne"],["new","🆕 Najnowsze"],["week","🏆 Tydzień"],["month","📅 Miesiąc"]];

  return <div>
    <Topbar title="Showcase" subtitle="Zobacz, co naprawdę powstaje w społeczności BuildCrew — od pierwszych MVP po projekty rozwijane dalej." />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">{tabs.map(([value,label]) => <Button key={value} asChild size="sm" variant={tab === value ? "default" : "outline"}><Link href={`/showcase?tab=${value}${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}`}>{label}</Link></Button>)}</div>
      <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href="/showcase/challenges"><Trophy className="h-4 w-4" /> Challenges</Link></Button><Button asChild size="sm"><Link href="/showcase/new"><Plus className="h-4 w-4" /> Pokaż projekt</Link></Button></div>
    </div>
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1"><Button asChild size="sm" variant={!params.category ? "secondary" : "ghost"}><Link href={`/showcase?tab=${tab}`}>Wszystkie</Link></Button>{Object.entries(SHOWCASE_CATEGORY_LABELS).map(([value,label]) => <Button key={value} asChild size="sm" variant={params.category === value ? "secondary" : "ghost"}><Link href={`/showcase?tab=${tab}&category=${value}`}>{label}</Link></Button>)}</div>
    {entries.some((entry) => entry.isDemo) ? <div className="mb-5 rounded-[6px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60">Projekty z oznaczeniem <span className="font-semibold text-neutral-700 dark:text-neutral-300">Demo</span> są przykładową zawartością BuildCrew — pokazują, jak może wyglądać Showcase, dopóki nie pojawi się więcej prawdziwych realizacji społeczności.</div> : null}
    {entries.length === 0 ? <EmptyState icon="🚀" title="Jeszcze nie ma projektów w tej sekcji." description="Jeśli masz działające MVP, eksperyment albo projekt solo — pokaż go społeczności i zbierz feedback." ctaLabel="Dodaj pierwszy projekt" ctaHref="/showcase/new" /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{entries.map((entry) => <ShowcaseCard key={entry.id} currentUserId={user?.id} entry={{ ...entry, viewerReactions: Array.from(entry.viewerReactions) }} />)}</div>}
  </div>;
}
