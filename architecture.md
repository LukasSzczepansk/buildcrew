# BuildCrew — Architecture

BuildCrew is a social platform for finding people to build projects with (developers, designers, founders). It runs as a single Next.js application deployed on **Vercel's free (Hobby) tier**, backed by a single PostgreSQL database. There are no separate backend services, no message queue, and no third-party file storage — everything lives inside one deploy to stay within free-tier limits.

## 1. Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19), TypeScript |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI + `lucide-react` icons, `class-variance-authority`/`clsx`/`tailwind-merge` |
| Forms/validation | `react-hook-form` + `zod` |
| ORM | Drizzle ORM (`drizzle-orm/node-postgres`) over `pg` |
| Database | PostgreSQL (single instance, external provider — e.g. Neon/Supabase/Vercel Postgres) |
| Auth | Custom cookie-based sessions (bcrypt password hashing), plus Google & GitHub OAuth |
| Email | Resend API |
| Notifications toaster | `sonner` |
| Hosting | Vercel (Hobby plan) |

There is no ORM-agnostic API layer and no separate REST/GraphQL backend — Next.js Server Components, Server Actions, and a small set of Route Handlers under `src/app/api` are the entire backend surface.

## 2. High-level structure

```
src/
  app/            Next.js App Router: pages, layouts, route handlers (src/app/api/**)
  components/     React components, grouped by feature domain (feed, projects, hackathons, ...)
  server/
    actions/      Server Actions ("use server") — mutations invoked directly from client components
    data/         Read-only query functions (Drizzle queries) used by pages/actions
    services/     Cross-cutting background-style logic (notifications, retention emails)
  db/
    schema.ts     Drizzle schema — ~70 tables, single source of truth for the DB
    index.ts      pg Pool + Drizzle client (singleton, reused across warm serverless invocations)
  lib/             Framework-agnostic helpers: auth, security, email templates, SEO, i18n, matching logic
database/migrations/   Hand-written SQL migration patches (ad hoc, not Drizzle-generated)
scripts/               Node maintenance/seed/CI scripts run via `npm run db:*`, `npm run check:*`
docs/                   Setup notes and historical migration write-ups
```

### Request flow

Most pages are React Server Components that call functions in `src/server/data/*` directly (no internal HTTP hop). Mutations from client components call Server Actions in `src/server/actions/*`, which validate input with `zod`, check the current session, write via Drizzle, and `revalidatePath`/redirect as needed. A small number of `route.ts`/`route.tsx` handlers under `src/app/api` exist for cases that need a real HTTP endpoint: OAuth callbacks, cron jobs, binary responses (avatars, OG share-cards), and a couple of REST-ish endpoints consumed by client-side fetches.

There is **no `middleware.ts`** — locale and auth decisions happen inside layouts/Server Components/Server Actions rather than at the edge.

## 3. Data layer

- Single PostgreSQL database, single Drizzle schema (`src/db/schema.ts`, ~1400 lines / ~70 tables) covering: users/auth/sessions, profiles & skills, projects/crews/project workspaces (chat, tasks, links), social feed (posts, likes, comments, saves), friends/follows/network, messaging, hackathons & teams, build challenges/sprints, showcase, job listings, notifications, moderation/admin audit logs, analytics events.
- `src/db/index.ts` creates one `pg.Pool` and reuses it via a `globalThis` cache in development to survive HMR; in production each serverless function gets its own pool per cold start (`DATABASE_URL` env var, no separate read replica).
- Migrations are plain SQL files under `database/migrations/`, applied manually — not generated/run through `drizzle-kit migrate`. `drizzle-kit push`/`studio` are available via `npm run db:push` / `db:studio` for local schema sync.
- Rate limiting is implemented as a Postgres-backed fixed-window counter (`rate_limit_buckets` table, `src/lib/security.ts`) instead of an in-memory store or Redis/Upstash — necessary because Vercel serverless functions are stateless and don't share memory, and this avoids paying for an extra rate-limiting service.

## 4. Authentication

Custom-built, not a third-party auth library:

- Email/password: bcrypt-hashed (`hashPassword`/`verifyPassword`), sessions stored server-side in a `sessions` table (`tokenHash` + `expiresAt`), the raw token lives in an `httpOnly`, `secure` (prod), `SameSite=Lax` cookie (`__Host-buildcrew_session` in production).
- OAuth: hand-rolled Google and GitHub flows (`src/lib/google-oauth.ts`, `src/lib/github-oauth.ts`) via `src/app/api/auth/google` / `src/app/api/auth/github`, linked through an `auth_accounts` table.
- Roles: `systemRole` on `users` (`ADMIN`/`MODERATOR`/plain user), with an `ADMIN_EMAILS` bootstrap fallback (disabled in production unless explicitly re-enabled) and a separate `admin_login_challenges` table for an extra admin-login verification step.
- Session lookups happen per-request in `getCurrentUser()` (`src/lib/auth.ts`), joined against `profiles`; expired/suspended sessions are treated as logged-out but not deleted mid-render (cleanup happens via the `db:maintenance` script instead).

## 5. File/media storage — no blob storage

