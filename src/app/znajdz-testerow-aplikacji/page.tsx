import type { Metadata } from "next";
import { GeoLiveLanding } from "@/components/seo/geo-live-landing";
import { SITE_URL } from "@/lib/site-config";
import { listLaunches } from "@/server/data/launches";

export const metadata: Metadata = {
  title: "Znajdź testerów aplikacji i zbierz feedback | BuildCrew",
  description: "Szukasz testerów aplikacji, SaaS-u, gry lub MVP? Pokaż projekt społeczności BuildCrew, oznacz, że szukasz testerów i zbieraj feedback.",
  alternates: { canonical: `${SITE_URL}/znajdz-testerow-aplikacji` },
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "BuildCrew", locale: "pl_PL", title: "Znajdź testerów aplikacji | BuildCrew", description: "Pokaż produkt społeczności i zaznacz, że szukasz testerów lub feedbacku.", url: `${SITE_URL}/znajdz-testerow-aplikacji` },
  twitter: { card: "summary_large_image", title: "Znajdź testerów aplikacji | BuildCrew", description: "Pokaż aplikację i zbierz feedback od społeczności BuildCrew." },
};

export default async function FindAppTestersPage() {
  const launches = await listLaunches({ tab: "new", page: 1, need: "TESTERS" });
  const testerLaunches = launches.items.slice(0, 6);

  return <GeoLiveLanding
    config={{
      slug: "znajdz-testerow-aplikacji",
      eyebrow: "BuildCrew · testerzy i feedback",
      heading: "Znajdź testerów swojej aplikacji",
      intro: "Tworzysz aplikację, SaaS, grę, narzędzie albo MVP i potrzebujesz osób, które spojrzą na produkt świeżym okiem? Na BuildCrew możesz pokazać projekt społeczności i zaznaczyć, że szukasz testerów.",
      answer: "Aby szukać testerów na BuildCrew, pokaż projekt w Premierach, opisz co powinno zostać sprawdzone i zaznacz opcję „Szukam testerów”. Zainteresowane osoby mogą zobaczyć projekt, skomentować go i nawiązać z Tobą kontakt.",
      primary: { label: "Szukam testerów", href: "/launches/new" },
      secondary: { label: "Zobacz Premiery", href: "/launches" },
      liveHeading: "Projekty, które aktualnie szukają testerów",
      liveDescription: "Pokazujemy tylko zatwierdzone Premiery rzeczywiście oznaczone przez twórców jako szukające testerów.",
      emptyLive: "Wśród ostatnich zatwierdzonych Premier nie ma teraz projektu oznaczonego jako „Szukam testerów”. Możesz opublikować swój projekt i zaznaczyć tę potrzebę.",
      explanationHeading: "Jak zwiększyć szansę na użyteczny feedback",
      explanation: [
        "Samo napisanie „przetestuj aplikację” zwykle daje słabe odpowiedzi. Lepiej wskazać, co chcesz zweryfikować: onboarding, konkretny flow, działanie na telefonie, zrozumiałość interfejsu albo pierwsze wrażenie z produktu.",
        "BuildCrew nie jest bazą profesjonalnych testerów QA. To społeczność osób tworzących projekty, dlatego ten mechanizm najlepiej sprawdza się przy wczesnym feedbacku, beta testach, sprawdzaniu MVP i szukaniu pierwszych osób zainteresowanych produktem.",
      ],
      steps: [
        { title: "Pokaż aplikację", text: "Dodaj Premierę z krótkim opisem produktu i screenshotami." },
        { title: "Zaznacz „Szukam testerów”", text: "Dzięki temu potrzeba jest widoczna bezpośrednio przy projekcie." },
        { title: "Daj konkretne zadanie", text: "Napisz, jaki fragment aplikacji warto sprawdzić i na czym najbardziej zależy Ci w feedbacku." },
        { title: "Odpowiadaj i iteruj", text: "Zbieraj uwagi, dopytuj o problemy i wykorzystuj je przy kolejnej wersji produktu." },
      ],
      faq: [
        { q: "Gdzie znaleźć testerów aplikacji?", a: "Na BuildCrew możesz pokazać aplikację w Premierach i oznaczyć projekt jako szukający testerów. Użytkownicy społeczności mogą wtedy zobaczyć produkt i zareagować." },
        { q: "Czy chodzi o profesjonalne testy QA?", a: "Nie. BuildCrew nie jest usługą profesjonalnego QA. Ta funkcja służy głównie do feedbacku społeczności, beta testów i wczesnego sprawdzania produktu." },
        { q: "Czy mogę pokazać wersję MVP?", a: "Tak. Projekt nie musi być skończony - MVP i wczesne wersje są naturalnym momentem na zbieranie feedbacku." },
        { q: "Czy mogę też szukać pierwszych użytkowników?", a: "Tak. Premiery pozwalają również zaznaczyć potrzebę znalezienia pierwszych użytkowników." },
      ],
      related: [
        { label: "Gdzie pokazać swój projekt", href: "/gdzie-pokazac-swoj-projekt" },
        { label: "Premiery", href: "/launches" },
        { label: "Znajdź ludzi do projektu", href: "/znajdz-ludzi-do-projektu" },
        { label: "Publiczne projekty", href: "/projekty" },
      ],
    }}
    launches={testerLaunches}
  />;
}
