-- Buunduu Surtsgaay — Phase 7 Step 5: reminders, notifications, achievements
-- Safe to re-run

create table if not exists public.user_study_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reminder_type text not null default 'daily_study',
  title text not null,
  reminder_time text,
  days_of_week text[] not null default array['mon','tue','wed','thu','fri','sat','sun'],
  enabled boolean not null default true,
  last_shown_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_study_reminders_user_id_idx
  on public.user_study_reminders (user_id);

drop trigger if exists user_study_reminders_updated_at on public.user_study_reminders;
create trigger user_study_reminders_updated_at
  before update on public.user_study_reminders
  for each row
  execute function public.update_updated_at_column();

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  notification_type text not null,
  title text not null,
  message text,
  action_href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_id_idx
  on public.user_notifications (user_id);

create index if not exists user_notifications_created_at_idx
  on public.user_notifications (created_at desc);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  achievement_key text not null,
  title text not null,
  description text,
  earned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, achievement_key)
);

create index if not exists user_achievements_user_id_idx
  on public.user_achievements (user_id);

alter table public.user_study_reminders enable row level security;
alter table public.user_notifications enable row level security;
alter table public.user_achievements enable row level security;

-- user_study_reminders
drop policy if exists "user_study_reminders_select_own" on public.user_study_reminders;
create policy "user_study_reminders_select_own"
  on public.user_study_reminders for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_study_reminders_insert_own" on public.user_study_reminders;
create policy "user_study_reminders_insert_own"
  on public.user_study_reminders for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_study_reminders_update_own" on public.user_study_reminders;
create policy "user_study_reminders_update_own"
  on public.user_study_reminders for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_study_reminders_delete_own" on public.user_study_reminders;
create policy "user_study_reminders_delete_own"
  on public.user_study_reminders for delete to authenticated
  using (auth.uid() = user_id);

-- user_notifications
drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own"
  on public.user_notifications for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_notifications_insert_own" on public.user_notifications;
create policy "user_notifications_insert_own"
  on public.user_notifications for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own"
  on public.user_notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_achievements
drop policy if exists "user_achievements_select_own" on public.user_achievements;
create policy "user_achievements_select_own"
  on public.user_achievements for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_achievements_insert_own" on public.user_achievements;
create policy "user_achievements_insert_own"
  on public.user_achievements for insert to authenticated
  with check (auth.uid() = user_id);
