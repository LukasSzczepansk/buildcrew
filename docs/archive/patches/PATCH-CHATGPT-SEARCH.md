# BuildCrew — ChatGPT Search / SEO patch

Ten patch nie gwarantuje wyświetlania w ChatGPT Search. Jego celem jest usunięcie typowych przeszkód technicznych i zwiększenie trafności publicznych treści BuildCrew.

## Co zmienia

- jawnie zezwala `OAI-SearchBot` na dostęp do publicznych stron,
- blokuje crawl prywatnych ekranów aplikacji (wiadomości, dashboard, onboarding, API itp.),
- rozbudowuje `sitemap.xml` o publiczne profile, projekty i strony discovery,
- dodaje globalne ustawienia `index/follow` i pełne preview dla crawlerów,
- ujednolica domenę kanoniczną przez `NEXT_PUBLIC_APP_URL`,
- jako bezpieczny fallback używa `https://buildcreww.pl`,
- poprawia domenę na grafikach Open Graph / Twitter,
- dodaje 4 publiczne, indeksowalne strony wysokiej intencji:
  - `/znajdz/ludzi-do-projektu`
  - `/znajdz/programiste-do-projektu`
  - `/znajdz/ux-ui-designera-do-projektu`
  - `/znajdz/cofoundera`
- dodaje FAQ schema / WebPage schema na tych stronach,
- dodaje Organization + WebSite schema na landing page,
- dodaje link wewnętrzny z footera do poradnika o znajdowaniu ludzi.

## Po wdrożeniu

Na Vercelu ustaw:

```env
NEXT_PUBLIC_APP_URL=https://buildcreww.pl
```

Następnie zrób redeploy i sprawdź publicznie:

- `https://buildcreww.pl/robots.txt`
- `https://buildcreww.pl/sitemap.xml`
- `https://buildcreww.pl/znajdz/ludzi-do-projektu`

W `robots.txt` powinien być widoczny osobny wpis dla `OAI-SearchBot`.

## Ważne

Indeksacja nie jest natychmiastowa. Samo udostępnienie crawlerowi strony nie gwarantuje pozycji ani cytowania — znaczenie mają też trafność treści, publiczne wzmianki/linki i ogólna wiarygodność domeny.
