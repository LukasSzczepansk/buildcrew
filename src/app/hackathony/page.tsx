import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/layout/legal-footer";
import { HackathonCard } from "@/components/hackathons/hackathon-card";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { JsonLd } from "@/components/seo/json-ld";
import { getRequestLocale } from "@/lib/site-server";
import { localeCode, openGraphLocale, siteUrlForLocale } from "@/lib/site-config";
import { listPublishedHackathons } from "@/server/data/hackathons";

const COPY = {
  pl: {
    title: "Hackathons - find a team | BuildCrew",
    description: "Find people attending the same hackathon, compare roles and interests, or let BuildCrew suggest a complementary team.",
    login: "Log in", signup: "Create account", heading: "Going to a hackathon without a team?",
    intro: "Choose an event, set your role and what you want to build. BuildCrew will show people in the same pool and teams that need your skills.",
    find: "Find a team", projects: "View projects", section: "Hackathons on BuildCrew",
    note: "Joining the BuildCrew pool does not replace official event registration.", events: "events",
    none: "There are no published events yet. We will add them when there are real hackathons with verified information.",
    steps: [
      ["Choose an event", "Each hackathon has its own participant pool, so you are not mixed with unrelated profiles."],
      ["Set your role and direction", "Frontend, Backend, UI/UX, Data/AI, Product - plus stack, interests, and availability."],
      ["Zbierz team", "Browse people yourself or let BuildCrew suggest a team and send invitations."],
    ],
  },
  en: {
    title: "Hackathons - find your team | BuildCrew",
    description: "Find people attending the same hackathon, compare roles and interests, or let BuildCrew suggest a complementary team.",
    login: "Log in", signup: "Create account", heading: "Going to a hackathon without a team?",
    intro: "Pick an event, set your role and what you want to build. BuildCrew will show people in the same pool and teams missing your skills.",
    find: "Find a team", projects: "Explore projects", section: "Hackathons on BuildCrew",
    note: "Joining the BuildCrew pool does not replace the event's official registration.", events: "events",
    none: "There are no published events yet. We'll add hackathons once their information is confirmed.",
    steps: [
      ["Choose an event", "Each hackathon has its own pool, so you're not mixed with unrelated profiles."],
      ["Set your role and direction", "Frontend, Backend, UI/UX, Data/AI, Product - plus stack, interests and availability."],
      ["Build your team", "Browse people yourself or let BuildCrew suggest a team and send invitations."],
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = COPY[locale];
  const path = locale === "en" ? "/explore/hackathons" : "/hackathony";
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `${siteUrlForLocale(locale)}${path}` },
    openGraph: { type: "website", locale: openGraphLocale(locale), siteName: "BuildCrew", title: copy.title, description: copy.description, url: `${siteUrlForLocale(locale)}${path}` },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description },
    robots: { index: true, follow: true },
  };
}

export default async function PublicHackathonsPage() {
  const [events, locale] = await Promise.all([listPublishedHackathons(), getRequestLocale()]);
  const copy = COPY[locale];
  const hackathonBase = locale === "en" ? "/explore/hackathons" : "/hackathony";
  const projectsHref = locale === "en" ? "/explore/projects" : "/projekty";
  return (
    <div className="min-h-screen bg-[var(--bc-canvas)] text-[var(--bc-ink)]">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: copy.title, description: copy.description, url: `${siteUrlForLocale(locale)}${hackathonBase}`, inLanguage: localeCode(locale) }} />
      <header className="border-b border-[var(--bc-line)]"><div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10"><Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[var(--bc-accent)]" aria-hidden="true" />BuildCrew</Link><div className="flex items-center gap-2"><LanguageSwitcher compact /><Button asChild variant="ghost" size="sm"><Link href="/login">{copy.login}</Link></Button><Button asChild size="sm"><Link href="/signup?next=/hackathons">{copy.signup}</Link></Button></div></div></header>
      <main className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="max-w-[820px]"><p className="text-[13px] font-medium text-[var(--bc-muted)]">Find your team · BuildCrew</p><h1 className="mt-3 text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[48px]">{copy.heading}</h1><p className="mt-4 max-w-[720px] text-[15px] leading-7 text-[var(--bc-muted)]">{copy.intro}</p><div className="mt-6 flex flex-wrap gap-2"><Button asChild><Link href="/signup?next=/hackathons">{copy.find}</Link></Button><Button asChild variant="outline"><Link href={projectsHref}>{copy.projects}</Link></Button></div></div>
        <section className="mt-12"><div className="flex items-end justify-between gap-4"><div><h2 className="text-[20px] font-semibold">{copy.section}</h2><p className="mt-1 text-sm text-[var(--bc-muted)]">{copy.note}</p></div><span className="text-[12px] text-[var(--bc-faint)]">{events.length} {copy.events}</span></div><div className="mt-4 border-t border-[var(--bc-line-strong)]">{events.map((event) => <HackathonCard key={event.id} event={event} href={`${hackathonBase}/${event.slug}`} />)}</div>{!events.length ? <div className="border-y border-[var(--bc-line)] py-8 text-sm text-[var(--bc-muted)]">{copy.none}</div> : null}</section>
        <section className="mt-12 grid gap-6 border-t border-[var(--bc-line-strong)] pt-8 md:grid-cols-3">{copy.steps.map(([title, body], index) => <div key={title}><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-faint)]">0{index + 1}</p><h3 className="mt-2 text-[16px] font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-[var(--bc-muted)]">{body}</p></div>)}</section>
        <LegalFooter className="mt-14" />
      </main>
    </div>
  );
}
