import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "O BuildCrew — platforma do wspólnego tworzenia projektów",
  description: "Dowiedz się, czym jest BuildCrew, dla kogo powstało i jak pomaga znaleźć ludzi do wspólnego budowania projektów.",
  alternates: { canonical: `${SITE_URL}/o-nas` },
  openGraph: { type: "website", siteName: "BuildCrew", title: "O BuildCrew", description: "BuildCrew łączy ludzi, którzy chcą wspólnie tworzyć projekty.", url: `${SITE_URL}/o-nas` },
};

export default function AboutPage() {
  const jsonLd = { "@context": "https://schema.org", "@type": "AboutPage", name: "O BuildCrew", url: `${SITE_URL}/o-nas`, description: "BuildCrew to polska platforma do znajdowania ludzi do wspólnego tworzenia projektów." };
  return <main className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]"><JsonLd data={jsonLd}/><div className="mx-auto max-w-[920px] px-5 py-14 sm:px-8 sm:py-20"><Link href="/" className="text-sm font-semibold">← BuildCrew</Link><p className="mt-12 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-muted)]">O BuildCrew</p><h1 className="mt-4 text-[42px] font-semibold tracking-[-0.04em] sm:text-[56px]">Miejsce dla ludzi, którzy chcą coś zbudować razem.</h1><p className="mt-6 max-w-3xl text-[17px] leading-8 text-[var(--bc-muted)]">BuildCrew to polska platforma do znajdowania ludzi do wspólnego tworzenia projektów. Łączy programistów, designerów, marketerów, founderów i inne osoby, które chcą rozwijać pomysły, dołączać do zespołów i pokazywać realny dorobek.</p><section className="mt-14 border-t border-[var(--bc-line)] py-10"><h2 className="text-[26px] font-semibold">Jak działa BuildCrew?</h2><div className="mt-5 space-y-5 text-sm leading-7 text-[var(--bc-muted)]"><p><strong className="text-[var(--bc-ink)]">Znajdź ludzi.</strong> Profile pokazują umiejętności, projekty, portfolio, dostępność i to, czego dana osoba aktualnie szuka.</p><p><strong className="text-[var(--bc-ink)]">Znajdź lub dodaj projekt.</strong> Projekty mają własny kontekst: etap, technologie, zespół i role, których nadal potrzeba.</p><p><strong className="text-[var(--bc-ink)]">Pokaż realną pracę.</strong> Profil rośnie razem z projektami i portfolio, dzięki czemu działa jak living portfolio zamiast klasycznego CV.</p></div></section><section className="border-t border-[var(--bc-line)] py-10"><h2 className="text-[26px] font-semibold">To nie jest klasyczny portal z ofertami pracy</h2><p className="mt-4 text-sm leading-7 text-[var(--bc-muted)]">Głównym celem BuildCrew jest wspólne budowanie i poznawanie ludzi przez projekty. Profesjonalne możliwości mogą wynikać z tej aktywności, ale platforma nie jest projektowana jako zwykła tablica ogłoszeń rekrutacyjnych.</p></section><div className="border-t border-[var(--bc-line)] pt-8"><Button asChild><Link href="/signup">Dołącz do BuildCrew</Link></Button></div></div></main>;
}
