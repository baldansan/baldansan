-- 071: Оноо + зэрэглэл (points + rank) систем.
--
-- Бүх сурах үйлдэл оноо өгнө; анги / сургууль / нийт зэрэглэл; "Шилдэг
-- сурагчид" (зөвхөн public болгосон хүмүүс); сурагчийн тайлан (хэдэн цагт юу
-- хийсэн, хэдэн оноо).
--
-- ОНООНЫ ХҮСНЭГТ (source → оноо; сервер талд дээд хязгаар нь ЗААВАЛ мөрдөгдөнө,
-- клиент хэтэрүүлж болохгүй):
--
--   source           | оноо                                  | давхардлын түлхүүр (user, source, ref_id)
--   -----------------+---------------------------------------+------------------------------------------
--   lesson_complete  | 50 / хичээл                           | ref_id = lessonId (нэг удаа)
--   quiz_correct     | 5 эхний оролдлого, 1 давтан           | ref_id = lessonId:questionId  (давтан: …:r)
--   video_minutes    | 2 / бүтэн минут, 30 / өдөр / видео    | ref_id = videoId; өдөр бүр тусдаа мөр, нэмэгдэнэ
--   srs_review       | 1 / карт, 50 / өдөр                   | өдөр бүр нэг мөр, нэмэгдэнэ
--   game             | 10 + нарийвчлалын бонус (≤ 20) ≤ 30   | ref_id = тоглолт бүрийн unique id
--   exam             | 100 + оноо% (≤ 200)                   | ref_id = attemptId / testId:timestamp
--   assignment       | 30 хугацаандаа, 10 хоцорсон           | ref_id = assignmentId
--   writing          | 2 / иероглиф                          | ref_id = char (нэг удаа)
--   streak_bonus     | 10 / өдөр                             | ref_id = YYYY-MM-DD
--
-- Өдрийн хил: Asia/Ulaanbaatar (сервер тооцно, клиентээс авахгүй).
--
-- ХҮСНЭГТ / RPC (бусад агентууд ЗӨВХӨН эдгээрийг ашиглана):
--   user_points_ledger        — бүх оноо өгсөн үйлдлийн бүртгэл (insert зөвхөн award_points-оор)
--   user_points_daily         — (user_id, day) → points ; зэрэглэлийн үндсэн эх сурвалж
--   user_points_totals        — user_id → total, by_source (jsonb), last_7d/last_30d (snapshot)
--   user_points_summary       — view: totals + LIVE last_7d / last_30d
--   user_public_profile       — нийтэд харагдах профайл (is_public = true үед л)
--   award_points(p_source, p_ref_id, p_points, p_meta) → int (өгсөн оноо)
--   rank_class(p_classroom_id, p_period)            → (user_id, display_name, points, rank, is_me, is_demo)
--   rank_organization(p_org_id, p_period)           → (user_id, display_name, points, rank, is_me, is_demo)
--   rank_global(p_period, p_limit, p_include_demo)  → (user_id, display_name, points, rank, is_me, is_demo)
--   my_rank_summary(p_period)                       → (scope, scope_id, scope_name, points, rank, participants)
--   class_points_summary(p_org_id, p_period)        → (classroom_id, classroom_name, students, active_students, total_points, avg_points, rank)
--   best_students(p_period, p_limit)                → (user_id, display_name, avatar, instagram, level_label, points, rank)
--   p_period ∈ '7d' | '30d' | 'all'
--
-- Демо мөр: user_id нь 'd0000000-0000-4000-8000-' угтвартай бол is_demo = true
-- (lib/demo-data.ts isDemoId-тэй ижил). rank_global анхдагчаар демог оруулахгүй.
--
-- Дахин ажиллуулахад аюулгүй (if not exists / create or replace / drop policy if exists).

-- ---------------------------------------------------------------------------
-- 0. Тусламжийн функцүүд
-- ---------------------------------------------------------------------------

