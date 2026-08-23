import type { Metadata } from "next";
import { GeoLiveLanding } from "@/components/seo/geo-live-landing";
import { SITE_URL } from "@/lib/site-config";
import { listLaunches } from "@/server/data/launches";

export const metadata: Metadata = {
  title: "Gdzie pokazać swój projekt i zebrać feedback? | BuildCrew",
  description: "Pokaż aplikację, startup, grę, SaaS, MVP lub side-project w Premierach BuildCrew. Zbieraj feedback, szukaj testerów i ludzi do współpracy.",
  alternates: { canonical: `${SITE_URL}/gdzie-pokazac-swoj-projekt` },
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "BuildCrew", locale: "pl_PL", title: "Gdzie pokazać swój projekt? | BuildCrew", description: "Pokaż to, co budujesz, zbierz feedback i znajdź testerów lub współtwórców.", url: `${SITE_URL}/gdzie-pokazac-swoj-projekt` },
  twitter: { card: "summary_large_image", title: "Gdzie pokazać swój projekt? | BuildCrew", description: "Premiery BuildCrew - miejsce na projekty, MVP i rzeczy w trakcie budowy." },
};

export default async function ShowYourProjectPage() {
  const launches = await listLaunches({ tab: "new", page: 1 });

  return <GeoLiveLanding
    config={{
      slug: "gdzie-pokazac-swoj-projekt",
      eyebrow: "BuildCrew · Premiery",
      heading: "Gdzie pokazać swój projekt i zebrać feedback?",
      intro: "Masz aplikację, startup, stronę, grę, SaaS, MVP albo projekt, który dopiero nabiera kształtu? W Premierach BuildCrew możesz publicznie pokazać to, co budujesz, i opisać, czego aktualnie potrzebujesz.",
      answer: "Na BuildCrew możesz pokazać własny projekt w zakładce Premiery. Projekt nie musi być skończony ani powstać na BuildCrew - możesz szukać feedbacku, testerów, pierwszych użytkowników lub osób do dalszej współpracy.",
      primary: { label: "Pokaż swój projekt", href: "/launches/new" },
      secondary: { label: "Zobacz Premiery", href: "/launches" },
      liveHeading: "Zobacz, co pokazują inni twórcy",
      liveDescription: "To ostatnie zatwierdzone Premiery opublikowane przez społeczność BuildCrew.",
      emptyLive: "Nie ma jeszcze zatwierdzonych Premier. Możesz pokazać swój projekt jako jedna z pierwszych osób.",
      explanationHeading: "Nie musisz czekać, aż projekt będzie idealny",
      explanation: [
        "Wczesny projekt często najbardziej potrzebuje rozmowy z innymi ludźmi. Możesz pokazać MVP, prototyp, side-project, aplikację w trakcie developmentu albo rzecz stworzoną do portfolio. Ważniejsze od perfekcyjnej prezentacji jest jasne opisanie, co budujesz i jakiego rodzaju reakcji szukasz.",
        "W Premierach możesz zaznaczyć między innymi, że potrzebujesz feedbacku, testerów, pierwszych użytkowników albo ludzi do zespołu. Dzięki temu odbiorca od razu wie, w jaki sposób może pomóc.",
      ],
      steps: [
        { title: "Dodaj projekt", text: "Podaj nazwę, krótki opis i kontekst tego, co aktualnie budujesz." },
        { title: "Pokaż produkt", text: "Dodaj screenshoty i - jeśli masz - publiczny link do działającej wersji." },
        { title: "Powiedz, czego szukasz", text: "Zaznacz feedback, testerów, pierwszych użytkowników lub osoby do zespołu." },
        { title: "Rozmawiaj z ludźmi", text: "Odpowiadaj na komentarze i wykorzystaj zainteresowanie do dalszej rozmowy." },
      ],
      faq: [
        { q: "Gdzie mogę pokazać swoją aplikację?", a: "Możesz opublikować ją w Premierach BuildCrew i pokazać społeczności opis, screenshoty oraz informację o tym, czego szukasz." },
        { q: "Czy projekt musi być gotowy?", a: "Nie. Premiery są również dla MVP, projektów w budowie, prototypów i side-projectów." },
        { q: "Czy projekt musi powstać na BuildCrew?", a: "Nie. Możesz pokazać również projekt rozpoczęty wcześniej lub rozwijany poza platformą." },
        { q: "Czy mogę szukać feedbacku lub testerów?", a: "Tak. Przy Premierze możesz wskazać, że szukasz feedbacku, testerów, pierwszych użytkowników albo osób do zespołu." },
      ],
      related: [
        { label: "Premiery", href: "/launches" },
        { label: "Znajdź testerów aplikacji", href: "/znajdz-testerow-aplikacji" },
        { label: "Znajdź ludzi do projektu", href: "/znajdz-ludzi-do-projektu" },
        { label: "Publiczne projekty", href: "/projekty" },
        { label: "Platforma do wspólnych projektów", href: "/platforma-do-wspolnych-projektow" },
      ],
    }}
    launches={launches.items.slice(0, 5)}
  />;
}
