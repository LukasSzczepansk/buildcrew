-- BuildCrew native profile portfolio
-- Apply once before deploying this patch (or run npm run db:push).

create table if not exists portfolio_items (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  description text,
  role text,
  tools text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portfolio_items_user_updated_idx on portfolio_items(user_id, updated_at);

create table if not exists portfolio_images (
  id uuid primary key,
  item_id uuid not null references portfolio_items(id) on delete cascade,
  sort_order integer not null default 0,
  mime_type text not null default 'image/webp',
  image_base64 text not null,
  byte_size integer not null,
  width integer not null,
  height integer not null,
  created_at timestamptz not null default now()
);
create index if not exists portfolio_images_item_order_idx on portfolio_images(item_id, sort_order);
