-- 120: Хамт сурах бүлэг (анги = найзуудын бүлэг).
-- Ажиллуулах: Supabase SQL editor (дахин ажиллуулахад аюулгүй). Шаардлага: 011, 013, 064, 071.
--
-- Юу өөрчлөгдөнө:
--   * classrooms дээр бүлгийн төрөл, нээлттэй эсэх, зорилгын баганууд нэмэгдэнэ.
--   * Нэвтэрсэн хэн ч бүлэг үүсгэнэ (create_study_group).
--   * Сурагч өөрөө гарна (leave_my_classroom) — мөр устахгүй, status = 'removed'.
--   * Нэг л бүлэгт: кодоор ороход өөр бүлэгт байвал p_switch = true үед л шилжүүлнэ.
--   * Нүүрийн самбар: my_study_group() — зорилго + гишүүдийн өнөөдрийн/энэ 7 хоногийн тоо.
--   * HSK 1–6 нэртэй (байгууллагагүй) ангиуд нээлттэй бүлэг болно.

-- =============================================================================
-- 1. Баганууд
-- =============================================================================
alter table public.classrooms
  add column if not exists kind text not null default 'class',
  add column if not exists is_open boolean not null default false,
  add column if not exists goal_words_per_day integer,
  add column if not exists goal_lessons_per_week integer,
  add column if not exists goal_tests_per_week integer,
  add column if not exists goal_days integer[];

