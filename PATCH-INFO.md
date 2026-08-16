# BuildCrew - dual-domain PL/EN patch

## Cel

Jedna aplikacja i jedna baza danych, ale dwa wejścia:

- `.pl` -> polski interfejs,
- `buildcreww.com` -> angielski interfejs.

Obecni użytkownicy, projekty i dane nie są przenoszone ani duplikowane.

## Najważniejsze zmiany

- host-aware locale (`pl` / `en`),
- przełącznik `PL | EN` przenoszący między domenami,
- dynamiczne `lang`, metadata i podstawowe SEO/hreflang,
- osobne publiczne aliasy EN: `/explore/projects`, `/explore/hackathons`,
- sitemap i robots generowane dla aktualnego hosta,
- Google OAuth korzysta z originu requestu, dzięki czemu działa z obu domen,
- weryfikacja e-mail / reset hasła zachowują domenę i język requestu,
- angielska wersja najważniejszego flow: landing -> auth -> onboarding -> discovery -> profil/projekt -> aplikowanie,
- przetłumaczone główne komponenty kart, filtrów, matchingu, follow/share/update,
- jedna wspólna baza i wspólne konta.

## Konfiguracja

Pełna instrukcja: `DUAL-DOMAIN-SETUP.md`.

Najważniejsze envy:

```env
NEXT_PUBLIC_APP_URL=https://buildcreww.pl
NEXT_PUBLIC_APP_URL_PL=https://buildcreww.pl
NEXT_PUBLIC_APP_URL_EN=https://buildcreww.com
NEXT_PUBLIC_DEFAULT_LOCALE=pl
```

Jeśli Twoja domena `.pl` ma inną nazwę, wpisz dokładny aktualny URL zamiast przykładu `buildcreww.pl`.

## Google OAuth

Dodaj w Google Cloud oba callbacki:

```text
https://buildcreww.pl/api/auth/google/callback
https://buildcreww.com/api/auth/google/callback
```

## Baza

Ten patch i18n/dual-domain **nie dodaje nowych kolumn i nie wymaga migracji bazy**. Korzysta z obecnej wspólnej bazy.

## Sesje

Cookie sesyjne `__Host-...` jest host-only. To prawidłowe i bezpieczne. Użytkownik przechodzący pierwszy raz z `.pl` na `.com` musi zalogować się na `.com` jeden raz, ale trafia do tego samego konta w tej samej bazie.

## Walidacja patcha

- parser/syntax check wszystkich plików `src/**/*.ts(x)`: OK,
- `node scripts/check-punctuation.mjs`: OK,
- pełny `npm ci` / `npm run typecheck` nie był możliwy w środowisku przygotowania patcha, bo instalacja zależności z registry nie została ukończona.

## Ważne przed większym EN launch'em

Część głębszych ekranów (workspace/admin/niektóre dialogi i background notifications) nadal może zawierać polskie teksty. Dokumenty prawne wymagają osobnej, profesjonalnej wersji EN. Szczegóły są w `DUAL-DOMAIN-SETUP.md`.
