-- Buunduu Surtsgaay — Teacher weekly email report: opt-in/out preference
-- Safe to re-run. Only adds a column with a sensible default — no migrate
-- run is required to ship the cron/feature (the column is additive and
-- backward compatible; the cron simply treats a missing row as "enabled").

alter table public.teacher_profiles
  add column if not exists weekly_report_enabled boolean not null default true;
