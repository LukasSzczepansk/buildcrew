# Apply this BuildCrew patch

1. Back up your project and database.
2. Copy this ZIP over the current project and overwrite matching files.
3. Run `npm ci` if needed, then `npm run typecheck` and `npm run build`.
4. This patch changes the database schema. Run `npm run db:push`, inspect the proposed SQL operations, and do not approve unexpected drops.
5. Run `npm run collaboration:prepare`.
6. Configure GitHub OAuth using `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` as described in `PRELAUNCH-NETWORK-SAFETY-GITHUB.md`.
7. Optional launch content: `npm run launch:seed-samples`. All seeded content is visibly labelled Sample/Demo. Remove it with `npm run launch:remove-samples`.
8. Test People matching, Why connect, project invites, messaging, report/block, 7-day collaboration confirmation, endorsements, GitHub login and Home activity feed.
9. Push to GitHub only after typecheck/build pass.
