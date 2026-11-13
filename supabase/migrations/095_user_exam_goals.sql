-- 095: Шалгалтын зорилго (HSK түвшин + шалгалтын өдөр) — төхөөрөмж хооронд хадгална.
-- Дахин ажиллуулахад аюулгүй.
create table if not exists public.user_exam_goals (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  level           int  not null check (level between 1 and 6),
  exam_date       date not null,
  start_date      date not null default current_date,
  start_completed int  not null default 0,
  updated_at      timestamptz not null default now()
);

alter table public.user_exam_goals enable row level security;

drop policy if exists "ueg_own_select" on public.user_exam_goals;
create policy "ueg_own_select" on public.user_exam_goals
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "ueg_own_insert" on public.user_exam_goals;
create policy "ueg_own_insert" on public.user_exam_goals
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "ueg_own_update" on public.user_exam_goals;
create policy "ueg_own_update" on public.user_exam_goals
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ueg_own_delete" on public.user_exam_goals;
create policy "ueg_own_delete" on public.user_exam_goals
  for delete to authenticated using (auth.uid() = user_id);
