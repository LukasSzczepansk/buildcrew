# BuildCrew International EN - deployment checklist

Ten patch rozwija BuildCrew jako jeden wspólny produkt na dwóch domenach:

- `buildcreww.pl` - domyślnie polski interfejs,
- `buildcreww.com` - domyślnie angielski interfejs,
- jedna aplikacja,
- jedna baza PostgreSQL,
- te same konta, projekty, wiadomości, relacje i hackathony.

Nie twórz osobnej bazy ani osobnego środowiska danych dla użytkowników zagranicznych.

## 0. Zrób backup bazy

Patch rozszerza schemat danych o ustawienia międzynarodowe. Przed `db:push` zrób aktualny backup produkcyjnej bazy PostgreSQL.

## 1. Zainstaluj i sprawdź projekt lokalnie

```bash
npm ci
npm run typecheck
npm run build
```

Dopiero jeśli oba ostatnie polecenia przechodzą, wdrażaj patch.

## 2. Zaktualizuj schemat bazy

Patch dodaje m.in.:

### users
- `preferredLocale` (`pl` / `en`)

### profiles
- `headline`
- `country`
- `city`
- `languages[]`
- `workModePreference`

### projects
- `projectLanguage`
- `country`
- `marketScope`
- `needs[]`
- `fundingStage`
- `fundingAmount`
- `fundingUse`
- `pitchDeckUrl`

Po backupie:

```bash
npm run db:push
```

Istniejące konta nie są kasowane. Nowe pola mają bezpieczne wartości domyślne tam, gdzie jest to wymagane. Obecni użytkownicy mogą później uzupełnić języki, kraj i preferowany tryb współpracy.

## 3. Environment Variables w Vercel

Ustaw w tym samym projekcie Vercel:

```env
NEXT_PUBLIC_APP_URL=https://buildcreww.pl
NEXT_PUBLIC_APP_URL_PL=https://buildcreww.pl
NEXT_PUBLIC_APP_URL_EN=https://buildcreww.com
NEXT_PUBLIC_DEFAULT_LOCALE=pl
```

Pozostałe sekrety (`DATABASE_URL`, OAuth, Resend, cron itd.) pozostają wspólne.

## 4. Domeny

Obie domeny muszą wskazywać na TEN SAM projekt Vercel:

```text
buildcreww.pl
buildcreww.com
www.buildcreww.com  # opcjonalnie jako redirect
```

Nie rozdzielaj userów na osobne deploymenty.

## 5. Jak działa język

- `.pl` daje domyślnie PL,
- `.com` daje domyślnie EN,
- przełącznik `PL | EN` pozwala zmienić wersję,
- wybór języka jest zapisywany również w `users.preferredLocale`,
- język interfejsu jest czymś innym niż języki współpracy wpisane w profilu.

Przykład:

```text
Interface: Polish
Languages: Polish, English
Location: Warsaw, Poland
Work mode: Remote
```

Taki polski użytkownik może być rekomendowany osobie zagranicznej, jeśli mają wspólny język i pasujące preferencje.

## 6. Google OAuth

W Google Cloud dodaj oba origins:

```text
https://buildcreww.pl
https://buildcreww.com
```

oraz oba callbacki:

```text
https://buildcreww.pl/api/auth/google/callback
https://buildcreww.com/api/auth/google/callback
```

Ta sama baza oznacza to samo konto. Sesyjne cookie jest host-specific, więc użytkownik przechodzący pierwszy raz z `.pl` na `.com` może zostać poproszony o ponowne logowanie, ale nie tworzy mu to drugiego profilu.

## 7. Co patch dodaje do produktu międzynarodowego

- preferowany locale konta,
- języki współpracy profilu,
- kraj i miasto,
- tryb współpracy: remote / hybrid / on-site / flexible,
- headline profilu,
- język projektu,
- zasięg projektu: local / Europe / worldwide,
- potrzeby projektu: teammates / feedback / beta testers / mentor / business partner / funding,
- proste pola funding,
- międzynarodowe filtry People i Projects,
- matching uwzględniający język, lokalizację i tryb pracy,
- `Why you match` dla projektów,
- angielskie kluczowe flow: landing, auth, onboarding, People, Projects, profile, project creation, application, invitations, messages i notifications,
- landing `.com` z prawdziwymi aktywnymi projektami oraz builderami open to projects,
- locale-aware public profiles/projects,
- poprawione linki i domeny w kluczowych mailach/powiadomieniach,
- locale-aware SEO/hreflang/canonical,
- ustawienia international discovery dla istniejących projektów.

Treści wpisane przez użytkowników, np. bio lub opis starego projektu, nie są automatycznie tłumaczone. To celowe.

## 8. Co z obecnymi ~70 użytkownikami

Nie migruj ich do osobnej bazy i nie zakładaj nowych kont.

Po wdrożeniu:

1. nadal logują się normalnie na `.pl`,
2. ich projekty i wiadomości zostają,
3. dashboard może poprosić ich o uzupełnienie `Languages` i `Country`,
4. po dodaniu `English` mogą być dopasowywani do zagranicznych projektów,
5. właściciele starych projektów mogą ustawić język projektu, zasięg i aktualne potrzeby.

## 9. Test produkcyjny przed promocją `.com`

Sprawdź przynajmniej:

1. `.pl` w incognito -> PL.
2. `.com` w incognito -> EN.
3. PL/EN switch na obu domenach.
4. Rejestracja przez email na `.com`.
5. Verification email prowadzi na właściwy host.
6. Google Login na `.com`.
7. Istniejące polskie konto loguje się na `.com` i widzi te same dane.
8. Onboarding EN: English language, country, work mode.
9. People EN: filtry language/country i poprawny matching.
10. Projects EN: filtry language/reach/needs/country i sortowanie po matchu.
11. Utworzenie EN projektu z `Project language: English`, `Worldwide`, potrzebami projektu.
12. Public profile i public project bez logowania.
13. Apply / invite / message / notification po angielsku.
14. Edycja international settings starego projektu.
15. Landing `.com` pokazuje realne projekty i osoby.
16. `/sitemap.xml`, canonical i hreflang na obu hostach.
17. Mobile: dłuższe angielskie teksty nie rozwalają layoutu.

## 10. Terms / Privacy

Kod może pokazać angielski interfejs stron legalnych, ale finalne angielskie Terms of Service i Privacy Policy powinny zostać sprawdzone prawnie przed większą promocją międzynarodową.

## 11. Deploy przez GitHub

Po testach lokalnych i `db:push`:

```bash
git status
git add .
git commit -m "Prepare BuildCrew international English experience"
git push origin main
```

Jeżeli Vercel jest połączony z `main`, deployment produkcyjny ruszy automatycznie.

## 12. Po deployu

Nie promuj jeszcze masowo `.com`, dopóki nie przejdziesz testu jako całkowicie nowy user EN. Najważniejszy scenariusz:

`Landing -> signup -> onboarding -> recommended project/person -> profile/project -> apply/invite -> message -> email -> return`

W tym flow nie powinno pojawić się przypadkowe polskie copy systemowe.
