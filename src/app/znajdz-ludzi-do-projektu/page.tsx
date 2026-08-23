import type { Metadata } from "next";
import { GeoLiveLanding } from "@/components/seo/geo-live-landing";
import { SITE_URL } from "@/lib/site-config";
import { listPublicBuildersForLanding } from "@/server/data/profiles";
import { listPublicProjectsForLanding } from "@/server/data/projects";

export const metadata: Metadata = {
  title: "Znajdź ludzi do projektu - programistów, designerów i więcej | BuildCrew",
  description: "Znajdź ludzi do wspólnego projektu: programistów, designerów, marketerów i founderów. Zobacz publiczne profile i projekty na BuildCrew.",
  alternates: { canonical: `${SITE_URL}/znajdz-ludzi-do-projektu` },
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "BuildCrew", locale: "pl_PL", title: "Znajdź ludzi do projektu | BuildCrew", description: "Poznaj osoby otwarte na wspólne tworzenie projektów i zobacz zespoły, które aktualnie szukają współtwórców.", url: `${SITE_URL}/znajdz-ludzi-do-projektu` },
  twitter: { card: "summary_large_image", title: "Znajdź ludzi do projektu | BuildCrew", description: "Programiści, designerzy, marketerzy i inni współtwórcy projektów." },
};

export default async function FindPeopleForProjectPage() {
  const [builders, projects] = await Promise.all([
    listPublicBuildersForLanding(6),
    listPublicProjectsForLanding(4),
  ]);

  return <GeoLiveLanding
    config={{
      slug: "znajdz-ludzi-do-projektu",
      eyebrow: "BuildCrew · ludzie do projektu",
      heading: "Znajdź ludzi do swojego projektu",
      intro: "Szukasz osoby do aplikacji, startupu, gry, SaaS-u albo side-projectu? Na BuildCrew możesz poznać programistów, designerów, marketerów, founderów i innych ludzi zainteresowanych wspólnym budowaniem.",
      answer: "BuildCrew to platforma do znajdowania osób zainteresowanych wspólnym tworzeniem projektów. Możesz przeglądać publiczne profile, zobaczyć umiejętności i realne projekty albo opublikować własny projekt i opisać, kogo potrzebujesz.",
      primary: { label: "Znajdź ludzi", href: "/signup" },
      secondary: { label: "Zobacz projekty", href: "/projekty" },
      liveHeading: "Zobacz ludzi i projekty, które są już na platformie",
      liveDescription: "Poniżej są prawdziwe publiczne dane BuildCrew - bez przykładowych profili i sztucznego social proof.",
      emptyLive: "Gdy pojawią się publiczne profile lub projekty otwarte na współpracę, zostaną pokazane tutaj automatycznie.",
      explanationHeading: "Jak szukać współtwórców, a nie tylko nazw stanowisk",
      explanation: [
        "Przy wspólnym projekcie liczy się nie tylko rola. Warto sprawdzić technologie, portfolio, projekty, dostępność i to, czego druga osoba faktycznie szuka. Dzięki temu łatwiej rozpocząć rozmowę od konkretnego kontekstu zamiast wysyłać przypadkową wiadomość.",
        "BuildCrew nie jest klasyczną tablicą ogłoszeń o pracę. Platforma skupia się na relacjach wokół realnego budowania: możesz znaleźć ludzi do własnego projektu, dołączyć do istniejącej inicjatywy albo najpierw poznać społeczność i zobaczyć jej dorobek.",
      ],
      steps: [
        { title: "Opisz projekt", text: "Napisz, co chcesz zbudować, na jakim jesteś etapie i jaki pierwszy zakres ma sens." },
        { title: "Określ, kogo potrzebujesz", text: "Wskaż rolę, umiejętności i realną dostępność potrzebną przy projekcie." },
        { title: "Sprawdź proof-of-work", text: "Zobacz profile, portfolio i wcześniejsze projekty osób, z którymi rozważasz współpracę." },
        { title: "Zacznij od konkretu", text: "W pierwszej wiadomości odnieś się do projektu i zaproponuj mały pierwszy krok." },
      ],
      faq: [
        { q: "Gdzie znaleźć ludzi do projektu?", a: "Na BuildCrew możesz przeglądać publiczne profile osób zainteresowanych współpracą oraz publiczne projekty, które szukają kolejnych członków zespołu." },
        { q: "Czy mogę znaleźć programistę do projektu?", a: "Tak. Profile mogą zawierać rolę, technologie, projekty, portfolio i informacje o otwartości na współpracę." },
        { q: "Czy mogę znaleźć UX/UI designera?", a: "Tak. Designerzy mogą prezentować na publicznym profilu portfolio oraz projekty, przy których pracowali." },
        { q: "Czy muszę mieć gotowy startup?", a: "Nie. BuildCrew może być używane także przy MVP, side-projectach, projektach portfolio i inicjatywach będących na wczesnym etapie." },
      ],
      related: [
        { label: "Znajdź programistę", href: "/znajdz-programiste" },
        { label: "Znajdź designera", href: "/znajdz-designera" },
        { label: "Znajdź wspólnika", href: "/znajdz-wspolnika" },
        { label: "Platforma do wspólnych projektów", href: "/platforma-do-wspolnych-projektow" },
        { label: "Dołącz do projektu", href: "/dolacz-do-projektu" },
      ],
    }}
    builders={builders}
    projects={projects.filter((project) => project.openRoles.length > 0)}
  />;
}