-- Улаанбаатарын өнөөдөр.
create or replace function public.points_today()
returns date
language sql
stable
as $$ select (now() at time zone 'Asia/Ulaanbaatar')::date; $$;

-- Хугацааны эхлэх өдөр; 'all' → null (шүүлтүүргүй).
create or replace function public.points_period_start(p_period text)
returns date
language sql
stable
as $$
  select case lower(coalesce(p_period, 'all'))
    when '7d'  then public.points_today() - 6
    when '30d' then public.points_today() - 29
    else null
  end;
$$;

create or replace function public.points_is_demo(p_user uuid)
returns boolean
language sql
immutable
as $$ select p_user is not null and p_user::text like 'd0000000-0000-4000-8000-%'; $$;

-- Багш / байгууллагын менежер энэ сурагчийн оноог унших эрхтэй эсэх.
-- (teacher_reads_learner нь 055-д; байгууллагын менежерийг энд нэмнэ.)
create or replace function public.org_manager_reads_learner(
  learner_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    learner_id is not null
    and check_user_id is not null
    and exists (
      select 1
      from public.classroom_students cs
      join public.classrooms c on c.id = cs.classroom_id
      where cs.student_user_id = learner_id
        and c.organization_id is not null
        and (
          public.is_org_manager(c.organization_id, check_user_id)
          or public.is_org_teacher(c.organization_id, check_user_id)
        )
    );
$$;

grant execute on function public.org_manager_reads_learner(uuid, uuid) to authenticated;

-- Хэрэглэгч тухайн байгууллагын сурагч мөн эсэх.
create or replace function public.is_org_student(
  org_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classroom_students cs
    join public.classrooms c on c.id = cs.classroom_id
    where c.organization_id = org_id
      and cs.student_user_id = check_user_id
  );
$$;

grant execute on function public.is_org_student(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 1. user_points_ledger
-- ---------------------------------------------------------------------------

create table if not exists public.user_points_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  points     int  not null,
  source     text not null,
  ref_id     text,
  meta       jsonb not null default '{}'::jsonb,
  day        date not null default public.points_today(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_points_ledger_source_check check (source in (
    'lesson_complete', 'quiz_correct', 'video_minutes', 'srs_review',
    'game', 'exam', 'assignment', 'writing', 'streak_bonus'
  )),
  constraint user_points_ledger_points_check check (points >= 0)
);

comment on table public.user_points_ledger is
  'Оноо өгсөн үйлдэл бүр. Зөвхөн award_points() RPC-ээр бичигдэнэ. video_minutes / srs_review мөр өдрийн дотор нэмэгдэж (updated_at) шинэчлэгдэнэ.';
comment on column public.user_points_ledger.ref_id is
  'Үйлдлийн түлхүүр: lessonId, lessonId:questionId, videoId, YYYY-MM-DD, …';
comment on column public.user_points_ledger.meta is
  'Тайланд харуулах нэмэлт: {label, lessonId, videoId, percent, …}';

create index if not exists user_points_ledger_user_day_idx
  on public.user_points_ledger (user_id, day desc);
create index if not exists user_points_ledger_source_idx
  on public.user_points_ledger (source);
create index if not exists user_points_ledger_user_created_idx
  on public.user_points_ledger (user_id, created_at desc);

-- Идемпотент: нэг (user, source, ref_id) → нэг мөр.
-- video_minutes / srs_review-ийн ref_id-д өдрийг award_points өөрөө залгана.
create unique index if not exists user_points_ledger_unique_ref_idx
  on public.user_points_ledger (user_id, source, ref_id)
  where ref_id is not null;

alter table public.user_points_ledger enable row level security;

drop policy if exists "upl_own_select" on public.user_points_ledger;
create policy "upl_own_select" on public.user_points_ledger
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "upl_teacher_select" on public.user_points_ledger;
create policy "upl_teacher_select" on public.user_points_ledger
  for select to authenticated
  using (public.teacher_reads_learner(user_id) or public.org_manager_reads_learner(user_id));

drop policy if exists "upl_admin_select" on public.user_points_ledger;
create policy "upl_admin_select" on public.user_points_ledger
  for select to authenticated using (public.is_admin());

-- insert/update/delete политик ОГТ байхгүй → зөвхөн security definer RPC бичнэ.

-- ---------------------------------------------------------------------------
-- 2. user_points_daily + user_points_totals (триггерээр хадгалагдана)
-- ---------------------------------------------------------------------------

create table if not exists public.user_points_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  points  int  not null default 0,
  primary key (user_id, day)
);

create index if not exists user_points_daily_day_idx
  on public.user_points_daily (day);

create table if not exists public.user_points_totals (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  total      int  not null default 0,
  last_7d    int  not null default 0,   -- snapshot (сүүлд оноо орсон үеийн); LIVE утга → user_points_summary
  last_30d   int  not null default 0,   -- snapshot
  by_source  jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.user_points_totals is
  'Нийт оноо + эх сурвалжаар. last_7d/last_30d нь сүүлийн оноо орсон мөчийн snapshot тул шинэ утга хэрэгтэй бол user_points_summary view ашигла.';

alter table public.user_points_daily enable row level security;
alter table public.user_points_totals enable row level security;

drop policy if exists "upd_own_select" on public.user_points_daily;
create policy "upd_own_select" on public.user_points_daily
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "upd_teacher_select" on public.user_points_daily;
create policy "upd_teacher_select" on public.user_points_daily
  for select to authenticated
  using (public.teacher_reads_learner(user_id) or public.org_manager_reads_learner(user_id));
drop policy if exists "upd_admin_select" on public.user_points_daily;
create policy "upd_admin_select" on public.user_points_daily
  for select to authenticated using (public.is_admin());

drop policy if exists "upt_own_select" on public.user_points_totals;
create policy "upt_own_select" on public.user_points_totals
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "upt_teacher_select" on public.user_points_totals;
create policy "upt_teacher_select" on public.user_points_totals
  for select to authenticated
  using (public.teacher_reads_learner(user_id) or public.org_manager_reads_learner(user_id));
drop policy if exists "upt_admin_select" on public.user_points_totals;
create policy "upt_admin_select" on public.user_points_totals
  for select to authenticated using (public.is_admin());

-- Ledger-ийн insert/update/delete бүрт daily + totals-ийг delta-аар шинэчилнэ.
create or replace function public.user_points_ledger_apply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid;
  v_day    date;
  v_source text;
  v_delta  int;
begin
  if tg_op = 'INSERT' then
    v_user := new.user_id; v_day := new.day; v_source := new.source; v_delta := new.points;
  elsif tg_op = 'UPDATE' then
    v_user := new.user_id; v_day := new.day; v_source := new.source; v_delta := new.points - old.points;
  else
    v_user := old.user_id; v_day := old.day; v_source := old.source; v_delta := -old.points;
  end if;

  if v_delta = 0 then
    return coalesce(new, old);
  end if;

  insert into public.user_points_daily as d (user_id, day, points)
  values (v_user, v_day, v_delta)
  on conflict (user_id, day) do update set points = d.points + excluded.points;

  insert into public.user_points_totals as t (user_id, total, by_source, updated_at)
  values (
    v_user, v_delta,
    jsonb_build_object(v_source, v_delta),
    now()
  )
  on conflict (user_id) do update set
    total = t.total + v_delta,
    by_source = jsonb_set(
      t.by_source, array[v_source],
      to_jsonb(coalesce((t.by_source ->> v_source)::int, 0) + v_delta)
    ),
    updated_at = now();

  update public.user_points_totals t set
    last_7d  = coalesce((select sum(points) from public.user_points_daily
                          where user_id = v_user and day >= public.points_today() - 6), 0),
    last_30d = coalesce((select sum(points) from public.user_points_daily
                          where user_id = v_user and day >= public.points_today() - 29), 0)
  where t.user_id = v_user;

  return coalesce(new, old);
end;
$$;

drop trigger if exists user_points_ledger_apply_trg on public.user_points_ledger;
create trigger user_points_ledger_apply_trg
  after insert or update or delete on public.user_points_ledger
  for each row execute function public.user_points_ledger_apply();

-- LIVE нийт + 7 хоног + 30 хоног (security_invoker → RLS хэвээр).
create or replace view public.user_points_summary
with (security_invoker = true) as
select
  t.user_id,
  t.total,
  t.by_source,
  t.updated_at,
  coalesce((select sum(d.points) from public.user_points_daily d
             where d.user_id = t.user_id and d.day >= public.points_today() - 6), 0)::int  as last_7d,
  coalesce((select sum(d.points) from public.user_points_daily d
             where d.user_id = t.user_id and d.day >= public.points_today() - 29), 0)::int as last_30d,
  coalesce((select sum(d.points) from public.user_points_daily d
             where d.user_id = t.user_id
               and d.day between public.points_today() - 13 and public.points_today() - 7), 0)::int as prev_7d
from public.user_points_totals t;

grant select on public.user_points_summary to authenticated;

-- ---------------------------------------------------------------------------
-- 3. user_public_profile
-- ---------------------------------------------------------------------------

create table if not exists public.user_public_profile (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar       text,
  instagram    text,
  is_public    boolean not null default false,
  level_label  text,
  updated_at   timestamptz not null default now()
);

comment on table public.user_public_profile is
  'Нийтэд харагдах профайл. is_public = true үед л "Шилдэг сурагчид" болон нийт зэрэглэлд нэрээр нь харагдана.';

alter table public.user_public_profile enable row level security;

drop policy if exists "upp_own_all" on public.user_public_profile;
create policy "upp_own_all" on public.user_public_profile
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "upp_public_select" on public.user_public_profile;
create policy "upp_public_select" on public.user_public_profile
  for select to anon, authenticated using (is_public = true);

drop policy if exists "upp_admin_select" on public.user_public_profile;
create policy "upp_admin_select" on public.user_public_profile
  for select to authenticated using (public.is_admin());

drop trigger if exists user_public_profile_updated_at on public.user_public_profile;
create trigger user_public_profile_updated_at
  before update on public.user_public_profile
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4. award_points
-- ---------------------------------------------------------------------------

-- Буцаах утга: энэ дуудлагаар ШИНЭЭР өгсөн оноо (давхардсан бол 0).
create or replace function public.award_points(
  p_source text,
  p_ref_id text,
  p_points int,
  p_meta   jsonb default '{}'::jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_today  date := public.points_today();
  v_max    int;   -- нэг мөрийн дээд хязгаар
  v_pts    int;
  v_ref    text := nullif(btrim(coalesce(p_ref_id, '')), '');
  v_meta   jsonb := coalesce(p_meta, '{}'::jsonb);
  v_old    int;
  v_new    int;
  v_ins    int;
begin
  if v_uid is null then return 0; end if;
  if p_source is null or p_points is null or p_points <= 0 then return 0; end if;

  v_max := case p_source
    when 'lesson_complete' then 50
    when 'quiz_correct'    then 5
    when 'video_minutes'   then 30   -- өдөр/видео нийт
    when 'srs_review'      then 50   -- өдөр нийт
    when 'game'            then 30
    when 'exam'            then 200
    when 'assignment'      then 30
    when 'writing'         then 2
    when 'streak_bonus'    then 10
    else null
  end;
  if v_max is null then return 0; end if;

  v_pts := least(p_points, v_max);

  -- Нэмэгддэг эх сурвалж: өдөр (+ видео) бүр нэг мөр, дээд хязгаартай.
  if p_source in ('video_minutes', 'srs_review') then
    if p_source = 'video_minutes' then
      if v_ref is null then return 0; end if;
      v_ref := v_ref || ':' || v_today::text;
    else
      v_ref := v_today::text;
    end if;

    select points into v_old from public.user_points_ledger
     where user_id = v_uid and source = p_source and ref_id = v_ref
     for update;

    if v_old is null then
      insert into public.user_points_ledger (user_id, points, source, ref_id, meta, day)
      values (v_uid, v_pts, p_source, v_ref, v_meta, v_today)
      on conflict (user_id, source, ref_id) where ref_id is not null do nothing;
      get diagnostics v_ins = row_count;
      return case when v_ins > 0 then v_pts else 0 end;
    end if;

    v_new := least(v_max, v_old + v_pts);
    if v_new = v_old then return 0; end if;
    update public.user_points_ledger
       set points = v_new, meta = meta || v_meta, updated_at = now()
     where user_id = v_uid and source = p_source and ref_id = v_ref;
    return v_new - v_old;
  end if;

  -- Нэг удаагийн эх сурвалж: давхардвал 0.
  -- ref_id байхгүй бол (game г.м.) бүртгэл бүр шинэ мөр, гэхдээ streak_bonus-д өдрөөр.
  if p_source = 'streak_bonus' and v_ref is null then
    v_ref := v_today::text;
  end if;

  insert into public.user_points_ledger (user_id, points, source, ref_id, meta, day)
  values (v_uid, v_pts, p_source, v_ref, v_meta, v_today)
  on conflict (user_id, source, ref_id) where ref_id is not null do nothing;
  get diagnostics v_ins = row_count;
  return case when v_ins > 0 then v_pts else 0 end;
end;
$$;

revoke all on function public.award_points(text, text, int, jsonb) from public, anon;
grant execute on function public.award_points(text, text, int, jsonb) to authenticated;

comment on function public.award_points(text, text, int, jsonb) is
  'Нэвтэрсэн хэрэглэгчид оноо өгнө (идемпотент, эх сурвалж бүрийн дээд хязгаартай). Буцаах: шинээр өгсөн оноо.';

-- ---------------------------------------------------------------------------
-- 5. Зэрэглэл
-- ---------------------------------------------------------------------------

-- Дотоод: хугацаан дахь хэрэглэгч бүрийн оноо.
create or replace function public.points_in_period(p_period text)
returns table (user_id uuid, points bigint)
language sql
stable
security definer
set search_path = public
as $$
  select d.user_id, sum(d.points)::bigint
  from public.user_points_daily d
  where d.day >= coalesce(public.points_period_start(p_period), date '1970-01-01')
  group by d.user_id;
$$;

revoke all on function public.points_in_period(text) from public, anon, authenticated;

-- Анги: ангийн бүх сурагч (0 оноотой ч) жагсана.
create or replace function public.rank_class(
  p_classroom_id uuid,
  p_period text default 'all'
)
returns table (user_id uuid, display_name text, points bigint, rank bigint, is_me boolean, is_demo boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or not (public.can_read_org_classroom(p_classroom_id) or public.is_admin()) then
    return;
  end if;

  return query
  with members as (
    select distinct on (cs.student_user_id)
           cs.student_user_id as uid, cs.display_name as dn
    from public.classroom_students cs
    where cs.classroom_id = p_classroom_id and cs.student_user_id is not null
    order by cs.student_user_id, cs.created_at
  ), p as (select * from public.points_in_period(p_period))
  select m.uid,
         coalesce(nullif(m.dn, ''), pp.display_name, 'Сурагч'),
         coalesce(p.points, 0)::bigint,
         rank() over (order by coalesce(p.points, 0) desc),
         m.uid = auth.uid(),
         public.points_is_demo(m.uid)
  from members m
  left join p on p.user_id = m.uid
  left join public.user_public_profile pp on pp.user_id = m.uid
  order by 4, 2;
end;
$$;

-- Сургууль (байгууллага): бүх ангийн сурагчид.
create or replace function public.rank_organization(
  p_org_id uuid,
  p_period text default 'all'
)
returns table (user_id uuid, display_name text, points bigint, rank bigint, is_me boolean, is_demo boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or not (public.is_org_member(p_org_id) or public.is_org_student(p_org_id) or public.is_admin()) then
    return;
  end if;

  return query
  with members as (
    select distinct on (cs.student_user_id)
           cs.student_user_id as uid, cs.display_name as dn
    from public.classroom_students cs
    join public.classrooms c on c.id = cs.classroom_id
    where c.organization_id = p_org_id and cs.student_user_id is not null
    order by cs.student_user_id, cs.created_at
  ), p as (select * from public.points_in_period(p_period))
  select m.uid,
         coalesce(nullif(m.dn, ''), pp.display_name, 'Сурагч'),
         coalesce(p.points, 0)::bigint,
         rank() over (order by coalesce(p.points, 0) desc),
         m.uid = auth.uid(),
         public.points_is_demo(m.uid)
  from members m
  left join p on p.user_id = m.uid
  left join public.user_public_profile pp on pp.user_id = m.uid
  order by 4, 2;
end;
$$;

-- Нийт: зөвхөн оноотой хүмүүс. Нэр нь зөвхөн is_public үед; бусад нь "Нууц сурагч"
-- (өөрийн мөр үргэлж өөрийн нэрээр). Топ p_limit + өөрийн мөр.
create or replace function public.rank_global(
  p_period text default 'all',
  p_limit int default 50,
  p_include_demo boolean default false
)
returns table (user_id uuid, display_name text, points bigint, rank bigint, is_me boolean, is_demo boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;

  return query
  with p as (
    select * from public.points_in_period(p_period) x
    where x.points > 0 and (p_include_demo or not public.points_is_demo(x.user_id))
  ), r as (
    select p.user_id as uid, p.points as pts, rank() over (order by p.points desc) as rk from p
  )
  select r.uid,
         case
           when pp.is_public then coalesce(nullif(pp.display_name, ''), 'Сурагч')
           when r.uid = auth.uid() then coalesce(nullif(pp.display_name, ''), 'Та')
           else 'Нууц сурагч'
         end,
         r.pts, r.rk, r.uid = auth.uid(), public.points_is_demo(r.uid)
  from r
  left join public.user_public_profile pp on pp.user_id = r.uid
  where r.rk <= greatest(coalesce(p_limit, 50), 1) or r.uid = auth.uid()
  order by r.rk, 2;
end;
$$;

-- Миний байр: тус бүрт анги / сургууль / нийт.
-- scope: 'class' | 'organization' | 'global'
create or replace function public.my_rank_summary(p_period text default 'all')
returns table (scope text, scope_id uuid, scope_name text, points bigint, rank bigint, participants bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return; end if;

  return query
  with p as (select * from public.points_in_period(p_period)),
  my_classes as (
    select distinct c.id as cid, c.name as cname, c.organization_id as oid
    from public.classroom_students cs
    join public.classrooms c on c.id = cs.classroom_id
    where cs.student_user_id = v_uid
  ),
  class_rows as (
    select mc.cid, cs2.student_user_id as uid, coalesce(p.points, 0) as pts
    from my_classes mc
    join public.classroom_students cs2 on cs2.classroom_id = mc.cid and cs2.student_user_id is not null
    left join p on p.user_id = cs2.student_user_id
    group by mc.cid, cs2.student_user_id, p.points
  ),
  class_ranked as (
    select cr.cid, cr.uid, cr.pts,
           rank() over (partition by cr.cid order by cr.pts desc) as rk,
           count(*) over (partition by cr.cid) as n
    from class_rows cr
  ),
  my_orgs as (
    select distinct mc.oid from my_classes mc where mc.oid is not null
  ),
  org_rows as (
    select mo.oid, cs3.student_user_id as uid, coalesce(p.points, 0) as pts
    from my_orgs mo
    join public.classrooms c3 on c3.organization_id = mo.oid
    join public.classroom_students cs3 on cs3.classroom_id = c3.id and cs3.student_user_id is not null
    left join p on p.user_id = cs3.student_user_id
    group by mo.oid, cs3.student_user_id, p.points
  ),
  org_ranked as (
    select orr.oid, orr.uid, orr.pts,
           rank() over (partition by orr.oid order by orr.pts desc) as rk,
           count(*) over (partition by orr.oid) as n
    from org_rows orr
  ),
  glob as (
    select p.user_id as uid, p.points as pts,
           rank() over (order by p.points desc) as rk,
           count(*) over () as n
    from p
    where p.points > 0 and not public.points_is_demo(p.user_id)
  )
  select 'class'::text, mc.cid, mc.cname, cr.pts::bigint, cr.rk::bigint, cr.n::bigint
  from class_ranked cr join my_classes mc on mc.cid = cr.cid
  where cr.uid = v_uid
  union all
  select 'organization'::text, o.id, o.name, orr.pts::bigint, orr.rk::bigint, orr.n::bigint
  from org_ranked orr join public.organizations o on o.id = orr.oid
  where orr.uid = v_uid
  union all
  select 'global'::text, null::uuid, 'Нийт'::text, g.pts::bigint, g.rk::bigint, g.n::bigint
  from glob g where g.uid = v_uid;
end;
$$;

-- Ангиудын нэгтгэл: байгууллагын багш / менежер / админ.
create or replace function public.class_points_summary(
  p_org_id uuid,
  p_period text default 'all'
)
returns table (
  classroom_id uuid, classroom_name text, students bigint, active_students bigint,
  total_points bigint, avg_points numeric, rank bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or not (public.is_org_teacher(p_org_id) or public.is_org_manager(p_org_id) or public.is_admin()) then
    return;
  end if;

  return query
  with p as (select * from public.points_in_period(p_period)),
  per_class as (
    select c.id as cid, c.name as cname,
           count(distinct cs.student_user_id) as n,
           count(distinct cs.student_user_id) filter (where coalesce(p.points, 0) > 0) as act,
           coalesce(sum(p.points), 0) as tot
    from public.classrooms c
    left join public.classroom_students cs
           on cs.classroom_id = c.id and cs.student_user_id is not null
    left join p on p.user_id = cs.student_user_id
    where c.organization_id = p_org_id
    group by c.id, c.name
  )
  select pc.cid, pc.cname, pc.n, pc.act, pc.tot::bigint,
         case when pc.n > 0 then round(pc.tot::numeric / pc.n, 1) else 0 end,
         rank() over (order by case when pc.n > 0 then pc.tot::numeric / pc.n else 0 end desc)
  from per_class pc
  order by 7, 2;
end;
$$;

-- Шилдэг сурагчид (public болгосон хүмүүс л).
create or replace function public.best_students(
  p_period text default '30d',
  p_limit int default 10
)
returns table (
  user_id uuid, display_name text, avatar text, instagram text,
  level_label text, points bigint, rank bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with p as (select * from public.points_in_period(p_period))
  select * from (
    select pp.user_id,
           coalesce(nullif(pp.display_name, ''), 'Сурагч'),
           pp.avatar, pp.instagram, pp.level_label,
           p.points::bigint,
           rank() over (order by p.points desc)::bigint as rk
    from public.user_public_profile pp
    join p on p.user_id = pp.user_id
    where pp.is_public = true and p.points > 0
  ) t
  where t.rk <= greatest(coalesce(p_limit, 10), 1)
  order by t.rk;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'rank_class(uuid, text)',
    'rank_organization(uuid, text)',
    'rank_global(text, int, boolean)',
    'my_rank_summary(text)',
    'class_points_summary(uuid, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

revoke all on function public.best_students(text, int) from public;
grant execute on function public.best_students(text, int) to anon, authenticated;
