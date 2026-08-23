# BuildCrew patch — uproszczona nawigacja + natywne portfolio

## Co zmieniono

- Główna nawigacja to teraz wyłącznie: Start, Ludzie, Projekty, Społeczność, Wiadomości.
- Usunięto sekcję „Więcej” z sidebara.
- Hackathony, Showcase i Możliwości/Jobs są ukryte z głównego produktu; istniejące wewnętrzne trasy użytkownika przekierowują do rdzenia produktu.
- Hackathony usunięto również z publicznej sitemapy/discovery.
- „Możliwości” na profilu przemianowano na język współpracy („Współpraca”, „Dostępność i współpraca”).
- Dodano natywne Portfolio na profilu użytkownika.

## Portfolio

Użytkownik może teraz:

- dodać pracę bezpośrednio na BuildCrew,
- dodać tytuł, opis i swoją rolę,
- dodać narzędzia/technologie,
- przesłać od 1 do 6 screenshotów JPG/PNG/WebP,
- zmienić kolejność screenów; pierwszy screen jest okładką,
- opcjonalnie powiązać pracę z projektem BuildCrew, którego jest właścicielem lub członkiem,
- usunąć pracę z portfolio.

Obrazy są przed wysłaniem skalowane w przeglądarce, ponownie kodowane jako WebP i ograniczane rozmiarem. Portfolio jest widoczne na:

- własnym profilu/ustawieniach,
- profilu buildera wewnątrz BuildCrew,
- publicznym profilu `/u/[username]` (gdy profil jest publiczny).

## Baza danych — WAŻNE

Przed użyciem portfolio trzeba dodać dwie tabele. Najprościej:

```bash
npm run db:push
```

albo ręcznie wykonać plik:

`PORTFOLIO-MIGRATION.sql`

## Walidacja

- skan składni wszystkich plików TS/TSX: 0 błędów,
- `check-punctuation`: OK,
- `check-bilingual-ui`: OK.

Pełny build nie został wykonany w środowisku patchowania, ponieważ instalacja zależności `npm ci` nie zakończyła się w dostępnym oknie wykonania. Do ZIP-a nie dołączono częściowego `node_modules`.