The app deliberately avoids paid object storage (Vercel Blob, S3, etc.):

- Avatars, portfolio images, and launch images are stored as **base64-encoded bytes directly in Postgres** (e.g. `profile_avatars`, `portfolio_images`, launch image tables) and served through Route Handlers that decode and stream them back with `Content-Type`/`Cache-Control` headers (`src/app/api/avatar/[username]/route.ts`, `src/app/api/portfolio/images/[id]/route.ts`, `src/app/api/launches/images/[id]/route.ts`).
- Avatars go through an admin-approval queue (`api/admin/avatars`, `api/avatar/pending`) before becoming public.
- OG/share-card images are generated on the fly with Next.js's `ImageResponse` (`runtime = "nodejs"` route handlers under `.../share-card/route.tsx`) rather than pre-rendered and stored.

This keeps the app to a single infra dependency (Postgres) at the cost of putting binary data in the database — an intentional trade-off for staying on free tiers.

## 6. Scheduled jobs (Vercel Cron — Hobby tier)

Defined in `vercel.json`, using Vercel's free-tier cron (daily-granularity schedules, secret-protected):

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/matches` | `0 8 * * 2-6` (weekdays 08:00 UTC) | Project/people matching notifications |
| `/api/cron/weekly-digest` | `0 8 * * 1` (Monday 08:00 UTC) | Weekly email digest via Resend |
| `/api/cron/avatar-retention` | `30 3 * * *` (daily 03:30 UTC) | Cleans up stale/rejected pending avatars |

Each handler checks `cronAuthorized(request)` (`src/lib/cron.ts`, backed by a `CRON_SECRET` env var) before running, and sets `maxDuration = 60` to fit inside Hobby-tier function limits.

## 7. Internationalization (PL/EN)

- Single canonical domain and single deployment serve both languages — `src/lib/site-config.ts` explicitly notes this is **not** host-based routing ("locale is a UI preference, not a separate site"); an older per-domain (`buildcreww.pl` / `buildcreww.com`) approach documented in `docs/setup/DUAL-DOMAIN-SETUP.md` has been superseded.
- The active locale is read from a `buildcrew-locale` cookie (`src/lib/site-server.ts`, default `pl`), not from the URL or `Accept-Language`, and is set via `POST /api/locale`.
- A large set of legacy Polish marketing/SEO landing routes (`/znajdz-*`, `/dla-designerow`, `/poradniki/*`, `/hackathony`, etc.) exist alongside canonical English routes (`/explore/projects`, `/explore/hackathons`, `/terms`, `/privacy`); `next.config.ts` issues permanent redirects from the old Polish paths to the canonical ones.

## 8. Security & headers

Configured centrally in `next.config.ts` (`headers()`), applied to every route:

- Content-Security-Policy (self + Google Tag Manager for scripts, no third-party frames), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` locking down camera/mic/geolocation/payment/usb, `Cross-Origin-Opener-Policy`/`Cross-Origin-Resource-Policy: same-site`, and HSTS in production.
- `poweredByHeader: false` to avoid leaking the framework.
- App-level canonical-host redirects (in `next.config.ts`) send any known alternate hostname to the canonical `NEXT_PUBLIC_APP_URL`.
- `npm run security:check` (`scripts/security-check.mjs`) and `npm run launch:check` (`scripts/prelaunch-check.mjs`) act as manual pre-launch gates.

## 9. Analytics & SEO

- Google Analytics is loaded client-side with a consent banner gate (`src/components/analytics/*`) — no analytics events fire before consent.
- App also writes its own `analytics_events` table in Postgres for first-party event tracking.
- `robots.ts` and `sitemap.ts` are generated dynamically (App Router conventions); `opengraph-image.tsx`/`twitter-image.tsx` provide default social images; per-entity share-card routes generate custom OG images on demand.
- `llms.txt` is served as a static route for LLM crawlers.

## 10. Build & CI-adjacent scripts

`typecheck` runs three checks in sequence before `tsc --noEmit`: `check-punctuation.mjs` and `check-bilingual-ui.mjs`, both custom content-quality linters specific to this bilingual product. Other `npm run` scripts (`db:seed*`, `admin:promote`, `content:*`, `launch:*`) are one-off operational scripts run manually against the production or local database, not part of the Vercel build step.

## 11. Deployment model (Vercel Hobby constraints)

- Single Vercel project, single production deployment, both `buildcreww.pl` and `buildcreww.com` (if both are attached) point at the same deployment/database — explicitly documented as "do not create a second Vercel project or a second database" for the English domain.
- Everything that would normally need a paid add-on is deliberately avoided or replaced with a Postgres-backed equivalent: file storage → base64 in Postgres, rate limiting → Postgres table instead of Redis/Upstash, background jobs → Vercel Hobby cron hitting `maxDuration`-capped Route Handlers instead of a queue/worker.
- `GET /api/health` runs `select 1` against the database for uptime checks.
- Environment variables (Vercel Project Settings): `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` (+ legacy `_PL`/`_EN` variants), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `ADMIN_EMAILS`/`FOUNDER_EMAILS`/`ALLOW_ADMIN_EMAIL_BOOTSTRAP`.
