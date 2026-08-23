# BuildCrew - role-aware onboarding patch

## Co zmieniono

- Pierwszy krok onboardingu pyta teraz o 1-2 główne obszary:
  - Programowanie
  - UX/UI / Design
  - Produkt
  - Founder / Biznes
  - Marketing / Growth
  - Data / AI
  - Inne
- Wybrane obszary są zapisywane w profilu w nowym polu `disciplines`.
- Dotychczasowe pole `role` zostaje jako główna specjalizacja, dzięki czemu obecny matching i role projektowe dalej działają.
- Krok specjalizacji jest dynamiczny:
  - Development pokazuje role techniczne i stack,
  - Design pokazuje UX/UI i narzędzia designerskie,
  - Founder/Product pokazuje kompetencje produktowe i biznesowe,
  - Marketing pokazuje growth/marketing,
  - Data/AI pokazuje AI/data stack.
- Rozszerzono katalog skills m.in. o UX Research, FigJam, Prototyping, Product Strategy, Marketing/Growth, Business i Data.
- Ostatni krok jest dopasowany do roli i pozwala dodać do 3 screenów pierwszej pracy.
- Screeny z onboardingu trafiają bezpośrednio do natywnego Portfolio BuildCrew.
- Link do zewnętrznego portfolio pozostaje opcjonalnym dodatkiem.
- Wybrane obszary można później zmienić w edycji profilu.
- Obszary są widoczne jako proste etykiety na profilu własnym, profilu buildera i publicznym `/u/...`.
- Zachowano PL/EN oraz migrację szkicu starego onboardingu.

## Baza danych

Nowe pole wymaga dodania kolumny `profiles.disciplines`.

Jeżeli korzystasz z Drizzle i chcesz tylko zsynchronizować schemat:

```bash
npm run db:push
```

Dla istniejących profili najlepiej dodatkowo wykonać:

`ONBOARDING-ROLES-MIGRATION.sql`

Plik oprócz dodania kolumny uzupełnia dotychczasowym użytkownikom sensowny obszar na podstawie ich starej roli.

## Weryfikacja

- `check-punctuation`: OK
- `check-bilingual-ui`: OK
- statyczny skan składni TypeScript/TSX: 294 pliki, 0 błędów składni
- pełny `tsc --noEmit` nie został oznaczony jako zaliczony, ponieważ środowisko robocze nie miało kompletnego `node_modules` / typów zależności.

## Ważne

Patch jest oparty na poprzedniej paczce z natywnym Portfolio. Nie zawiera `.env.local`, `.next` ani `node_modules`.
