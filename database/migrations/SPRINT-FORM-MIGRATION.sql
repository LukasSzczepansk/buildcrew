ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS application_data jsonb;

ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
