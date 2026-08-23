import type { Metadata } from "next";
import { GeoLiveLanding } from "@/components/seo/geo-live-landing";
import { SITE_URL } from "@/lib/site-config";
import { listPublicBuildersForLanding } from "@/server/data/profiles";
import { listPublicProjectsForLanding } from "@/server/data/projects";
import { listLaunches } from "@/server/data/launches";

export const metadata: Metadata = {
  title: "BuildCrew - platforma do wspólnych projektów",
  description: "Polska platforma do wspólnego tworzenia projektów. Znajdź programistów, designerów i innych współtwórców, dołącz do projektu lub pokaż to, co budujesz.",
  alternates: { canonical: `${SITE_URL}/platforma-do-wspolnych-projektow` },
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "BuildCrew", locale: "pl_PL", title: "BuildCrew - platforma do wspólnych projektów", description: "Ludzie, projekty, Premiery i proof-of-work w jednym miejscu.", url: `${SITE_URL}/platforma-do-wspolnych-projektow` },
  twitter: { card: "summary_large_image", title: "BuildCrew - platforma do wspólnych projektów", description: "Znajdź ludzi, dołącz do projektu albo pokaż to, co budujesz." },
};

export default async function CollaborationPlatformPage() {
  const [builders, projects, launches] = await Promise.all([
    listPublicBuildersForLanding(4),
    listPublicProjectsForLanding(3),
    listLaunches({ tab: "new", page: 1 }),
  ]);

  return <GeoLiveLanding
    config={{
      slug: "platforma-do-wspolnych-projektow",
      eyebrow: "BuildCrew · polska społeczność twórców",
      heading: "Platforma do wspólnego tworzenia projektów",
      intro: "BuildCrew łączy osoby, które chcą coś stworzyć - od pierwszego pomysłu i MVP po rozwijany produkt. Możesz znaleźć ludzi do projektu, dołączyć do istniejącego zespołu, pokazać swoją pracę i poznawać innych twórców.",
      answer: "BuildCrew to polska platforma do znajdowania ludzi do wspólnego tworzenia projektów. Łączy programistów, designerów, marketerów, founderów i inne osoby, które chcą budować realne projekty zamiast ograniczać się do klasycznego CV lub ogłoszenia o pracę.",
      primary: { label: "Dołącz do BuildCrew", href: "/signup" },
      secondary: { label: "Zobacz projekty", href: "/projekty" },
      liveHeading: "BuildCrew działa na realnych profilach i projektach",
      liveDescription: "Zamiast statycznej strony marketingowej pokazujemy publiczną aktywność społeczności: ludzi, projekty oraz zatwierdzone Premiery.",
      emptyLive: "Publiczna aktywność społeczności pojawi się tutaj automatycznie wraz z kolejnymi profilami, projektami i Premierami.",
      explanationHeading: "Co możesz zrobić na BuildCrew",
      explanation: [
        "Jeśli masz pomysł albo już rozwijasz produkt, możesz opisać projekt i znaleźć osoby o uzupełniających kompetencjach. Jeśli nie masz własnego projektu, możesz przeglądać istniejące inicjatywy i szukać zespołu, do którego chcesz dołączyć.",
        "Publiczny profil może działać jako żywe portfolio: pokazuje umiejętności, projekty i realny proof-of-work. Premiery pozwalają natomiast prezentować rzeczy, które właśnie powstają, oraz szukać feedbacku, testerów, pierwszych użytkowników lub kolejnych osób do zespołu.",
      ],
      steps: [
        { title: "Utwórz profil", text: "Pokaż obszary, umiejętności, projekty i to, czego aktualnie szukasz." },
        { title: "Znajdź ludzi lub projekt", text: "Przeglądaj społeczność i publiczne projekty, które są otwarte na współpracę." },
        { title: "Nawiąż kontakt", text: "Rozpocznij rozmowę w kontekście konkretnego projektu, umiejętności lub wspólnego celu." },
        { title: "Pokaż efekty", text: "Dodawaj projekty i Premiery, dzięki czemu profil rośnie razem z realnym dorobkiem." },
      ],
      faq: [
        { q: "Czym jest BuildCrew?", a: "BuildCrew to platforma i społeczność do znajdowania ludzi do wspólnych projektów, dołączania do zespołów oraz pokazywania realnej pracy i projektów." },
        { q: "Dla kogo jest BuildCrew?", a: "Dla programistów, designerów, marketerów, founderów, osób od produktu, Data/AI oraz innych ludzi chcących wspólnie coś budować." },
        { q: "Czy BuildCrew jest portalem pracy?", a: "Nie. Głównym celem jest wspólne tworzenie projektów i budowanie relacji wokół realnej pracy. Możliwości zawodowe mogą być efektem aktywności, ale nie są jedynym zastosowaniem platformy." },
        { q: "Czy mogę dołączyć bez własnego pomysłu?", a: "Tak. Możesz przeglądać publiczne projekty i szukać zespołów, które potrzebują kolejnych osób." },
      ],
      related: [
        { label: "Znajdź ludzi do projektu", href: "/znajdz-ludzi-do-projektu" },
        { label: "Pokaż swój projekt", href: "/gdzie-pokazac-swoj-projekt" },
        { label: "Znajdź testerów aplikacji", href: "/znajdz-testerow-aplikacji" },
        { label: "Znajdź programistę", href: "/znajdz-programiste" },
        { label: "Znajdź designera", href: "/znajdz-designera" },
        { label: "Dołącz do projektu", href: "/dolacz-do-projektu" },
      ],
    }}
    builders={builders}
    projects={projects.filter((project) => project.openRoles.length > 0)}
    launches={launches.items.slice(0, 3)}
  />;
}
