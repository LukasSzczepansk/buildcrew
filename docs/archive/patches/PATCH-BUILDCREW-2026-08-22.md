# BuildCrew patch — 2026-08-22

Zakres: P0 + kluczowe P1 z ustalonego planu. Patch skupia się na spójności PL/EN, jasnym pozycjonowaniu BuildCrew jako społeczności ludzi budujących razem oraz poprawie hierarchii głównych ekranów bez przebudowy backendu wymagającej nowych migracji danych.

## Najważniejsze zmiany

### Nawigacja i pozycjonowanie
- Główna nawigacja: Start, Ludzie, Projekty, Społeczność, Wiadomości.
- Sprint, Sieć, Hackathony, Showcase i Możliwości przeniesione na drugi poziom.
- Mobilna nawigacja ograniczona do 5 głównych pozycji.
- Landing mocniej komunikuje: ludzie + wiedza + pomysły + wspólne budowanie + realny dorobek.
- Sprint na landingu został wizualnie zdegradowany do programu społeczności, a nie głównego filaru produktu.

### Społeczność
- „Aktualności” zostały przemianowane na „Społeczność”.
- Dodane realne typy publikacji: Pytanie, Wiedza / doświadczenie, Pomysł.
- Composer zachęca do dzielenia się wiedzą, pytaniami i pomysłami, nie tylko klasycznymi postami.
- Rozszerzono obsługiwane `SocialPostKind` o QUESTION, KNOWLEDGE i IDEA. Pole w DB jest tekstowe, więc ta zmiana nie wymaga migracji enumu w bazie.

### Profile / portfolio
- Publiczny profil mocniej eksponuje „Buduje teraz” i „Zbudował/a”.
- Sekcje współpracy i realnego dorobku są wyżej niż klasyczne informacje profilowe.
- Copy podkreśla wiarygodny proof of work zamiast samej listy umiejętności.

### Ludzie i projekty
- BuilderCard ogranicza dominację sztucznie precyzyjnego match score i pokazuje jakościowe dopasowanie.
- ProjectCard pokazuje jakościowe dopasowanie, wolne miejsca, stan zespołu, dostępność i świeżość projektu czytelniej.
- Poprawiono polską odmianę liczby osób i wolnych miejsc.
- Karty i opisy są bardziej nastawione na „co budują i kogo potrzebują”.

### Dashboard / onboarding
- Dashboard mocniej kieruje użytkownika do Społeczności i działań „na teraz”.
- Onboarding ma poprawione polskie teksty dotyczące dostępności, współpracy i otwartości.
- Kreator projektu ma poprawne polskie nazwy kroków i etykiety.

### PL / EN
Naprawiono m.in.:
- publiczną stronę projektów,
- onboarding,
- kreator projektu,
- ustawienia powiadomień e-mail,
- formularze i widoki hackathonów,
- helpery hackathonów, które wcześniej ignorowały locale,
- fragmenty Build Pool / Challenge,
- panel admina: aktywność, treści, zdjęcia profilowe, hackathony i część Sprintu,
- pojedyncze etykiety typu Match / Challenge / Team.

Nazwy technologii i przyjęte branżowe terminy typu GitHub, React, Figma, SaaS, API, Demo pozostają bez sztucznego tłumaczenia.

### Bugfixy / porządki
- Naprawiono uszkodzony JSX w formularzu ręcznego tworzenia zespołu hackathonowego.
- Naprawiono uszkodzony stary fragment JSX w ShowcaseCard przy liczniku opinii.
- Usunięto martwy katalog `src/components/ideas`; aktywne `/ideas` i `/ideas/[id]` już tylko przekierowują do projektów.
- `.env.local` nie jest dołączony do tej paczki.
- `node_modules` i `tsconfig.tsbuildinfo` nie są dołączone do ZIP-a.

## Weryfikacja
- `node scripts/check-punctuation.mjs` — OK
- `node scripts/check-bilingual-ui.mjs` — OK
- pełny skan składni/transpilacji wszystkich 288 plików TS/TSX w `src` — 0 błędów

Pełny `tsc --noEmit` nie został potwierdzony, ponieważ wejściowy ZIP nie zawierał `node_modules`, a instalacja zależności w środowisku roboczym nie została ukończona. Próba typechecka zatrzymała się na brakujących paczkach typów, a nie na błędach patcha.

## Celowo poza tym patchem
Nie dodawano atrap funkcji wymagających nowego modelu danych / workflow, m.in. pełnego systemu potwierdzania współpracy po zakończeniu projektu, globalnego Ctrl+K czy rozbudowanej reputacji. To powinno być osobnym patchem z backendem i migracjami, a nie samą warstwą UI.
