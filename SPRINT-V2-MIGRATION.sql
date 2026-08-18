-- BuildCrew Sprint v2
-- Run once if you prefer SQL over `npm run db:push`.

ALTER TABLE build_challenges
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS participant_status text NOT NULL DEFAULT 'APPLIED',
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS decision_at timestamptz;

CREATE INDEX IF NOT EXISTS challenge_participants_status_idx
  ON challenge_participants (challenge_id, participant_status);

CREATE TABLE IF NOT EXISTS sprint_check_ins (
  id uuid PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES build_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_key text NOT NULL,
  health text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sprint_check_ins_week_unique_idx
  ON sprint_check_ins (challenge_id, user_id, week_key);
CREATE INDEX IF NOT EXISTS sprint_check_ins_challenge_idx
  ON sprint_check_ins (challenge_id, updated_at);

CREATE TABLE IF NOT EXISTS sprint_announcements (
  id uuid PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES build_challenges(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'ALL',
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sprint_announcements_challenge_idx
  ON sprint_announcements (challenge_id, created_at);
