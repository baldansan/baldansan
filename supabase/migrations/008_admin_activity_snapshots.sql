-- Phase 5 Step 25: Activity before/after snapshots and diff summary
-- Run after 007_admin_activity_log.sql. Safe to re-run.

alter table public.admin_activity_log
  add column if not exists before_snapshot jsonb default null;

alter table public.admin_activity_log
  add column if not exists after_snapshot jsonb default null;

alter table public.admin_activity_log
  add column if not exists diff_summary jsonb not null default '{}'::jsonb;

comment on column public.admin_activity_log.before_snapshot is
  'Shallow JSON snapshot of entity state before the admin action.';

comment on column public.admin_activity_log.after_snapshot is
  'Shallow JSON snapshot of entity state after the admin action.';

comment on column public.admin_activity_log.diff_summary is
  'Precomputed shallow diff hints (changed/added/removed field names).';
