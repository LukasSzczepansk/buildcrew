# BuildCrew: .pl + .com na jednym produkcie

Ten patch uruchamia **jedną aplikację BuildCrew na dwóch domenach**, bez rozdzielania użytkowników, projektów ani bazy danych:

- domena `.pl` -> interfejs polski,
- `buildcreww.com` -> interfejs angielski,
- jedna baza PostgreSQL,
- te same konta, projekty, wiadomości i relacje.

Nie twórz osobnego projektu Vercel ani osobnej bazy dla wersji angielskiej.

## 1. Zmienne środowiskowe

W Vercel -> Project -> Settings -> Environment Variables dodaj / ustaw:

```env
# Zachowaj aktualny adres .pl. Jeżeli Twoja domena .pl ma inną nazwę,
# wpisz tutaj dokładny produkcyjny URL.
NEXT_PUBLIC_APP_URL=https://buildcreww.pl
NEXT_PUBLIC_APP_URL_PL=https://buildcreww.pl

# Domena międzynarodowa kupiona przez Ciebie.
NEXT_PUBLIC_APP_URL_EN=https://buildcreww.com

# Fallback dla localhost / preview.
NEXT_PUBLIC_DEFAULT_LOCALE=pl
```

`NEXT_PUBLIC_APP_URL` pozostaje dla zgodności ze starszym kodem i cronami. Ustaw go na aktualną domenę `.pl`.

Pozostałe sekrety (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `CRON_SECRET` itd.) pozostają takie jak obecnie.

## 2. Vercel: obie domeny do jednego projektu

W **tym samym** projekcie Vercel dodaj w Settings -> Domains:

```text
buildcreww.pl
buildcreww.com
```

Jeżeli Twoja aktualna domena `.pl` jest inna, oczywiście dodaj jej rzeczywistą nazwę.

Po dodaniu domen Vercel pokaże rekordy DNS, które trzeba ustawić u rejestratora domeny. Nie twórz drugiego deploymentu dla `.com`.

## 3. Jak wybierany jest język

Patch rozpoznaje host requestu:

```text
.pl  -> pl
.com -> en
```

W UI jest przełącznik `PL | EN`. Zmiana języka przenosi użytkownika na drugą domenę i zachowuje możliwie ten sam path/query.

Nie ma wymuszonego przekierowania po IP/kraju. To celowe: Polak mieszkający za granicą może chcieć PL, a osoba w Polsce może chcieć EN. Do zagranicznych kampanii i linków używaj po prostu `https://buildcreww.com`.

## 4. Co z obecnymi użytkownikami

Nic nie migrujesz.

Obecne konta w bazie pozostają bez zmian. Ten patch nie dodaje kolumny `locale` i nie rozdziela danych między domeny.

Ważne: sesja jest zapisana w bezpiecznym cookie `__Host-buildcrew_session`. Cookie jest przypisane do hosta, więc nie da się współdzielić jednej sesji pomiędzy niezależnymi domenami `.pl` i `.com`.

Praktycznie oznacza to:

- użytkownik zalogowany na `.pl` nadal pozostaje zalogowany na `.pl`,
- jeśli pierwszy raz wejdzie na `.com`, zaloguje się tam jeden raz,
- po zalogowaniu zobaczy **to samo konto i te same dane**, bo baza jest wspólna,
- nie powstaje drugie konto tylko dlatego, że zmieniła się domena.

Nie próbuj ustawiać cookie `Domain=` dla obu TLD - przeglądarki na to nie pozwalają i byłoby to gorsze bezpieczeństwo.

## 5. Google OAuth - konieczna konfiguracja

Kod OAuth został zmieniony tak, aby callback wracał na domenę, z której użytkownik rozpoczął logowanie.

W Google Cloud Console dodaj oba redirect URI do tego samego OAuth Client ID:

```text
https://buildcreww.pl/api/auth/google/callback
https://buildcreww.com/api/auth/google/callback
```

Jeśli aktualna domena `.pl` jest inna, podmień pierwszy URL na właściwy.

Warto też dodać oba Authorized JavaScript origins:

```text
https://buildcreww.pl
https://buildcreww.com
```

Bez drugiego redirect URI Google login na `.com` zostanie odrzucony przez Google.

## 6. E-maile i linki auth

Maile związane z rejestracją, weryfikacją adresu i resetem hasła korzystają z języka i domeny requestu. Jeżeli użytkownik poprosi o reset hasła na `.com`, link wróci na `.com`.