comment on column public.classrooms.kind is
  '''class'' = багшийн анги, ''group'' = хамт сурах бүлэг (сурагчид өөрсдөө үүсгэнэ).';
comment on column public.classrooms.is_open is
  'true бол «Нээлттэй бүлгүүд» жагсаалтад гарч, хэн ч орж болно.';
comment on column public.classrooms.goal_days is
  'Сурах өдрүүд (ISO: 1 = Даваа … 7 = Ням). null бол өдөр бүр.';

-- =============================================================================
-- 2. Тусламж: 7 хоногийн эхлэл (Даваа, Улаанбаатарын цагаар)
-- =============================================================================
create or replace function public.study_week_start()
returns date
language sql
stable
as $$
  select (date_trunc('week', (now() at time zone 'Asia/Ulaanbaatar')))::date;
$$;

-- =============================================================================
-- 3. Бүлэг үүсгэх
-- =============================================================================
create or replace function public.create_study_group(
  p_name text,
  p_words_per_day integer default null,
  p_lessons_per_week integer default null,
  p_tests_per_week integer default null,
  p_days integer[] default null,
  p_display_name text default null
)
returns table (out_classroom_id uuid, out_classroom_name text, out_join_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_email text;
  v_dn text;
  v_id uuid;
  v_code text;
  v_days integer[];
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  if v_name is null or char_length(v_name) > 40 then
    raise exception 'invalid name';
  end if;
  if coalesce(p_words_per_day, 0) <= 0
     and coalesce(p_lessons_per_week, 0) <= 0
     and coalesce(p_tests_per_week, 0) <= 0 then
    raise exception 'no goal';
  end if;
  -- Нэг хүн өдөрт 5-аас олон бүлэг үүсгэхгүй (хог үүсэхээс сэргийлнэ).
  if (select count(*) from public.classrooms c
      where c.teacher_user_id = v_uid and c.kind = 'group'
        and c.created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many groups';
  end if;

  select array_agg(distinct d order by d) into v_days
  from unnest(coalesce(p_days, '{}'::integer[])) as d
  where d between 1 and 7;
  if v_days is not null and array_length(v_days, 1) = 7 then
    v_days := null;
  end if;

  insert into public.classrooms (
    teacher_user_id, name, status, kind, is_open,
    goal_words_per_day, goal_lessons_per_week, goal_tests_per_week, goal_days
  ) values (
    v_uid, v_name, 'active', 'group', false,
    nullif(least(greatest(coalesce(p_words_per_day, 0), 0), 200), 0),
    nullif(least(greatest(coalesce(p_lessons_per_week, 0), 0), 21), 0),
    nullif(least(greatest(coalesce(p_tests_per_week, 0), 0), 21), 0),
    v_days
  )
  returning id, join_code into v_id, v_code;

  -- Нэг л бүлэгт: өмнөх бүлгээс гаргана (мөр, оноо хэвээр).
  update public.classroom_students
    set status = 'removed'
    where student_user_id = v_uid and status <> 'removed';

  select email into v_email from auth.users where id = v_uid;
  select display_name into v_dn from public.user_public_profile where user_id = v_uid;
  insert into public.classroom_students (classroom_id, student_user_id, display_name, email, status, joined_at)
  values (
    v_id, v_uid,
    coalesce(nullif(btrim(coalesce(p_display_name, '')), ''), nullif(v_dn, ''), split_part(coalesce(v_email, ''), '@', 1)),
    v_email, 'active', now()
  );

  return query select v_id, v_name, v_code;
end;
$$;

grant execute on function public.create_study_group(text, integer, integer, integer, integer[], text) to authenticated;

-- =============================================================================
-- 4. Зорилгоо өөрчлөх (зөвхөн бүлгийг үүсгэсэн хүн эсвэл админ)
-- =============================================================================
create or replace function public.update_study_group_goals(
  p_classroom_id uuid,
  p_words_per_day integer,
  p_lessons_per_week integer,
  p_tests_per_week integer,
  p_days integer[]
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_days integer[];
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  if not exists (
    select 1 from public.classrooms c
    where c.id = p_classroom_id and c.kind = 'group'
      and (c.teacher_user_id = v_uid or public.is_admin())
  ) then
    raise exception 'not allowed';
  end if;
  if coalesce(p_words_per_day, 0) <= 0
     and coalesce(p_lessons_per_week, 0) <= 0
     and coalesce(p_tests_per_week, 0) <= 0 then
    raise exception 'no goal';
  end if;

  select array_agg(distinct d order by d) into v_days
  from unnest(coalesce(p_days, '{}'::integer[])) as d
  where d between 1 and 7;
  if v_days is not null and array_length(v_days, 1) = 7 then
    v_days := null;
  end if;

  update public.classrooms set
    goal_words_per_day = nullif(least(greatest(coalesce(p_words_per_day, 0), 0), 200), 0),
    goal_lessons_per_week = nullif(least(greatest(coalesce(p_lessons_per_week, 0), 0), 21), 0),
    goal_tests_per_week = nullif(least(greatest(coalesce(p_tests_per_week, 0), 0), 21), 0),
    goal_days = v_days
  where id = p_classroom_id;
  return true;
end;
$$;

grant execute on function public.update_study_group_goals(uuid, integer, integer, integer, integer[]) to authenticated;

-- =============================================================================
-- 5. Гарах
-- =============================================================================
create or replace function public.leave_my_classroom(p_classroom_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  update public.classroom_students
    set status = 'removed'
    where student_user_id = v_uid
      and status <> 'removed'
      and (p_classroom_id is null or classroom_id = p_classroom_id);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.leave_my_classroom(uuid) to authenticated;

-- =============================================================================
-- 6. Кодоор орох — нэг л бүлэгт (064-ийн функцийг солино)
-- =============================================================================
drop function if exists public.join_classroom_by_code(text, text);
drop function if exists public.join_classroom_by_code(text, text, boolean);
create function public.join_classroom_by_code(
  p_code text,
  p_display_name text default null,
  p_switch boolean default false
)
returns table (out_classroom_id uuid, out_classroom_name text, out_already_member boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_class public.classrooms%rowtype;
  v_email text;
  v_dn text;
  v_existing uuid;
  v_existing_status text;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  select * into v_class from public.classrooms
    where join_code = regexp_replace(coalesce(p_code, ''), '\D', '', 'g')
      and status = 'active';
  if not found then
    raise exception 'invalid code';
  end if;

  -- Өөр бүлэгт идэвхтэй байвал: зөвшөөрсөн үед л шилжүүлнэ.
  if exists (
    select 1 from public.classroom_students cs
    join public.classrooms c on c.id = cs.classroom_id
    where cs.student_user_id = v_uid and cs.status <> 'removed'
      and cs.classroom_id <> v_class.id and c.status = 'active'
  ) then
    if not coalesce(p_switch, false) then
      raise exception 'in other group';
    end if;
    update public.classroom_students
      set status = 'removed'
      where student_user_id = v_uid and status <> 'removed'
        and classroom_id <> v_class.id;
  end if;

  select id, status into v_existing, v_existing_status from public.classroom_students
    where classroom_id = v_class.id and student_user_id = v_uid
    order by created_at limit 1;
  if v_existing is not null then
    -- Буцаж орсон: хуучин мөр сэргэнэ (оноо, эрэмбэ үргэлжилнэ).
    update public.classroom_students
      set status = 'active', joined_at = now()
      where id = v_existing;
    return query select v_class.id, v_class.name, v_existing_status <> 'removed';
    return;
  end if;

  select email into v_email from auth.users where id = v_uid;
  select display_name into v_dn from public.user_public_profile where user_id = v_uid;

  -- Багш урьдчилж имэйлээр нэмсэн мөр байвал холбоно
  select id into v_existing from public.classroom_students
    where classroom_id = v_class.id and student_user_id is null
      and v_email is not null and lower(email) = lower(v_email) limit 1;
  if v_existing is not null then
    update public.classroom_students
      set student_user_id = v_uid, status = 'active', joined_at = now(),
          display_name = coalesce(nullif(p_display_name, ''), display_name)
      where id = v_existing;
  else
    insert into public.classroom_students (classroom_id, student_user_id, display_name, email, status, joined_at)
    values (
      v_class.id, v_uid,
      coalesce(nullif(p_display_name, ''), nullif(v_dn, ''), split_part(coalesce(v_email, ''), '@', 1)),
      v_email, 'active', now()
    );
  end if;
  return query select v_class.id, v_class.name, false;
end;
$$;

grant execute on function public.join_classroom_by_code(text, text, boolean) to authenticated;

-- =============================================================================
-- 7. Нээлттэй бүлгүүд
-- =============================================================================
create or replace function public.list_open_groups()
returns table (
  out_classroom_id uuid,
  out_name text,
  out_join_code text,
  out_members bigint,
  out_words_per_day integer,
  out_lessons_per_week integer,
  out_tests_per_week integer
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.join_code,
         (select count(*) from public.classroom_students cs
           where cs.classroom_id = c.id and cs.student_user_id is not null and cs.status <> 'removed'),
         c.goal_words_per_day, c.goal_lessons_per_week, c.goal_tests_per_week
  from public.classrooms c
  where c.kind = 'group' and c.is_open and c.status = 'active'
  order by c.name
  limit 30;
$$;

grant execute on function public.list_open_groups() to authenticated;

-- =============================================================================
-- 8. Миний бүлэг: зорилго + гишүүдийн самбар (Нүүр)
-- =============================================================================
-- Зөвхөн идэвхтэй гишүүн өөрийн бүлгийг харна. Том бүлэгт эхний 30 хүн (өнөөдрийн
-- үгийн тоо, дараа нь 7 хоногийн хичээлээр эрэмбэлж) + өөрөө.
create or replace function public.my_study_group()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_class public.classrooms%rowtype;
  v_today date := public.points_today();
  v_week date := public.study_week_start();
  v_members jsonb;
  v_count integer;
begin
  if v_uid is null then
    return null;
  end if;

  select c.* into v_class
  from public.classroom_students cs
  join public.classrooms c on c.id = cs.classroom_id
  where cs.student_user_id = v_uid and cs.status <> 'removed' and c.status = 'active'
  order by coalesce(cs.joined_at, cs.created_at) desc
  limit 1;
  if not found then
    return null;
  end if;

  select count(distinct cs.student_user_id) into v_count
  from public.classroom_students cs
  where cs.classroom_id = v_class.id and cs.student_user_id is not null and cs.status <> 'removed';

  with members as (
    select distinct on (cs.student_user_id)
           cs.student_user_id as uid, cs.display_name as dn
    from public.classroom_students cs
    where cs.classroom_id = v_class.id and cs.student_user_id is not null and cs.status <> 'removed'
    order by cs.student_user_id, cs.created_at
  ), stats as (
    select m.uid,
           coalesce(nullif(m.dn, ''), pp.display_name, 'Сурагч') as name,
           (select count(*) from public.user_word_srs w
             where w.user_id = m.uid and w.last_rating is not null
               and (w.updated_at at time zone 'Asia/Ulaanbaatar')::date = v_today) as words_today,
           (select count(*) from public.user_lesson_progress lp
             where lp.user_id = m.uid and lp.status = 'completed'
               and (lp.completed_at at time zone 'Asia/Ulaanbaatar')::date >= v_week) as lessons_week,
           (select count(*) from public.user_test_attempts ta
             where ta.user_id = m.uid and ta.finished_at is not null
               and (ta.finished_at at time zone 'Asia/Ulaanbaatar')::date >= v_week) as tests_week,
           coalesce((select s.current_streak from public.user_streaks s
             where s.user_id = m.uid
               and s.last_active_date >= v_today - 1), 0) as streak
    from members m
    left join public.user_public_profile pp on pp.user_id = m.uid
  ), ranked as (
    select s.*, row_number() over (
      order by s.words_today desc, s.lessons_week desc, s.tests_week desc, s.name
    ) as rn
    from stats s
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'name', r.name,
           'is_me', r.uid = v_uid,
           'words_today', r.words_today,
           'lessons_week', r.lessons_week,
           'tests_week', r.tests_week,
           'streak', r.streak
         ) order by r.rn), '[]'::jsonb)
    into v_members
  from ranked r
  where r.rn <= 30 or r.uid = v_uid;

  return jsonb_build_object(
    'id', v_class.id,
    'name', v_class.name,
    'kind', v_class.kind,
    'level', v_class.level,
    'course_id', coalesce(v_class.course_id, v_class.curriculum_course_id),
    'is_open', v_class.is_open,
    'is_owner', v_class.teacher_user_id = v_uid,
    'join_code', case when v_class.kind = 'group' then v_class.join_code else null end,
    'goal_words_per_day', v_class.goal_words_per_day,
    'goal_lessons_per_week', v_class.goal_lessons_per_week,
    'goal_tests_per_week', v_class.goal_tests_per_week,
    'goal_days', v_class.goal_days,
    'today_dow', extract(isodow from v_today)::integer,
    'member_count', v_count,
    'members', v_members
  );
end;
$$;

grant execute on function public.my_study_group() to authenticated;

-- =============================================================================
-- 9. HSK 1–6 ангиуд → нээлттэй бүлэг (өгөгдмөл зорилго: өдөрт 20 үг, 7 хоногт 3 хичээл)
-- =============================================================================
update public.classrooms
set kind = 'group',
    is_open = true,
    goal_words_per_day = coalesce(goal_words_per_day, 20),
    goal_lessons_per_week = coalesce(goal_lessons_per_week, 3)
where organization_id is null
  and status = 'active'
  and name ~* '^\s*hsk\s*-?\s*[1-6](\s*(анги|бүлэг|class))?\s*$';

-- Шалгах: нээлттэй болсон бүлгүүд (6 мөр гарах ёстой).
select name, join_code, goal_words_per_day, goal_lessons_per_week
from public.classrooms
where kind = 'group' and is_open
order by name;
