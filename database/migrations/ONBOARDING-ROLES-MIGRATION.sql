-- BuildCrew role-aware onboarding
-- Adds broad disciplines selected during onboarding (1-2 per user).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS disciplines text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill existing profiles so filters/profile editing have sensible data.
UPDATE profiles
SET disciplines = CASE role
  WHEN 'FRONTEND' THEN ARRAY['DEVELOPMENT']::text[]
  WHEN 'BACKEND' THEN ARRAY['DEVELOPMENT']::text[]
  WHEN 'FULLSTACK' THEN ARRAY['DEVELOPMENT']::text[]
  WHEN 'MOBILE' THEN ARRAY['DEVELOPMENT']::text[]
  WHEN 'UI_UX' THEN ARRAY['DESIGN']::text[]
  WHEN 'AI_ML' THEN ARRAY['DATA_AI']::text[]
  WHEN 'PRODUCT' THEN ARRAY['PRODUCT']::text[]
  WHEN 'MARKETING' THEN ARRAY['MARKETING_GROWTH']::text[]
  ELSE ARRAY['OTHER']::text[]
END
WHERE cardinality(disciplines) = 0 AND role IS NOT NULL;
