-- BuildCrew trial tasks ("mini-proby").
-- A project owner attaches a short, time-boxed task to an open role; a candidate does it before joining.
-- Apply once before using the feature (psql "$DATABASE_URL" -f database/migrations/20261023_trial_tasks.sql
-- or run npm run db:push). Safe to run repeatedly. Until it is applied the app simply hides the feature.

create table if not exists trial_tasks (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  role_id uuid not null references project_roles(id) on delete cascade,
  title text not null,
  brief text not null,
  time_limit_minutes integer not null default 120,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint trial_tasks_time_limit_check check (time_limit_minutes between 30 and 480)
);

-- At most one active trial task per role.
create unique index if not exists trial_tasks_role_active_idx on trial_tasks(role_id) where is_active;
create index if not exists trial_tasks_project_idx on trial_tasks(project_id);

create table if not exists trial_task_attempts (
  id uuid primary key,
  trial_task_id uuid not null references trial_tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'STARTED',
  started_at timestamptz not null default now(),
  due_at timestamptz not null,
  submitted_at timestamptz,
  submission_url text,
  submission_note text,
  add_to_portfolio boolean not null default true,
  reviewed_at timestamptz,
  review_note text,
  portfolio_item_id uuid references portfolio_items(id) on delete set null,
  constraint trial_task_attempts_status_check check (status in ('STARTED', 'SUBMITTED', 'PASSED', 'FAILED'))
);

-- A candidate gets exactly one attempt per task.
create unique index if not exists trial_task_attempts_task_user_idx on trial_task_attempts(trial_task_id, user_id);
create index if not exists trial_task_attempts_user_idx on trial_task_attempts(user_id, started_at);
