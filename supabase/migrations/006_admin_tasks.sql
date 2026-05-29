-- Phase 5 Step 23: Persistent admin task management
-- Run after 001–005. Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ---------------------------------------------------------------------------
-- admin_tasks table
-- ---------------------------------------------------------------------------

create table if not exists public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  task_key text not null,
  category text not null,
  severity text not null,
  title text not null,
  description text,
  lesson_id text,
  status text not null default 'open',
  priority text not null default 'normal',
  due_date date,
  admin_note text,
  assigned_to uuid,
  created_by uuid,
  resolved_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_tasks_task_key_unique unique (task_key)
);

create index if not exists admin_tasks_status_idx on public.admin_tasks (status);
create index if not exists admin_tasks_category_idx on public.admin_tasks (category);
create index if not exists admin_tasks_severity_idx on public.admin_tasks (severity);
create index if not exists admin_tasks_lesson_id_idx on public.admin_tasks (lesson_id);
create index if not exists admin_tasks_due_date_idx on public.admin_tasks (due_date);

comment on table public.admin_tasks is
  'Persisted admin task decisions (status, priority, due date, notes). Generated tasks merge at read time.';
comment on column public.admin_tasks.task_key is
  'Stable key from task generator, e.g. content:no-subtitles:5';
comment on column public.admin_tasks.status is
  'open | in_progress | resolved | dismissed';

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

drop trigger if exists admin_tasks_updated_at on public.admin_tasks;

create trigger admin_tasks_updated_at
  before update on public.admin_tasks
  for each row
  execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS — admins only
-- ---------------------------------------------------------------------------

alter table public.admin_tasks enable row level security;

drop policy if exists admin_tasks_select on public.admin_tasks;
create policy admin_tasks_select
  on public.admin_tasks
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists admin_tasks_insert on public.admin_tasks;
create policy admin_tasks_insert
  on public.admin_tasks
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists admin_tasks_update on public.admin_tasks;
create policy admin_tasks_update
  on public.admin_tasks
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists admin_tasks_delete on public.admin_tasks;
create policy admin_tasks_delete
  on public.admin_tasks
  for delete
  to authenticated
  using (public.is_admin());
