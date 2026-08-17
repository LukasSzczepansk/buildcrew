# BuildCrew pre-launch network patch

This patch focuses the launch experience on People, Projects, professional opportunities and verified collaboration.

## Included

- stronger People matching using role, skills, interests, availability, experience, language, work mode, country, intent and recent activity;
- visible "Why connect" / match reasons;
- direct project invitations from People discovery;
- 7-day collaboration check-in for accepted project members; both sides must confirm before the relationship becomes a verified BuildCrew collaboration;
- collaboration endorsements restricted to verified owner/member collaborations;
- reports for users, projects and individual messages;
- blocking from profiles and conversations;
- lower outreach limits for accounts created in the last 24 hours, plus existing persistent rate limits;
- GitHub sign-in and optional GitHub profile enrichment;
- visual activity feed cards generated deterministically from project/activity data (no external image dependency);
- optional realistic sample profiles/projects, always visibly labelled Sample/Demo;
- updated English Terms and Privacy copy for the current product direction.

## Database

The patch adds fields to `auth_accounts`, `project_members`, `reports` and notification/event types.

1. Back up the production database.
2. Run `npm run db:push` and inspect the proposed operations. Do not approve unexpected drops.
3. Run `npm run collaboration:prepare` after the schema update. This confirms owner rows and past completed-project memberships, while active non-owner memberships remain pending for real confirmation.

## GitHub OAuth

Create a GitHub OAuth App for the production domain and set:

- Homepage URL: `https://buildcreww.com`
- Authorization callback URL: `https://buildcreww.com/api/auth/github/callback`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

For local testing, use a separate development OAuth App with a localhost/loopback callback and put its credentials only in `.env.local`.

## Sample launch content

Run:

`npm run launch:seed-samples`

This creates four polished demonstration profiles and four demonstration projects. Their emails use the reserved `.invalid` domain and BuildCrew marks them as Demo/Sample. They are meant to make empty states understandable, not to impersonate real users or customers.

Remove them at any time with:

`npm run launch:remove-samples`

## Before deployment

Run:

`npm run typecheck`
`npm run build`

Then test login/signup with email, Google and GitHub; People matching; project invitation/application; messaging/report/block; collaboration confirmation; endorsement; and the Home activity feed on desktop and mobile.

## Legal review

The Terms and Privacy pages were updated to match these product features, but they are product copy rather than jurisdiction-specific legal advice. Review the operator details and obtain legal review before a broad commercial launch if needed.
