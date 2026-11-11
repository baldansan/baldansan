-- =============================================================================
-- 089 — Хүүхдийн од (⭐), дуусгасан хичээл, наалтыг баазад хадгалах
-- =============================================================================
-- Өмнө нь од зөвхөн тухайн утсанд (localStorage) хадгалагддаг байсан: утас солиход алга болно.
-- Энэ хүснэгт хичээл бүрийн од, дуусгасан огноог хадгална. Наалт нь дуусгасан хичээлээс гарна.
-- Эцэг эх өөрийн хүүхдүүдийн мөрийг guardian_kid_stars() функцээр уншина.
-- Supabase → SQL Editor → бүхэлд нь Run (1 удаа). Дахин ажиллуулахад аюулгүй.

create table if not exists public.kid_lesson_stars (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  stars int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.kid_lesson_stars enable row level security;

drop policy if exists kid_lesson_stars_select_own on public.kid_lesson_stars;
create policy kid_lesson_stars_select_own on public.kid_lesson_stars
  for select using (auth.uid() = user_id);

drop policy if exists kid_lesson_stars_insert_own on public.kid_lesson_stars;
create policy kid_lesson_stars_insert_own on public.kid_lesson_stars
  for insert with check (auth.uid() = user_id);

drop policy if exists kid_lesson_stars_update_own on public.kid_lesson_stars;
create policy kid_lesson_stars_update_own on public.kid_lesson_stars
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Эцэг эх: өөрийн бүртгэсэн хүүхдүүдийн од/дуусгасан хичээл.
create or replace function public.guardian_kid_stars()
returns table (
  child_user_id uuid,
  lesson_id text,
  stars int,
  completed_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select s.user_id, s.lesson_id, s.stars, s.completed_at, s.updated_at
  from public.kid_lesson_stars s
  join public.kid_profiles k on k.child_user_id = s.user_id
  where k.guardian_user_id = auth.uid();
$$;

revoke all on function public.guardian_kid_stars() from public;
grant execute on function public.guardian_kid_stars() to authenticated;

-- ШАЛГАХ — хүснэгт үүссэн бол 0 (эсвэл түүнээс их) гарна
select count(*) as rows_now from public.kid_lesson_stars;
