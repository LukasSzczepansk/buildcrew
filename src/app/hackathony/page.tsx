import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/layout/legal-footer";
import { HackathonCard } from "@/components/hackathons/hackathon-card";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/seo";
import { listPublishedHackathons } from "@/server/data/hackathons";

const title = "Hackathony - znajdź zespół | BuildCrew";
const description = "Znajdź osoby jadące na ten sam hackathon, porównaj role i zainteresowania albo pozwól BuildCrew zaproponować uzupełniający się team.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/hackathony" },
  openGraph: { type: "website", locale: "pl_PL", siteName: "BuildCrew", title, description, url: "/hackathony" },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export default async function PublicHackathonsPage() {
  const events = await listPublishedHackathons();
  return (
    <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: `${SITE_URL}/hackathony`, inLanguage: "pl-PL" }} />
      <header className="border-b border-[var(--bc-line)]"><div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10"><Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[var(--bc-accent)]" aria-hidden="true" />BuildCrew</Link><div className="flex items-center gap-2"><Button asChild variant="ghost" size="sm"><Link href="/login">Zaloguj</Link></Button><Button asChild size="sm"><Link href="/signup?next=/hackathons">Załóż konto</Link></Button></div></div></header>
      <main className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="max-w-[820px]"><p className="text-[13px] font-medium text-[var(--bc-muted)]">Find your team · BuildCrew</p><h1 className="mt-3 text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[48px]">Jedziesz na hackathon bez zespołu?</h1><p className="mt-4 max-w-[720px] text-[15px] leading-7 text-[var(--bc-muted)]">Wybierz wydarzenie, ustaw rolę i to, co chcesz budować. BuildCrew pokaże osoby z tej samej puli oraz teamy, którym brakuje Twoich umiejętności.</p><div className="mt-6 flex flex-wrap gap-2"><Button asChild><Link href="/signup?next=/hackathons">Znajdź zespół</Link></Button><Button asChild variant="outline"><Link href="/projekty">Zobacz projekty</Link></Button></div></div>
        <section className="mt-12"><div className="flex items-end justify-between gap-4"><div><h2 className="text-[20px] font-semibold">Hackathony na BuildCrew</h2><p className="mt-1 text-sm text-[var(--bc-muted)]">Dołączenie do puli BuildCrew nie zastępuje oficjalnej rejestracji na wydarzenie.</p></div><span className="text-[12px] text-[var(--bc-faint)]">{events.length} wydarzeń</span></div><div className="mt-4 border-t border-[var(--bc-line-strong)]">{events.map((event) => <HackathonCard key={event.id} event={event} href={`/hackathony/${event.slug}`} />)}</div>{!events.length ? <div className="border-y border-[var(--bc-line)] py-8 text-sm text-[var(--bc-muted)]">Nie ma jeszcze opublikowanych wydarzeń. Dodamy je, gdy będą realne hackathony z potwierdzonymi informacjami.</div> : null}</section>
        <section className="mt-12 grid gap-6 border-t border-[var(--bc-line-strong)] pt-8 md:grid-cols-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">01</p><h3 className="mt-2 text-[16px] font-semibold">Wybierz event</h3><p className="mt-1 text-sm leading-6 text-[var(--bc-muted)]">Każdy hackathon ma osobną pulę ludzi. Nie mieszasz się z przypadkowymi profilami.</p></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">02</p><h3 className="mt-2 text-[16px] font-semibold">Ustaw rolę i kierunek</h3><p className="mt-1 text-sm leading-6 text-[var(--bc-muted)]">Frontend, Backend, UI/UX, Data/AI, Product - plus stack, zainteresowania i dostępność.</p></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">03</p><h3 className="mt-2 text-[16px] font-semibold">Zbierz team</h3><p className="mt-1 text-sm leading-6 text-[var(--bc-muted)]">Przeglądaj osoby samodzielnie albo pozwól BuildCrew zaproponować skład i wysłać zaproszenia.</p></div></section>
        <LegalFooter className="mt-14" />
      </main>
    </div>
  );
}
