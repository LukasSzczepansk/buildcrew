-- BuildCrew: moduł Premiery (reuse istniejącego Showcase)
-- Uruchom raz na istniejącej bazie, albo użyj: npm run db:push

ALTER TABLE showcase_entries ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE showcase_entries ADD COLUMN IF NOT EXISTS technologies text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE showcase_entries ADD COLUMN IF NOT EXISTS needs text[] NOT NULL DEFAULT '{}'::text[];

UPDATE showcase_entries
SET slug = 'projekt-' || substr(replace(id::text, '-', ''), 1, 10)
WHERE slug IS NULL OR btrim(slug) = '';

CREATE UNIQUE INDEX IF NOT EXISTS showcase_entries_slug_idx ON showcase_entries(slug);

CREATE TABLE IF NOT EXISTS showcase_images (
  id uuid PRIMARY KEY,
  entry_id uuid NOT NULL REFERENCES showcase_entries(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'image/webp',
  image_base64 text NOT NULL,
  byte_size integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS showcase_images_entry_order_idx ON showcase_images(entry_id, sort_order);

CREATE TABLE IF NOT EXISTS showcase_comments (
  id uuid PRIMARY KEY,
  entry_id uuid NOT NULL REFERENCES showcase_entries(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id uuid,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS showcase_comments_entry_idx ON showcase_comments(entry_id, created_at);
CREATE INDEX IF NOT EXISTS showcase_comments_author_idx ON showcase_comments(author_id, created_at);

ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS launch_id uuid;
CREATE INDEX IF NOT EXISTS social_posts_launch_idx ON social_posts(launch_id, created_at);
