import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SITE_URL } from "@/lib/site-config";

export type IntentPageConfig = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  answer: string;
  bullets: string[];
  steps: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

export function intentMetadata(config: IntentPageConfig): Metadata {
  const url = `${SITE_URL}/${config.slug}`;
  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: "website", siteName: "BuildCrew", locale: "pl_PL", title: config.title, description: config.description, url },
    twitter: { card: "summary_large_image", title: config.title, description: config.description },
  };
}

export function IntentLanding({ config }: { config: IntentPageConfig }) {
  const url = `${SITE_URL}/${config.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: config.heading,
      description: config.description,
      url,
      inLanguage: "pl-PL",
      isPartOf: { "@type": "WebSite", name: "BuildCrew", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "BuildCrew", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: config.heading, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <JsonLd data={jsonLd} />
      <header className="border-b border-[var(--bc-line)] bg-[var(--bc-surface)]">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[var(--bc-accent)]" />BuildCrew</Link>
          <div className="flex items-center gap-2"><LanguageSwitcher compact /><Button asChild variant="ghost" size="sm"><Link href="/projekty">Projekty</Link></Button><Button asChild size="sm"><Link href="/signup">Dołącz</Link></Button></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 sm:py-16">
        <section className="grid gap-10 border-b border-[var(--bc-line)] pb-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-muted)]">{config.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-[40px] font-semibold leading-[1.06] tracking-[-0.04em] sm:text-[52px]">{config.heading}</h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-7 text-[var(--bc-muted)]">{config.intro}</p>
            <div className="mt-7 flex flex-wrap gap-2"><Button asChild><Link href={config.primary.href}>{config.primary.label} <ArrowRight className="h-3.5 w-3.5" /></Link></Button><Button asChild variant="outline"><Link href={config.secondary.href}>{config.secondary.label}</Link></Button></div>
          </div>
          <aside className="border-l-2 border-[var(--bc-accent)] pl-4"><p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">Krótka odpowiedź</p><p className="mt-2 text-[15px] leading-6 text-[var(--bc-ink)]">{config.answer}</p></aside>
        </section>

        <section className="grid gap-10 border-b border-[var(--bc-line)] py-12 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div><h2 className="text-[26px] font-semibold tracking-[-0.03em]">Na co zwrócić uwagę?</h2><p className="mt-2 text-sm leading-6 text-[var(--bc-muted)]">BuildCrew pomaga ocenić kontekst współpracy, a nie tylko samą nazwę roli.</p></div>
          <ul className="border-t border-[var(--bc-line-strong)]">{config.bullets.map((item, i) => <li key={item} className="grid gap-2 border-b border-[var(--bc-line)] py-4 sm:grid-cols-[42px_minmax(0,1fr)]"><span className="text-[11px] tabular-nums text-[var(--bc-faint)]">0{i + 1}</span><span className="text-sm leading-6 text-[var(--bc-muted)]">{item}</span></li>)}</ul>
        </section>

        <section className="grid gap-10 border-b border-[var(--bc-line)] py-12 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div><h2 className="text-[26px] font-semibold tracking-[-0.03em]">Jak zacząć</h2></div>
          <ol className="border-t border-[var(--bc-line-strong)]">{config.steps.map((step, i) => <li key={step.title} className="grid gap-2 border-b border-[var(--bc-line)] py-5 sm:grid-cols-[42px_210px_minmax(0,1fr)]"><span className="text-[11px] tabular-nums text-[var(--bc-faint)]">{i + 1}</span><h3 className="text-sm font-semibold">{step.title}</h3><p className="text-sm leading-6 text-[var(--bc-muted)]">{step.text}</p></li>)}</ol>
        </section>

        <section className="py-12"><h2 className="text-[26px] font-semibold tracking-[-0.03em]">Najczęstsze pytania</h2><div className="mt-5 divide-y divide-[var(--bc-line)] border-y border-[var(--bc-line)]">{config.faq.map((item) => <details key={item.q} className="group py-4"><summary className="cursor-pointer list-none text-[15px] font-semibold">{item.q}</summary><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--bc-muted)]">{item.a}</p></details>)}</div></section>

        <section className="border-t border-[var(--bc-line)] py-10"><p className="text-sm font-semibold">Powiązane strony</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--bc-muted)]"><Link className="hover:underline" href="/znajdz-programiste">Znajdź programistę</Link><Link className="hover:underline" href="/znajdz-designera">Znajdź designera</Link><Link className="hover:underline" href="/znajdz-zespol">Znajdź zespół</Link><Link className="hover:underline" href="/dolacz-do-projektu">Dołącz do projektu</Link><Link className="hover:underline" href="/poradniki">Poradniki</Link></div></section>
      </main>
    </div>
  );
}
