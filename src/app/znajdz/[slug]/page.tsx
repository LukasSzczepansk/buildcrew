import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { getRequestLocale } from "@/lib/site-server";
import { localeCode, openGraphLocale, siteUrlForLocale } from "@/lib/site-config";

type Locale = "pl" | "en";
type Copy = {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  who: string;
  bullets: string[];
  howTitle: string;
  steps: Array<{ title: string; text: string }>;
  faq: Array<{ q: string; a: string }>;
};

type DiscoveryPage = {
  pl: Copy;
  en: Copy;
};

const PAGES: Record<string, DiscoveryPage> = {
  "ludzi-do-projektu": {
    pl: {
      title: "Jak znaleźć ludzi do wspólnego projektu? | BuildCrew",
      description: "Szukasz osób do side projectu, startupu albo MVP? Zobacz, jak znaleźć developerów, designerów, founderów i innych ludzi do wspólnego budowania.",
      eyebrow: "BuildCrew · wspólne projekty",
      heading: "Jak znaleźć ludzi do wspólnego projektu?",
      intro: "Najtrudniejszą częścią side projectu często nie jest sam pomysł, tylko znalezienie osób, które mają uzupełniające umiejętności, podobną dostępność i naprawdę chcą coś zbudować. BuildCrew powstało właśnie po to, żeby ułatwić takie połączenia.",
      who: "Na BuildCrew możesz szukać m.in. developerów, UX/UI designerów, osób od produktu, founderów, marketingu i Data/AI. Profile pokazują nie tylko deklarowane umiejętności, ale też projekty, portfolio, dostępność i to, czego dana osoba aktualnie szuka.",
      bullets: [
        "sprawdź, czym dana osoba faktycznie się zajmuje i co już zbudowała",
        "porównaj dostępność i preferowany sposób współpracy",
        "zobacz portfolio, technologie i aktywne projekty",
        "napisz bezpośrednio do osoby albo zaproś ją do konkretnego projektu",
      ],
      howTitle: "Jak zacząć",
      steps: [
        { title: "Opisz, co chcesz zbudować", text: "Nie potrzebujesz rozbudowanego biznesplanu. Wystarczy problem, pomysł, etap projektu i informacja, jakich ról brakuje w zespole." },
        { title: "Szukaj po roli i kontekście", text: "Sam stack to za mało. Zwróć uwagę na dostępność, zainteresowania, doświadczenie projektowe i to, czy dana osoba jest otwarta na wspólne budowanie." },
        { title: "Zacznij od krótkiej rozmowy", text: "Pierwszy kontakt powinien wyjaśniać, co budujesz, dlaczego piszesz właśnie do tej osoby i czego oczekujesz na początku." },
      ],
      faq: [
        { q: "Czy BuildCrew jest portalem pracy?", a: "Nie. Głównym celem BuildCrew jest poznawanie ludzi do wspólnego budowania, wymiany wiedzy, pomysłów i doświadczenia. Możliwości zawodowe mogą być efektem aktywności, ale nie są centrum platformy." },
        { q: "Czy muszę mieć gotowy projekt?", a: "Nie. Możesz dołączyć do istniejących projektów, poznawać ludzi i rozwijać pomysł wspólnie z innymi." },
        { q: "Czy profil może działać jak portfolio?", a: "Tak. Użytkownicy mogą pokazywać projekty i portfolio bezpośrednio na profilu, dzięki czemu inni widzą realny dorobek, a nie tylko listę umiejętności." },
      ],
    },
    en: {
      title: "How to find people for a project | BuildCrew",
      description: "Looking for people for a side project, startup or MVP? Find developers, designers, founders and other builders who want to collaborate.",
      eyebrow: "BuildCrew · collaboration",
      heading: "How do you find the right people for a project?",
      intro: "The hardest part of a side project is often not the idea itself, but finding people with complementary skills, compatible availability and a real willingness to build. BuildCrew is designed around that problem.",
      who: "You can discover developers, UX/UI designers, product people, founders, marketers and Data/AI builders. Profiles show projects, portfolio, availability and current collaboration intent, not just a list of claimed skills.",
      bullets: ["see what someone has actually built", "compare availability and collaboration preferences", "review portfolio, technologies and active projects", "message someone or invite them to a specific project"],
      howTitle: "How to start",
      steps: [
        { title: "Describe what you want to build", text: "You do not need a full business plan. Explain the problem, current stage and the roles missing from your team." },
        { title: "Search by role and context", text: "A tech stack alone is not enough. Look at availability, interests, project experience and what the person is currently open to." },
        { title: "Start with a short conversation", text: "Explain what you are building, why you contacted this person and what you would like to do first." },
      ],
      faq: [
        { q: "Is BuildCrew a job board?", a: "No. BuildCrew is primarily a place to meet people for building, learning and sharing ideas. Professional opportunities can emerge from real work, but they are not the core of the product." },
        { q: "Do I need a finished project idea?", a: "No. You can join existing projects, meet people and shape an idea together." },
        { q: "Can a BuildCrew profile work as a portfolio?", a: "Yes. Users can showcase projects and visual portfolio work directly on their public profile." },
      ],
    },
  },
  "programiste-do-projektu": {
    pl: {
      title: "Jak znaleźć programistę do projektu lub startupu? | BuildCrew",
      description: "Znajdź programistę do side projectu, MVP lub startupu. Sprawdź technologie, projekty, dostępność i to, czy dana osoba jest otwarta na współpracę.",
      eyebrow: "BuildCrew · Development",
      heading: "Jak znaleźć programistę do projektu?",
      intro: "Przy szukaniu developera ważniejszy od samej listy technologii jest kontekst: co dana osoba już zbudowała, ile czasu może poświęcić, jaki typ projektu ją interesuje i czy chce wejść w dłuższą współpracę.",
      who: "Na profilach BuildCrew możesz zobaczyć specjalizację, stack, projekty, aktywność, dostępność i kierunek współpracy. Dzięki temu łatwiej odróżnić osobę, która zna daną technologię, od osoby, która faktycznie chce użyć jej przy wspólnym projekcie.",
      bullets: ["Frontend, Backend, Fullstack, Mobile, DevOps, AI/ML i inne specjalizacje", "technologie i narzędzia używane przez daną osobę", "projekty, przy których pracowała", "deklarowana dostępność tygodniowa i otwartość na współpracę"],
      howTitle: "Na co zwrócić uwagę",
      steps: [
        { title: "Zakres MVP", text: "Im konkretniej opiszesz pierwszy mały zakres projektu, tym łatwiej developerowi ocenić, czy chce się zaangażować." },
        { title: "Rola i odpowiedzialność", text: "Napisz, czy szukasz osoby do frontendu, backendu, całego MVP czy wsparcia w konkretnym obszarze." },
        { title: "Czas i sposób pracy", text: "Ustalcie realistyczną liczbę godzin tygodniowo, sposób komunikacji i pierwszy wspólny milestone." },
      ],
      faq: [
        { q: "Czy można znaleźć programistę do projektu bez budżetu?", a: "BuildCrew służy również do side projectów i współpracy partnerskiej. W opisie projektu warto jasno napisać, czy projekt jest hobbystyczny, udziałowy czy płatny." },
        { q: "Jak sprawdzić doświadczenie developera?", a: "Zobacz projekty, rolę przy ich realizacji, technologie i publiczny profil. Sam poziom stanowiska nie daje pełnego obrazu." },
        { q: "Czy BuildCrew jest tylko dla programistów?", a: "Nie. W społeczności są również designerzy, founderzy, osoby od produktu, marketingu oraz Data/AI." },
      ],
    },
    en: {
      title: "How to find a developer for a project or startup | BuildCrew",
      description: "Find a developer for a side project, MVP or startup. Review technologies, projects, availability and current collaboration intent.",
      eyebrow: "BuildCrew · Development",
      heading: "How do you find a developer for a project?",
      intro: "A technology list is only part of the picture. What matters is what someone has built, how much time they can commit, what kind of project they want and whether they are open to ongoing collaboration.",
      who: "BuildCrew profiles can show specialization, stack, projects, activity, availability and collaboration intent, helping you find developers who actually want to build in your context.",
      bullets: ["Frontend, Backend, Fullstack, Mobile, DevOps, AI/ML and more", "technologies and tools", "projects and real work", "weekly availability and collaboration intent"],
      howTitle: "What to look for",
      steps: [
        { title: "Define a small MVP scope", text: "A clear first scope makes it much easier for a developer to decide whether the project is a fit." },
        { title: "Explain the responsibility", text: "Say whether you need frontend, backend, full MVP ownership or help with one specific area." },
        { title: "Agree on time and workflow", text: "Set realistic weekly availability, communication habits and a first shared milestone." },
      ],
      faq: [
        { q: "Can I find a developer for an unpaid side project?", a: "BuildCrew also supports side projects and peer collaboration. Be transparent about whether a project is hobby-based, equity-based or paid." },
        { q: "How can I evaluate a developer?", a: "Look at projects, their role in those projects, technologies and public proof of work rather than relying only on a job title." },
        { q: "Is BuildCrew only for developers?", a: "No. The community also includes designers, founders, product, marketing and Data/AI people." },
      ],
    },
  },
  "ux-ui-designera-do-projektu": {
    pl: {
      title: "Jak znaleźć UX/UI designera do projektu? | BuildCrew",
      description: "Szukasz UX/UI designera do aplikacji, startupu albo MVP? Zobacz portfolio, projekty, narzędzia, dostępność i znajdź osobę do współpracy na BuildCrew.",
      eyebrow: "BuildCrew · Design",
      heading: "Jak znaleźć UX/UI designera do projektu?",
      intro: "W przypadku designera sama nazwa stanowiska mówi niewiele. Najważniejsze jest portfolio: sposób rozwiązywania problemów, jakość interfejsu, proces projektowy i to, za jaki fragment pracy dana osoba faktycznie odpowiadała.",
      who: "BuildCrew pozwala designerom dodawać portfolio bezpośrednio na profil jako screeny i case studies. Możesz więc zobaczyć pracę bez wychodzenia na zewnętrzną stronę oraz sprawdzić projekty, obszary specjalizacji i dostępność autora.",
      bullets: ["UX Design, UI Design, Product Design, UX Research i Design Systems", "screeny i case studies bezpośrednio na profilu", "narzędzia takie jak Figma, FigJam czy Framer", "projekty BuildCrew powiązane z konkretną pracą w portfolio"],
      howTitle: "Jak wybrać designera",
      steps: [
        { title: "Zobacz pracę, nie tylko skillsy", text: "Portfolio powinno pokazywać jakość wykonania i sposób myślenia, a nie wyłącznie listę narzędzi." },
        { title: "Dopasuj zakres", text: "Innych kompetencji potrzebujesz do szybkiego UI MVP, innych do researchu, a jeszcze innych do zbudowania pełnego design systemu." },
        { title: "Daj kontekst projektu", text: "Przy pierwszej wiadomości pokaż problem, użytkownika i aktualny etap produktu. To ułatwia designerowi sensowną odpowiedź." },
      ],
      faq: [
        { q: "Czy designer musi mieć Behance lub własną stronę?", a: "Nie. Na BuildCrew może dodać screeny i portfolio bezpośrednio do publicznego profilu." },
        { q: "Czy mogę powiązać portfolio z projektem?", a: "Tak. Praca w portfolio może być powiązana z projektem BuildCrew, dzięki czemu widać kontekst i udział autora." },
        { q: "Czy na BuildCrew są tylko UX/UI designerzy?", a: "Nie. Platforma łączy różne role potrzebne do wspólnego budowania, m.in. development, product, founderów, marketing i Data/AI." },
      ],
    },
    en: {
      title: "How to find a UX/UI designer for a project | BuildCrew",
      description: "Looking for a UX/UI designer for an app, startup or MVP? Review portfolio, projects, tools and availability on BuildCrew.",
      eyebrow: "BuildCrew · Design",
      heading: "How do you find a UX/UI designer for a project?",
      intro: "A design job title alone says very little. Portfolio, problem solving, interface quality, process and clear ownership of the work matter much more.",
      who: "BuildCrew lets designers publish visual portfolio work directly on their profile, so you can review screenshots and case studies alongside projects, specialties and availability.",
      bullets: ["UX Design, UI Design, Product Design, UX Research and Design Systems", "screenshots and case studies on the profile", "tools such as Figma, FigJam and Framer", "portfolio work connected to BuildCrew projects"],
      howTitle: "How to choose a designer",
      steps: [
        { title: "Review work, not just skills", text: "A portfolio should show quality and thinking, not only a list of tools." },
        { title: "Match the scope", text: "A quick MVP interface, research work and a full design system require different strengths." },
        { title: "Share project context", text: "Explain the problem, user and product stage in your first message so the designer can respond meaningfully." },
      ],
      faq: [
        { q: "Does a designer need Behance or a personal website?", a: "No. Designers can add screenshots and portfolio work directly to their public BuildCrew profile." },
        { q: "Can portfolio work be connected to a project?", a: "Yes. Portfolio items can be linked to a BuildCrew project to show context and contribution." },
        { q: "Is BuildCrew only for UX/UI designers?", a: "No. It connects development, design, product, founders, marketing and Data/AI roles." },
      ],
    },
  },
  cofoundera: {
    pl: {
      title: "Jak znaleźć co-foundera do startupu lub projektu? | BuildCrew",
      description: "Szukasz co-foundera? Poznaj ludzi przez realne projekty, sprawdź ich doświadczenie, dostępność, portfolio i zacznij współpracę na BuildCrew.",
      eyebrow: "BuildCrew · Founder / Business",
      heading: "Jak znaleźć co-foundera?",
      intro: "Dobrego co-foundera trudno wybrać na podstawie samego opisu profilu. Znacznie więcej mówi wspólna praca: sposób komunikacji, tempo działania, odpowiedzialność i to, czy potraficie razem dowozić kolejne etapy projektu.",
      who: "BuildCrew pomaga najpierw poznać ludzi przez projekty, rozmowy i wymianę wiedzy. Publiczny profil pokazuje dorobek, aktywne projekty i obszary, w których dana osoba chce współpracować.",
      bullets: ["znajdź osoby o kompetencjach uzupełniających Twoje", "sprawdź projekty i portfolio przed pierwszą rozmową", "zobacz dostępność i aktualne cele współpracy", "zacznij od małego wspólnego zakresu zamiast od deklaracji na lata"],
      howTitle: "Lepszy sposób niż przypadkowy networking",
      steps: [
        { title: "Szukaj uzupełniających kompetencji", text: "Jeśli jesteś techniczny, być może potrzebujesz osoby od produktu, sprzedaży lub designu. Jeśli jesteś biznesowy, kluczowy może być technical co-founder." },
        { title: "Sprawdźcie się w małym projekcie", text: "Krótki wspólny sprint daje więcej informacji o współpracy niż długa rozmowa o planach." },
        { title: "Dopiero później ustalcie długoterminowe zasady", text: "Najpierw zobaczcie, jak podejmujecie decyzje, rozwiązujecie konflikty i dowozicie uzgodnione rzeczy." },
      ],
      faq: [
        { q: "Czy BuildCrew gwarantuje znalezienie co-foundera?", a: "Nie. Platforma ułatwia odkrywanie i kontakt z ludźmi, ale decyzja o długoterminowej współpracy wymaga czasu i wzajemnego sprawdzenia się." },
        { q: "Czy powinienem od razu proponować udziały?", a: "Nie ma jednej reguły. Warto najpierw sprawdzić współpracę na mniejszym zakresie i jasno omówić oczekiwania obu stron." },
        { q: "Czy mogę znaleźć osoby także bez gotowego startupu?", a: "Tak. BuildCrew jest również dla osób, które chcą poznawać ludzi, wymieniać się pomysłami i dopiero później rozpocząć wspólny projekt." },
      ],
    },
    en: {
      title: "How to find a co-founder for a startup or project | BuildCrew",
      description: "Looking for a co-founder? Discover people through real projects, review their work and availability, and start collaborating on BuildCrew.",
      eyebrow: "BuildCrew · Founder / Business",
      heading: "How do you find a co-founder?",
      intro: "A strong co-founder is difficult to choose from a profile description alone. Working together reveals much more: communication, pace, ownership and whether you can consistently ship together.",
      who: "BuildCrew helps people meet through projects, conversations and knowledge sharing. Public profiles show real work, active projects and current collaboration goals.",
      bullets: ["find people with complementary strengths", "review projects and portfolio before the first conversation", "see availability and current goals", "start with a small shared scope before making long-term commitments"],
      howTitle: "A better approach than random networking",
      steps: [
        { title: "Look for complementary strengths", text: "A technical founder may need product, sales or design strengths; a business founder may need a technical co-founder." },
        { title: "Test the collaboration on something small", text: "A short shared sprint tells you more about working together than a long conversation about future plans." },
        { title: "Agree on long-term terms later", text: "First learn how you make decisions, handle disagreement and deliver what you agreed on." },
      ],
      faq: [
        { q: "Does BuildCrew guarantee that I will find a co-founder?", a: "No. BuildCrew helps discovery and connection, but a long-term founder relationship requires time and mutual validation." },
        { q: "Should I offer equity immediately?", a: "There is no single rule. It is often useful to test collaboration on a smaller scope before making long-term commitments." },
        { q: "Can I use BuildCrew without an existing startup?", a: "Yes. You can meet people, exchange ideas and only later decide to start a project together." },
      ],
    },
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const page = PAGES[slug];
  if (!page) return { robots: { index: false, follow: false } };
  const copy = page[locale];
  const url = `${siteUrlForLocale(locale)}/znajdz/${slug}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: openGraphLocale(locale),
      siteName: "BuildCrew",
      title: copy.title,
      description: copy.description,
      url,
    },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description },
  };
}

export default async function DiscoveryLanding({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const page = PAGES[slug];
  if (!page) notFound();
  const copy = page[locale];
  const en = locale === "en";
  const url = `${siteUrlForLocale(locale)}/znajdz/${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: copy.heading,
      description: copy.description,
      url,
      inLanguage: localeCode(locale),
      isPartOf: { "@type": "WebSite", name: "BuildCrew", url: siteUrlForLocale(locale) },
      about: { "@type": "Thing", name: copy.heading },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: copy.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f4ef] text-[#111111] dark:bg-[#11110f] dark:text-[#f4f4ef]">
      <JsonLd data={jsonLd} />
      <header className="border-b border-[#d8d8d0] dark:border-[#34342f]">
        <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]"><span className="h-4 w-[5px] bg-[#c8f169]" />BuildCrew</Link>
          <div className="flex items-center gap-2 text-sm"><Link href="/explore/projects" className="px-3 py-2 hover:underline">{en ? "Projects" : "Projekty"}</Link><Link href="/signup" className="bg-[#111] px-4 py-2 font-medium text-white dark:bg-[#f4f4ef] dark:text-[#111]">{en ? "Join BuildCrew" : "Dołącz"}</Link></div>
        </div>
      </header>

      <article className="mx-auto max-w-[1080px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-[780px]">
          <p className="text-[13px] font-medium text-neutral-500">{copy.eyebrow}</p>
          <h1 className="mt-4 text-[42px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[58px]">{copy.heading}</h1>
          <p className="mt-6 text-[17px] leading-8 text-neutral-600 dark:text-neutral-300">{copy.intro}</p>
          <p className="mt-4 text-[15px] leading-7 text-neutral-600 dark:text-neutral-300">{copy.who}</p>
        </div>

        <section className="mt-12 grid gap-10 border-t border-[#b9b9b1] pt-8 lg:grid-cols-[260px_minmax(0,1fr)] dark:border-neutral-600">
          <h2 className="text-[21px] font-semibold tracking-[-0.02em]">{en ? "What you can verify" : "Co możesz sprawdzić"}</h2>
          <ul className="divide-y divide-[#d8d8d0] border-y border-[#d8d8d0] dark:divide-neutral-700 dark:border-neutral-700">
            {copy.bullets.map((item) => <li key={item} className="py-4 text-[15px] leading-6"><span className="mr-3 text-[#7b9f17]">✓</span>{item}</li>)}
          </ul>
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <h2 className="text-[21px] font-semibold tracking-[-0.02em]">{copy.howTitle}</h2>
          <div className="border-t border-[#b9b9b1] dark:border-neutral-600">
            {copy.steps.map((step, index) => <div key={step.title} className="grid gap-2 border-b border-[#d8d8d0] py-5 sm:grid-cols-[38px_190px_minmax(0,1fr)] dark:border-neutral-700"><span className="text-[12px] text-neutral-400">0{index + 1}</span><h3 className="text-[14px] font-semibold">{step.title}</h3><p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">{step.text}</p></div>)}
          </div>
        </section>

        <section className="mt-16 border-y border-[#d8d8d0] bg-white px-5 py-8 sm:px-8 dark:border-neutral-700 dark:bg-[#171715]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><h2 className="text-[24px] font-semibold tracking-[-0.025em]">{en ? "Find people who want to build." : "Znajdź ludzi, którzy chcą budować."}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">{en ? "Create a profile, show what you do and discover people and projects that fit your direction." : "Utwórz profil, pokaż czym się zajmujesz i poznawaj ludzi oraz projekty dopasowane do Twojego kierunku."}</p></div><Link href="/signup" className="shrink-0 bg-[#111] px-5 py-3 text-sm font-medium text-white dark:bg-[#f4f4ef] dark:text-[#111]">{en ? "Create profile →" : "Utwórz profil →"}</Link></div>
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <h2 className="text-[21px] font-semibold tracking-[-0.02em]">FAQ</h2>
          <div className="divide-y divide-[#d8d8d0] border-y border-[#d8d8d0] dark:divide-neutral-700 dark:border-neutral-700">
            {copy.faq.map((item) => <div key={item.q} className="py-5"><h3 className="text-[15px] font-semibold">{item.q}</h3><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{item.a}</p></div>)}
          </div>
        </section>

        <nav aria-label={en ? "Related guides" : "Powiązane poradniki"} className="mt-14 border-t border-[#d8d8d0] pt-6 dark:border-neutral-700">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-neutral-400">{en ? "Related" : "Powiązane"}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {Object.entries(PAGES).filter(([otherSlug]) => otherSlug !== slug).map(([otherSlug, item]) => <Link key={otherSlug} href={`/znajdz/${otherSlug}`} className="hover:underline">{item[locale].heading}</Link>)}
          </div>
        </nav>
      </article>
    </main>
  );
}
