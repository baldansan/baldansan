-- 091: Багшийн ажлын талбарын нэмэлтүүд.
--   A. Эцэг эхийн холбоос   — нууц холбоосоор хүүхдийн ахицыг нэвтрэлтгүй харна
--   B. Багш нарын хяналт    — админ багш нарыг харж, шаардлагатай бол анги үүсгэхийг хаана
--   C. Давтагдах даалгавар  — долоо хоног бүр дараагийн хичээлийг автоматаар өгнө
-- Дахин ажиллуулахад аюулгүй (idempotent).

-- ============================================================
-- A. Эцэг эхийн холбоос
-- ============================================================
create table if not exists public.student_report_links (
  token text primary key default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_user_id uuid not null,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (classroom_id, student_user_id)
);

alter table public.student_report_links enable row level security;

drop policy if exists "report_links_teacher_all" on public.student_report_links;
create policy "report_links_teacher_all"
  on public.student_report_links for all to authenticated
  using (
    coalesce(public.is_admin(), false)
    or exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  )
  with check (
    coalesce(public.is_admin(), false)
    or exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_user_id = auth.uid()
    )
  );

-- Холбоос мэддэг хүн (эцэг эх) нэвтрэлтгүй дуудна. Зөвхөн тухайн нэг сурагчийн
-- хураангуйг буцаана; имэйл, ID зэрэг хувийн мэдээлэл буцаахгүй.
create or replace function public.get_student_report(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  l record;
  v_name text;
  v_class text;
  v_assignments jsonb;
  v_last timestamptz;
  v_words int;
  v_answers int;
  v_correct int;
begin
  select * into l from public.student_report_links where token = p_token;
  if not found then
    return null;
  end if;

  select nullif(btrim(cs.display_name), '') into v_name
  from public.classroom_students cs
  where cs.classroom_id = l.classroom_id and cs.student_user_id = l.student_user_id
  limit 1;

  select c.name into v_class from public.classrooms c where c.id = l.classroom_id;

  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) into v_assignments
  from (
    select
      a.title,
      a.due_date,
      a.created_at,
      coalesce(r.status, 'not_started') as status,
      r.quiz_percentage,
      r.completed_at
    from public.assignments a
    left join public.assignment_results r
      on r.assignment_id = a.id and r.student_user_id = l.student_user_id
    where a.classroom_id = l.classroom_id
      and coalesce(a.status, 'assigned') <> 'archived'
      and (a.target_student_user_id is null or a.target_student_user_id = l.student_user_id)
    order by a.created_at desc
    limit 30
  ) x;

  select max(qa.created_at), count(*), count(*) filter (where qa.is_correct)
    into v_last, v_answers, v_correct
  from public.question_attempts qa
  where qa.user_id = l.student_user_id
    and qa.created_at > now() - interval '30 days';

  if v_last is null then
    select max(qa.created_at) into v_last
    from public.question_attempts qa where qa.user_id = l.student_user_id;
  end if;

  select count(*) into v_words
  from public.user_vocabulary_progress vp
  where vp.user_id = l.student_user_id and vp.status = 'learned';

  return jsonb_build_object(
    'studentName', coalesce(v_name, 'Сурагч'),
    'className', v_class,
    'assignments', v_assignments,
    'lastActiveAt', v_last,
    'learnedWords', coalesce(v_words, 0),
    'answers30d', coalesce(v_answers, 0),
    'correct30d', coalesce(v_correct, 0)
  );
exception when undefined_table or undefined_column then
  return jsonb_build_object(
    'studentName', coalesce(v_name, 'Сурагч'),
    'className', v_class,
    'assignments', coalesce(v_assignments, '[]'::jsonb),
    'lastActiveAt', null,
    'learnedWords', 0,
    'answers30d', 0,
    'correct30d', 0
  );
end;
$$;

revoke all on function public.get_student_report(text) from public;
grant execute on function public.get_student_report(text) to anon, authenticated;

-- ============================================================
-- B. Багш нарын хяналт
-- ============================================================
alter table public.teacher_profiles
  add column if not exists blocked boolean not null default false;

-- Хаагдсан багш шинэ анги үүсгэж чадахгүй (бусад дүрэм хэвээр — нэмэлт хязгаар).
drop policy if exists "classrooms_insert_not_blocked" on public.classrooms;
create policy "classrooms_insert_not_blocked"
  on public.classrooms as restrictive for insert to authenticated
  with check (
    not exists (
      select 1 from public.teacher_profiles tp
      where tp.user_id = auth.uid() and tp.blocked
    )
  );

create or replace function public.admin_teacher_list()
returns table (
  user_id uuid,
  display_name text,
  email text,
  blocked boolean,
  class_count bigint,
  student_count bigint,
  assignment_count bigint,
  last_class_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id,
    coalesce(
      nullif(btrim(tp.display_name), ''),
      nullif(btrim(pp.display_name), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'name'), '')
    ),
    u.email::text,
    coalesce(tp.blocked, false),
    count(distinct c.id),
    (select count(*) from public.classroom_students cs
      where cs.classroom_id in (select id from public.classrooms where teacher_user_id = u.id)),
    (select count(*) from public.assignments a
      where a.classroom_id in (select id from public.classrooms where teacher_user_id = u.id)),
    max(c.created_at)
  from auth.users u
  join public.classrooms c on c.teacher_user_id = u.id
  left join public.teacher_profiles tp on tp.user_id = u.id
  left join public.user_public_profile pp on pp.user_id = u.id
  where coalesce(public.is_admin(), false)
  group by u.id, tp.display_name, pp.display_name, tp.blocked;
$$;

revoke all on function public.admin_teacher_list() from public, anon;
grant execute on function public.admin_teacher_list() to authenticated;

create or replace function public.admin_set_teacher_blocked(p_user uuid, p_blocked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Admin only';
  end if;
  insert into public.teacher_profiles (user_id, blocked)
  values (p_user, p_blocked)
  on conflict (user_id) do update set blocked = excluded.blocked, updated_at = now();
end;
$$;

revoke all on function public.admin_set_teacher_blocked(uuid, boolean) from public, anon;
grant execute on function public.admin_set_teacher_blocked(uuid, boolean) to authenticated;

-- ============================================================
-- C. Давтагдах даалгавар (долоо хоног бүр дараагийн хичээл)
-- ============================================================
create table if not exists public.assignment_schedules (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  created_by uuid not null default auth.uid(),
  lesson_ids text[] not null,
  lesson_titles text[] not null default '{}',
  assignment_type text not null default 'full_lesson',
  instructions text,
  next_index integer not null default 0,
  next_run_on date not null,
  interval_days integer not null default 7,
  due_days integer not null default 7,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists assignment_schedules_owner_idx
  on public.assignment_schedules (created_by, active, next_run_on);

alter table public.assignment_schedules enable row level security;

drop policy if exists "assignment_schedules_owner_all" on public.assignment_schedules;
create policy "assignment_schedules_owner_all"
  on public.assignment_schedules for all to authenticated
  using (created_by = auth.uid() or coalesce(public.is_admin(), false))
  with check (created_by = auth.uid());
