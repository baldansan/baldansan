-- Phase 5 Step 24: Admin activity log / audit trail
-- Run after 001–006. Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  lesson_id text,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_log_action_idx
  on public.admin_activity_log (action);
create index if not exists admin_activity_log_entity_type_idx
  on public.admin_activity_log (entity_type);
create index if not exists admin_activity_log_entity_id_idx
  on public.admin_activity_log (entity_id);
create index if not exists admin_activity_log_lesson_id_idx
  on public.admin_activity_log (lesson_id);
create index if not exists admin_activity_log_actor_user_id_idx
  on public.admin_activity_log (actor_user_id);
create index if not exists admin_activity_log_created_at_idx
  on public.admin_activity_log (created_at desc);

comment on table public.admin_activity_log is
  'Best-effort admin audit trail — insert-only for admins via RLS.';

alter table public.admin_activity_log enable row level security;

drop policy if exists admin_activity_log_select on public.admin_activity_log;
create policy admin_activity_log_select
  on public.admin_activity_log
  for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists admin_activity_log_insert on public.admin_activity_log;
create policy admin_activity_log_insert
  on public.admin_activity_log
  for insert
  to authenticated
  with check ((select public.is_admin()));