Starsze crony / część maili retention może nadal używać domyślnego `NEXT_PUBLIC_APP_URL` i polskich tekstów. Dlatego `NEXT_PUBLIC_APP_URL` zostaw na `.pl`. Pełne rozdzielenie wszystkich background maili na PL/EN można zrobić jako kolejny patch.

## 7. Routing publiczny

Polska wersja zachowuje stare adresy, żeby nie psuć istniejących linków:

```text
/projekty
/hackathony
```

Na `.com` przełącznik języka używa neutralnych aliasów:

```text
/explore/projects
/explore/hackathons
```

Publiczne profile i strony projektów zachowują wspólne ścieżki (`/u/...`, `/p/...`). Sitemap i robots są generowane dla aktualnej domeny.

## 8. SEO

Root metadata zawiera wersje językowe PL/EN (`hreflang`) wskazujące obie domeny. Każda domena generuje własny sitemap z poprawnym hostem.

Nie ustawiaj dwóch niezależnych canonicali na tę samą polską domenę.

## 9. Baza danych

**Dual-domain/i18n patch nie wymaga migracji bazy.**

Jeżeli wcześniej nie wdrożyłeś zmian schematu, które już były obecne w przekazanym projekcie (np. ustawienia powiadomień), wykonaj standardowo:

```bash
npm run db:push
```

Dla samego PL/EN nie pojawia się nowa tabela ani kolumna.

## 10. Co zostało przetłumaczone w tym patchu

Najważniejsza ścieżka pozyskania i aktywacji użytkownika:

- landing,
- logowanie / rejestracja / recovery / verification,
- onboarding i rekomendacje po onboardingu,
- główny layout, sidebar, topbar, mobile nav,
- dashboard/start (główne elementy),
- discovery ludzi,
- discovery projektów,
- dodawanie projektu,
- karta i szczegóły projektu,
- aplikowanie do projektu,
- follow/share/update projektu,
- publiczna lista i strona projektu,
- publiczne profile,
- lista i publiczna strona hackathonu,
- część wspólnych komunikatów, filtrów i powiadomień,
- podstawowe e-maile auth.

Treści wpisane przez użytkowników (bio, opis projektu, update) nie są automatycznie tłumaczone - pozostają w języku autora.

## 11. Co warto dokończyć przed pełnym międzynarodowym launch'em

Patch jest przygotowany jako rozsądny MVP ekspansji. W projekcie nadal są głębsze ekrany z polskimi tekstami, szczególnie część:

- workspace / zarządzanie zespołem,
- niektóre dialogi sieci i rekomendacji,
- część wiadomości systemowych generowanych po stronie serwera,
- część maili retention/cron,
- panel admina.

Najważniejsze: `/terms` i `/privacy` działają jako aliasy, ale obecne dokumenty prawne są po polsku. **Przed poważnym pozyskiwaniem użytkowników zagranicznych przygotuj profesjonalną angielską wersję regulaminu i polityki prywatności.** Nie traktuj automatycznego tłumaczenia jako porady prawnej.

## 12. Minimalny test po deployu

Sprawdź po kolei:

1. Otwórz `.pl` w incognito -> UI powinien być PL.
2. Otwórz `buildcreww.com` w incognito -> UI powinien być EN.
3. Kliknij `PL | EN` na obu domenach.
4. Załóż testowe konto na `.com` przez e-mail.
5. Zweryfikuj e-mail -> link powinien wrócić na `.com`.
6. Zaloguj się na `.com` przez Google.
7. Zaloguj się istniejącym polskim kontem na `.com` -> powinny być te same projekty/profil.
8. Utwórz projekt po EN i sprawdź publiczny link/share card.
9. Otwórz `/sitemap.xml` na obu domenach i sprawdź hosty URL-i.
10. Sprawdź reset hasła z `.pl` i `.com`.

## 13. Deployment

Po ustawieniu envów i domen:

```bash
npm ci
npm run typecheck
npm run build
```

Następnie deploy/redeploy na Vercelu.

W środowisku, w którym przygotowywany był patch, pełny `npm ci` nie mógł zostać dokończony z powodu braku dostępu do registry. Został wykonany parser/syntax check wszystkich plików TypeScript/TSX oraz projektowy `scripts/check-punctuation.mjs`.

---

## Aktualizacja: International EN production patch

Nowsza wersja patcha rozszerza także schemat bazy o locale, languages, location, project language/reach/needs oraz funding metadata. Dlatego sekcje powyżej opisujące brak zmian w bazie są nieaktualne dla tej wersji.

Przed wdrożeniem tej wersji użyj instrukcji:

`INTERNATIONAL-EN-SETUP.md`
