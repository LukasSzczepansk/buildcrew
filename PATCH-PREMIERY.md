# BuildCrew — patch „Premiery”

Moduł został zbudowany jako rozszerzenie istniejącego Showcase, a nie osobny równoległy system.

## Co dodaje patch

- publiczną listę `/launches` z filtrami: Dzisiaj, Ten tydzień, Najnowsze, Najpopularniejsze,
- publiczną stronę `/launches/[slug]`,
- dodawanie `/launches/new`,
- edycję `/launches/[slug]/edit` i usuwanie własnej premiery,
- projekty zewnętrzne oraz opcjonalne powiązanie z istniejącym projektem BuildCrew,
- do 5 screenshotów WebP, z pierwszym obrazem jako miniaturą,
- kategorie, technologie, etap projektu,
- potrzeby: feedback, testerzy, ludzie do zespołu, pierwsi użytkownicy,
- prosty upvote oparty na istniejącej tabeli reakcji Showcase,
- komentarze i odpowiedzi jednego poziomu,
- integrację z istniejącymi profilami oraz Wiadomościami,
- automatyczny wpis w Społeczności po publikacji,
- sekcję Premier na profilach,
- niewielką sekcję „Co ostatnio zbudowano” na homepage,
- sitemapę i metadata/OG stron Premier,
- desktop/mobile navigation z pozycją „Premiery”,
- redirecty starych route'ów Showcase do nowych Premier.

## Baza danych

Po skopiowaniu plików uruchom:

```bash
npm run db:push
```

Alternatywnie możesz jednorazowo wykonać `PREMIERY-MIGRATION.sql` na istniejącej bazie.

Migracja rozszerza istniejący `showcase_entries` i dodaje tylko brakujące dane dla nowego modułu. Nie usuwa istniejących danych Showcase.

## Kontrole wykonane przed spakowaniem

- cały `src`: 312 plików TS/TSX — 0 błędów składni,
- lokalne importy w plikach patcha — 0 brakujących ścieżek,
- `check-punctuation` — OK,
- `check-bilingual-ui` — OK.

Pełnego `next build` / `tsc --noEmit` nie oznaczam jako zaliczonego: środowisko robocze nie miało `node_modules`, a instalacja zależności nie mogła zostać ukończona. Po nałożeniu patcha uruchom lokalnie `npm run build` przed pushem na produkcję.
