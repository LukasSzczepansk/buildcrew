# BuildCrew English-only migration

This patch changes BuildCrew from a PL/EN dual-language product into one global English-language platform.

## Target setup

- Primary product domain: `https://buildcreww.com`
- `https://buildcreww.pl/*` redirects permanently to the same path on `.com`
- `https://www.buildcreww.com/*` redirects to `https://buildcreww.com/*`
- One application, one database, the same accounts, projects, messages and teams
- All system UI, new transactional notifications and emails use English
- Collaboration languages on profiles remain multi-language data (English, Polish, German, etc.)

## What happens to the existing users

Existing accounts are preserved. This patch does not create a second database and does not delete profiles, projects, applications or messages.

Run the included migration script once:

```powershell
node scripts/migrate-english-only.mjs
```

It only:

1. changes existing user `preferred_locale` values to `en`,
2. changes the database default locale for new users to `en`,
3. changes the database default project language to `EN`,
4. prints a list of legacy projects that still need manual translation.

It deliberately does **not** mark old Polish projects as English.

## Legacy Polish projects

Legacy projects with `project_language != EN` are hidden from:

- public landing project cards,
- global project discovery,
- public profile project history,
- public project share cards,
- followed-project update feeds,
- public sitemaps.

Their owners can still access them through **My Projects**.

For each old project:

1. Open **My Projects**.
2. Open the project.
3. Go to **Manage**.
4. Find **Public project content**.
5. Translate the project name, tagline, description, next goal, owner contribution, role notes and any existing public updates shown in the form.
6. If applicable, translate project outcome and funding-use text.
7. Click **Save and publish globally**.

Only then is the project marked `EN` and returned to global discovery.

This avoids showing Polish projects to new international users and avoids pretending an untranslated project is English.

## Existing profile bios

The product UI is English-only, but existing free-text user content (for example a Polish bio or an old private message) is not machine-translated. Users should update their public headline and bio in English from profile settings. Structured fields such as role, skills, country, collaboration languages and availability remain usable globally.

The landing page intentionally does not depend on an existing free-text headline, so old Polish headlines are not used as the main international homepage hook.

## Ideas

The old Ideas area is no longer part of the global discovery flow. `/ideas` and `/ideas/*` redirect to `/projects`. Existing database records are preserved, but new international onboarding focuses on People + Projects.

## Environment variables

Use the `.com` address as the canonical application URL in local/production environment variables:

```env
NEXT_PUBLIC_APP_URL=https://buildcreww.com
NEXT_PUBLIC_APP_URL_EN=https://buildcreww.com
```

`NEXT_PUBLIC_APP_URL_PL` is no longer required by the product logic. It can be removed after deployment.

## Vercel domains

In Vercel, attach all domains to the same BuildCrew project:

- `buildcreww.com`
- `www.buildcreww.com`
- `buildcreww.pl`
- optionally `www.buildcreww.pl`

Make `buildcreww.com` the canonical production domain. Do not configure Vercel to redirect the apex `.com` to `www`; this patch expects the opposite direction.

Recommended domain behavior:

```text
buildcreww.com            -> application
www.buildcreww.com        -> 308 -> buildcreww.com
buildcreww.pl             -> 308 -> buildcreww.com
www.buildcreww.pl         -> 308 -> buildcreww.com
```

If Vercel has an existing domain-level redirect from `buildcreww.com` to `www.buildcreww.com`, remove/reverse it in the Domains settings.

## Google OAuth

Keep the same Google OAuth client. Make sure it contains the `.com` origin and callback:

Authorized JavaScript origin:

```text
https://buildcreww.com
```

Authorized redirect URI:

```text
https://buildcreww.com/api/auth/google/callback
```

You can keep the old `.pl` callback temporarily while existing links are being phased out.

## Existing sessions

Cookies cannot be shared between `.pl` and `.com`. Existing users may need to sign in once on `.com`. Their account and data are unchanged because both domains use the same database.

## Apply the patch

After overwriting the project files:

```powershell
npm run typecheck
npm run build
```

Then, after making a database backup if this is your production database:

```powershell
node scripts/migrate-english-only.mjs
```

No destructive schema migration is included. The script only changes locale/default values described above.

Run locally:

```powershell
npm run dev
```

Test at minimum:

- landing page,
- sign up / sign in,
- onboarding,
- Home,
- People,
- Projects,
- My Projects,
- project Manage page,
- public project `/p/:id`,
- public profile `/u/:username`,
- Messages,
- Help,
- Hackathons,
- email verification/password reset,
- Google OAuth.

## Git / Vercel deployment

After tests pass:

```powershell
git status
git add .
git commit -m "Make BuildCrew English-only"
git push origin main
```

If Vercel is connected to GitHub and `main` is the production branch, the push should trigger the production deployment automatically.

## Legal note

The patch includes working English Terms and Privacy pages. They are product copy, not legal certification. Before marketing the service internationally at scale, have the final Terms and Privacy Policy reviewed for your actual business/operator setup and data-processing practices.
