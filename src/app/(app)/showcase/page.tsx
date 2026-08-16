import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { ShowcaseCard } from "@/components/showcase/showcase-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { labelsFor } from "@/lib/constants-i18n";
import { getRequestLocale } from "@/lib/site-server";
import { listShowcaseEntries, type ShowcaseTab } from "@/server/data/showcase";
import { listCompletedProjects } from "@/server/data/social-projects";

export async function generateMetadata(): Promise<Metadata> { const locale = await getRequestLocale(); return { title: locale === "en" ? "Built - BuildCrew" : "Showcase - BuildCrew" }; }

export default async function ShowcasePage({ searchParams }: { searchParams: Promise<{ tab?: string; category?: string }> }) {
  const user = await getCurrentUser(); const locale = await getRequestLocale(); const en = locale === "en"; const labels = labelsFor(locale);
  const params = await searchParams; const tab = (["popular", "new", "week", "month"] as const).includes(params.tab as ShowcaseTab) ? (params.tab as ShowcaseTab) : "popular";
  const [entries, completedProjects] = await Promise.all([listShowcaseEntries({ tab, category: params.category || undefined, viewerId: user?.id }), listCompletedProjects(6)]);
  const tabs: [ShowcaseTab, string][] = [["popular", en ? "Popular" : "Popularne"], ["new", en ? "Newest" : "Najnowsze"], ["week", en ? "This week" : "Week"], ["month", en ? "This month" : "Month"]];

  return <div><Topbar title={en ? "Built" : "Built"} subtitle={en ? "Products and experiments built by people from BuildCrew, plus projects shared with the community." : "Work created by people who met on BuildCrew, plus projects shared with the community."} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface)] p-4"><div className="flex flex-wrap gap-2">{tabs.map(([value, label]) => <Button key={value} asChild size="sm" variant={tab === value ? "default" : "outline"}><Link href={`/showcase?tab=${value}${params.category ? `&category=${encodeURIComponent(params.category)}` : ""}`}>{label}</Link></Button>)}</div><div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href="/showcase/challenges"><Trophy className="h-4 w-4" /> Challenges</Link></Button><Button asChild size="sm"><Link href="/showcase/new"><Plus className="h-4 w-4" /> {en ? "Share a project" : "Show project"}</Link></Button></div></div>
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1"><Button asChild size="sm" variant={!params.category ? "secondary" : "ghost"}><Link href={`/showcase?tab=${tab}`}>{en ? "All" : "All"}</Link></Button>{Object.entries(labels.showcaseCategories).map(([value, label]) => <Button key={value} asChild size="sm" variant={params.category === value ? "secondary" : "ghost"}><Link href={`/showcase?tab=${tab}&category=${value}`}>{label}</Link></Button>)}</div>
    {completedProjects.length ? <section className="mb-8"><div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="text-[18px] font-semibold tracking-[-0.015em]">{en ? "Completed on BuildCrew" : "Completed on BuildCrew"}</h2><p className="mt-1 text-[12px] leading-4 text-[var(--bc-muted)]">{en ? "Projects completed by real teams. Credits reflect the project team at the time it was completed." : "Projects completed by teams. Credits reflect the actual project team at the time of completion."}</p></div></div><div className="divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{completedProjects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="grid gap-2 py-4 hover:bg-[var(--bc-surface-subtle)] md:grid-cols-[minmax(0,1fr)_180px_110px] md:items-center"><div className="min-w-0"><p className="text-sm font-semibold">{project.name}</p><p className="mt-1 bc-truncate-2 text-[12px] leading-4 text-[var(--bc-muted)]">{project.outcome || project.tagline}</p></div><p className="text-[12px] text-[var(--bc-muted)]">{project.ownerUsername} · {project.credits} {en ? (project.credits === 1 ? "person" : "people") : (project.credits === 1 ? "person" : "people")}</p><p className="text-[11px] text-[var(--bc-faint)] md:text-right">{project.completedAt ? project.completedAt.toLocaleDateString(en ? "en-GB" : "en-US", { month: "short", year: "numeric" }) : (en ? "completed" : "completed")}</p></Link>)}</div></section> : null}
    {entries.some((entry) => entry.isDemo) ? <div className="mb-5 rounded-[8px] border border-[var(--bc-line)] bg-[var(--bc-surface-subtle)] px-4 py-3 text-[13px] text-[var(--bc-muted)]"><span className="font-semibold text-[var(--bc-ink)]">Demo</span> {en ? "marks example content." : "marks demo content."}</div> : null}
    {entries.length === 0 ? <EmptyState title={en ? "No projects here yet." : "There are no projects in this section yet."} description={en ? "If you have a working MVP, experiment or solo project, share it with the community and get feedback." : "If you have a working MVP, experiment, or solo project, share it with the community and collect feedback."} ctaLabel={en ? "Share the first project" : "Add the first project"} ctaHref="/showcase/new" /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{entries.map((entry) => <ShowcaseCard key={entry.id} currentUserId={user?.id} entry={{ ...entry, viewerReactions: Array.from(entry.viewerReactions) }} />)}</div>}
  </div>;
}
