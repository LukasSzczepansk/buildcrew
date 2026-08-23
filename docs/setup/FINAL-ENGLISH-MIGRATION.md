# BuildCrew — final English-only migration

This patch finishes the English-only product pass and adds a one-off migration for existing Polish content already stored in PostgreSQL.

## What this patch does

- Keeps the existing users, projects, teams, applications, network and messages.
- Makes the application UI English-only.
- Keeps `buildcreww.com` as the canonical application domain.
- Adds a CI/typecheck guard that fails when Polish-looking user-facing strings are reintroduced under `src/`.
- Adds a safe, dry-run-first content migration for existing Polish database content.
- Creates a JSON backup before any translated database content is written.
- Includes a restore command.

The migration translates public and product-facing content including:

- profile headline, bio, country and city;
- project name, tagline, description, contribution, goal, funding use, outcome and interests;
- project role descriptions and role skills;
- project updates;
- project workspace focus, milestones, tasks and link labels;
- Build Pool listing copy;
- collaboration endorsement notes;
- Help questions, tags and answers;
- hackathon summaries, descriptions, themes, participant ideas and team ideas;
- Build Challenges;
- Showcase entries and Showcase feedback;
- existing notification titles/bodies;
- profile photo moderation rejection reason.

It intentionally does **not** rewrite private 1:1 messages, workspace chat messages, application/invitation private messages or moderation reports. Those are user conversation/history and should not be silently modified.

## 1. Overlay the patch

Copy this patch over your current BuildCrew repository and overwrite matching files.

## 2. Validate the code first

```powershell
npm run typecheck
npm run build
```

Do not continue to the database migration until both commands pass.

## 3. Create a database snapshot/backup

Before rewriting existing content, create a backup/snapshot in your database provider. The translation script also creates its own JSON content backup, but a provider-level database backup is still recommended.

## 4. Scan existing content without changing anything

```powershell
npm run content:scan-polish
```

This reports how many Polish-looking database fields were detected. It does not call the translation API and does not write changes.

## 5. Temporarily set an OpenAI API key

In the same PowerShell window:

```powershell
$env:OPENAI_API_KEY="YOUR_API_KEY"
```

Optional model override:

```powershell
$env:OPENAI_TRANSLATION_MODEL="gpt-5-mini"
```

Do **not** put the key in `NEXT_PUBLIC_*`, commit it to Git, or expose it to the browser.

## 6. Translate existing Polish content to English

```powershell
npm run content:translate-en
```

Before the first database update, the script writes a backup such as:

```text
backups/english-content-2026-08-16T....json
```

The `backups/` directory is ignored by Git because it can contain user content.

After a full successful run, existing users are set to English locale and existing projects are marked as English for global discovery. New users/projects also keep English defaults.

## 7. Remove the temporary API key

```powershell
Remove-Item Env:OPENAI_API_KEY
```

## 8. Review the application locally

```powershell
npm run dev
```

Review at minimum:

- `/`
- `/dashboard`
- `/builders`
- `/projects`
- `/my-projects`
- `/network`
- `/messages`
- `/help`
- `/hackathons`
- `/showcase`
- `/profile`
- several public `/p/...` project pages
- several public `/u/...` profiles

Also review the translated project descriptions manually. Automatic translation preserves the original facts, but project owners should still verify wording before heavy international promotion.

## 9. Restore translated content if needed

Use the exact JSON backup file created by the migration:

```powershell
npm run content:restore -- backups/english-content-YYYY-MM-DDTHH-MM-SS.json
```

This restores the backed-up content, profile language arrays, previous user locales and previous project-language values. The platform defaults remain English because the product itself is now English-only.

## 10. Push to GitHub / Vercel

```powershell
git status
git add .
git commit -m "Finish English-only BuildCrew and migrate existing content"
git push origin main
```

If the Vercel project is connected to `main`, the push triggers the production deployment automatically.

## Important domain setup

The intended canonical setup is:

```text
buildcreww.com      -> Production
www.buildcreww.com  -> 308 -> buildcreww.com
buildcreww.pl       -> 308 -> buildcreww.com
```

Do not configure `buildcreww.com -> www.buildcreww.com` at the Vercel domain layer while the app redirects `www -> apex`, because that creates an infinite redirect loop.

## No `db:push` is required for this final patch

This patch operates on the schema introduced by the previous international/English patch. It does not add another database column. If your current local app already runs successfully against the international schema, do not run `db:push` just for this patch.
