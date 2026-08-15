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
import { listCompletedProjects } from "@/server/data/social-projects";

export const metadata: Metadata = { title: "Showcase — BuildCrew" };

export default async function ShowcasePage({ searchParams }: { searchParams: Promise<{ tab?: string; category?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const tab = (["popular", "new", "week", "month"] as const).includes(params.tab as ShowcaseTab) ? (params.tab as ShowcaseTab) : "popular";
  const [entries, completedProjects] = await Promise.all([
    listShowcaseEntries({ tab, category: params.category || undefined, viewerId: user?.id }),
    listCompletedProjects(6),
  ]);
  const tabs: [ShowcaseTab, string][] = [["popular", "Popularne"], ["new", "Najnowsze"], ["week", "Tydzień"], ["month", "Miesiąc"]];

  return (
    <div>
      <Topbar title="Zbudowane" subtitle="Efekty pracy ludzi poznanych na BuildCrew oraz projekty pokazane społeczności." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4">
        <div className="flex flex-wrap gap-2">{tabs.map(([value, label]) => <Button key={value} asChild size="sm" variant={tab === value ? "default" : "outline"}><Link href={`/showcase?tab=${value}${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}`}>{label}</Link></Button>)}</div>
        <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href="/showcase/challenges"><Trophy className="h-4 w-4" /> Challenges</Link></Button><Button asChild size="sm"><Link href="/showcase/new"><Plus className="h-4 w-4" /> Pokaż projekt</Link></Button></div>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1"><Button asChild size="sm" variant={!params.category ? "secondary" : "ghost"}><Link href={`/showcase?tab=${tab}`}>Wszystkie</Link></Button>{Object.entries(SHOWCASE_CATEGORY_LABELS).map(([value, label]) => <Button key={value} asChild size="sm" variant={params.category === value ? "secondary" : "ghost"}><Link href={`/showcase?tab=${tab}&category=${value}`}>{label}</Link></Button>)}</div>
      {completedProjects.length ? (
        <section className="mb-8">
          <div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="text-[18px] font-semibold tracking-[-0.015em]">Ukończone na BuildCrew</h2><p className="mt-1 text-[12px] leading-4 text-[var(--bc-muted)]">Projekty zamknięte przez zespoły. Credits wynikają z realnego składu projektu w chwili ukończenia.</p></div></div>
          <div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">
            {completedProjects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="grid gap-2 py-4 hover:bg-[var(--bc-surface-subtle)] md:grid-cols-[minmax(0,1fr)_180px_110px] md:items-center"><div className="min-w-0"><p className="text-sm font-semibold">{project.name}</p><p className="mt-1 bc-truncate-2 text-[12px] leading-4 text-[var(--bc-muted)]">{project.outcome || project.tagline}</p></div><p className="text-[12px] text-[var(--bc-muted)]">{project.ownerUsername} · {project.credits} {project.credits === 1 ? "osoba" : "osób"}</p><p className="text-[11px] text-[var(--bc-faint)] md:text-right">{project.completedAt ? project.completedAt.toLocaleDateString("pl-PL", { month: "short", year: "numeric" }) : "ukończony"}</p></Link>)}
          </div>
        </section>
      ) : null}

      {entries.some((entry) => entry.isDemo) ? <div className="mb-5 rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-4 py-3 text-[13px] text-[var(--bc-muted)]"><span className="font-semibold text-[var(--bc-ink)]">Demo</span> oznacza przykładową zawartość.</div> : null}
      {entries.length === 0 ? <EmptyState title="Jeszcze nie ma projektów w tej sekcji." description="Jeśli masz działające MVP, eksperyment albo projekt solo — pokaż go społeczności i zbierz feedback." ctaLabel="Dodaj pierwszy projekt" ctaHref="/showcase/new" /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{entries.map((entry) => <ShowcaseCard key={entry.id} currentUserId={user?.id} entry={{ ...entry, viewerReactions: Array.from(entry.viewerReactions) }} />)}</div>}
    </div>
  );
}
