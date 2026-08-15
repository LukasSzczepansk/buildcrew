import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IdeaInterestButton } from "@/components/ideas/idea-interest-button";
import { Topbar } from "@/components/layout/topbar";
import { ROLE_LABELS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getIdeaById } from "@/server/data/projects";
import type { RoleType } from "@/db/schema";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const idea = await getIdeaById(id);
  return { title: idea ? `${idea.name} — pomysł na BuildCrew` : "Pomysł — BuildCrew", description: idea?.tagline };
}

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const idea = await getIdeaById(id, user.id);
  if (!idea) notFound();
  const owner = idea.ownerId === user.id;

  return (
    <div>
      <Topbar title="Pomysł" subtitle="Lekki etap przed pełnym projektem. Najpierw sprawdź zainteresowanie i znajdź ludzi." />
      <main className="mx-auto max-w-[940px]">
        <section className="border-y border-[var(--bc-line)] py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-[720px]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Pomysł · {idea.interestedCount} zainteresowanych</p>
              <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.035em]">{idea.name}</h1>
              <p className="mt-3 text-[15px] leading-7 text-[var(--bc-muted)]">{idea.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-[var(--bc-muted)]">{idea.interests.map((interest) => <span key={interest}>{interest}</span>)}</div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {owner ? <Button asChild><Link href={`/projects/new?fromIdea=${idea.id}`}>Rozwiń w projekt <ArrowRight className="ml-1 h-4 w-4" /></Link></Button> : <IdeaInterestButton ideaId={idea.id} initialInterested={idea.viewerInterested} />}
            </div>
          </div>
        </section>

        <section className="grid gap-8 py-7 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h2 className="text-[16px] font-semibold">Autor pomysłu</h2>
            <Link href={`/builders/${idea.ownerId}`} className="mt-3 flex max-w-[420px] items-center gap-3 border-y border-[var(--bc-line)] py-4 hover:bg-[var(--bc-surface-subtle)]">
              <Avatar username={idea.owner?.username ?? "Builder"} seed={idea.ownerId} />
              <div><p className="text-[14px] font-medium">{idea.owner?.username ?? "Builder"}</p><p className="text-[12px] text-[var(--bc-muted)]">Zobacz profil →</p></div>
            </Link>
          </div>

          <aside className="border-l-0 border-[var(--bc-line)] lg:border-l lg:pl-6">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--bc-faint)]">Co dalej</p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--bc-muted)]">Jeśli kierunek Cię interesuje, zaznacz to. Autor zobaczy Twój profil i może zacząć rozmowę.</p>
            <Button asChild variant="ghost" size="sm" className="mt-3 px-0"><Link href="/build">Znajdź też ludzi w Build Pool →</Link></Button>
          </aside>
        </section>

        {owner ? (
          <section className="border-t border-[var(--bc-line)] pt-7">
            <div className="flex items-end justify-between gap-4"><h2 className="text-[18px] font-semibold">Kto jest zainteresowany</h2><span className="text-[13px] text-[var(--bc-faint)]">{idea.interestedProfiles.length}</span></div>
            {idea.interestedProfiles.length ? <div className="mt-3 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{idea.interestedProfiles.map((person) => <Link key={person.userId} href={`/builders/${person.userId}`} className="flex items-center justify-between gap-4 py-4 hover:bg-[var(--bc-surface-subtle)]"><div className="flex items-center gap-3"><Avatar username={person.username} seed={person.userId} size="sm" /><div><p className="text-sm font-medium">{person.username}</p><p className="text-[12px] text-[var(--bc-muted)]">{person.role ? ROLE_LABELS[person.role as RoleType] : "Builder"}</p></div></div><span className="text-[13px] font-medium">Zobacz profil →</span></Link>)}</div> : <p className="mt-3 border-y border-[var(--bc-line)] py-6 text-sm text-[var(--bc-muted)]">Nikt jeszcze nie zaznaczył zainteresowania. Udostępnij pomysł albo poczekaj na dopasowania.</p>}
          </section>
        ) : null}
      </main>
    </div>
  );
}
