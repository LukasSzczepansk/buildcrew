# BuildCrew - retention email patch

Ten patch dodaje powiadomienia e-mail, których celem jest przywracanie użytkownika wtedy, gdy na BuildCrew wydarzyło się coś realnie wartego sprawdzenia.

## Co dodaje

- e-mail o nowej wiadomości, ale tylko gdy odbiorca nie jest aktywny i nie ma już nieprzeczytanej wiadomości w tej rozmowie,
- e-mail o zaproszeniu / zgłoszeniu do projektu,
- e-mail o akceptacji i odrzuceniu zgłoszenia,
- e-mail o mocnych dopasowaniach builderów i projektów,
- tygodniowy digest z najlepszymi dopasowaniami i liczbą nieprzeczytanych wiadomości,
- ustawienia wszystkich tych kategorii w profilu,
- spójny szablon e-mail BuildCrew: off-white / black / lime,
- cron jobs na Vercelu,
- cooldown 72h dla maili o dopasowaniach,
- brak maila o matchach, jeśli użytkownik był aktywny w ostatnich 6 godzinach.

## Wymagane po podmianie plików

Zmienia się schema bazy (`notification_preferences`), więc uruchom:

```bash
npm run db:push
npm run dev
```

## Vercel Environment Variables

Ustaw w Vercel → Project → Settings → Environment Variables:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=BuildCrew <hello@twojadomena.pl>
NEXT_PUBLIC_APP_URL=https://twojadomena.pl
CRON_SECRET=dlugi-losowy-sekret
```

`CRON_SECRET` powinien być długim, losowym sekretem i nie może trafić do repozytorium.

## Resend

Domena użyta w `EMAIL_FROM` musi być zweryfikowana w Resend. API key pozostaje wyłącznie po stronie serwera.

## Harmonogram

`vercel.json`:

- mocne dopasowania: wtorek–sobota, 08:00 UTC,
- tygodniowy digest: poniedziałek, 08:00 UTC.

Poniedziałek jest celowo wyłączony z maili o matchach, żeby użytkownik nie dostał dwóch retention maili tego samego ranka.
