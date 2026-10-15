-- 073: Ангийн хурдан сорил (class_quizzes) + сурагчийн хичээлийн дүнгийн бүртгэл.
--
-- Яагаад хэрэгтэй вэ:
-- Хөх хотын их сургуулийн 20 анги (анги бүр ~25 сурагч) 发展汉语 хичээлээр суралцдаг.
-- Багш (1) ангиараа онлайн богино сорил нэгэн зэрэг өгч хурдан дүн гаргах,
-- (2) сурагч бүр юу алдаж байгааг харах, (3) ангид бүртгэлтэй сурагч өөрийн
-- дүнг («Миний дүн») харах шаардлагатай. Жирийн хэрэглэгчийн туршлага өөрчлөгдөхгүй.
--
-- ЮУ НЭМЭГДЭХ ВЭ:
--   class_quizzes            — багшийн нээдэг сорил (quiz_questions-оос асуулт сонгоно)
--   class_quiz_attempts      — сурагч бүрийн оролдлого (нэг сорилд нэг мөр)
--   question_attempts.source — оролдлогын гарал ('class_quiz' …), заавал биш
--   student_lesson_records   — view: сурагч × хичээл бүрийн хамгийн сайн дүн, оролдлого
--   RPC start_class_quiz(uuid)                 — сурагч эхлүүлнэ (хугацааг сервер тооцно)
--   RPC submit_class_quiz(uuid, jsonb)         — сервер талд дүгнэнэ, оноо өгнө
--   RPC class_quiz_class_avg(uuid)             — ангийн дундаж (багш зөвшөөрсөн бол)
--   RPC my_open_class_quizzes()                — миний ангид нээлттэй сорилууд
--
-- АЮУЛГҮЙ БАЙДАЛ: сурагч class_quiz_attempts руу ШУУД бичих эрхгүй — оноог
-- хуурамчаар бичихээс сэргийлж бүх бичилт security definer RPC-ээр дамжина.
--
-- Шаардлага: 011, 013, 045/046, 055, 057 (teacher_owns_classroom), 071 (award_points),
-- 072 (org_manager_reads_classroom). Дахин ажиллуулахад аюулгүй.

-- ---------------------------------------------------------------------------
-- 0. question_attempts.source
-- ---------------------------------------------------------------------------
alter table public.question_attempts
  add column if not exists source text;

comment on column public.question_attempts.source is
  'Оролдлогын гарал: null = хичээл/дасгал, ''class_quiz'' = ангийн хурдан сорил.';

-- ---------------------------------------------------------------------------
-- 1. class_quizzes
-- ---------------------------------------------------------------------------
create table if not exists public.class_quizzes (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  teacher_user_id uuid not null,
  title text not null,
  question_ids bigint[] not null default '{}',
  lesson_ids text[] not null default '{}',
  duration_minutes int not null default 15,
  opens_at timestamptz,
  closes_at timestamptz,
  status text not null default 'draft',
  share_results boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.class_quizzes is
  'Багшийн ангид нээдэг хурдан сорил. question_ids = public.quiz_questions.id[].';
comment on column public.class_quizzes.share_results is
  'true бол сорил хаагдсаны дараа сурагчид ангийн дунджийг харна.';

alter table public.class_quizzes
  drop constraint if exists class_quizzes_status_check;
alter table public.class_quizzes
  add constraint class_quizzes_status_check
  check (status in ('draft', 'open', 'closed'));

alter table public.class_quizzes
  drop constraint if exists class_quizzes_duration_check;
alter table public.class_quizzes
  add constraint class_quizzes_duration_check
  check (duration_minutes between 1 and 180);

create index if not exists class_quizzes_classroom_status_idx
  on public.class_quizzes (classroom_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. class_quiz_attempts
-- ---------------------------------------------------------------------------
create table if not exists public.class_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.class_quizzes(id) on delete cascade,
  student_user_id uuid not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  answers jsonb not null default '{}'::jsonb,
  correct int,
  total int,
  score_pct numeric,
  duration_sec int
);

comment on table public.class_quiz_attempts is
  'Сурагч бүрийн сорилын оролдлого. Нэг сорилд нэг мөр; зөвхөн RPC-ээр бичигдэнэ.';

create unique index if not exists class_quiz_attempts_quiz_student_uidx
  on public.class_quiz_attempts (quiz_id, student_user_id);
create index if not exists class_quiz_attempts_student_idx
  on public.class_quiz_attempts (student_user_id, submitted_at desc);

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
alter table public.class_quizzes enable row level security;
alter table public.class_quiz_attempts enable row level security;

-- class_quizzes: багш — бүгдийг
drop policy if exists "class_quizzes_teacher_all" on public.class_quizzes;
create policy "class_quizzes_teacher_all"
  on public.class_quizzes for all to authenticated
  using (public.teacher_owns_classroom(classroom_id))
  with check (public.teacher_owns_classroom(classroom_id) and teacher_user_id = auth.uid());

-- class_quizzes: ангийн сурагч — нээлттэй / хаагдсан (draft биш)
drop policy if exists "class_quizzes_student_select" on public.class_quizzes;
create policy "class_quizzes_student_select"
  on public.class_quizzes for select to authenticated
  using (
    status in ('open', 'closed')
    and exists (
      select 1 from public.classroom_students cs
      where cs.classroom_id = class_quizzes.classroom_id
        and cs.student_user_id = auth.uid()
    )
  );

-- class_quizzes: байгууллагын менежер + админ — унших
drop policy if exists "class_quizzes_org_manager_select" on public.class_quizzes;
create policy "class_quizzes_org_manager_select"
  on public.class_quizzes for select to authenticated
  using (public.org_manager_reads_classroom(classroom_id));

drop policy if exists "class_quizzes_admin_select" on public.class_quizzes;
create policy "class_quizzes_admin_select"
  on public.class_quizzes for select to authenticated
  using (public.is_admin());

-- class_quiz_attempts: сурагч — зөвхөн өөрийнхөө мөрийг унших
drop policy if exists "class_quiz_attempts_own_select" on public.class_quiz_attempts;
create policy "class_quiz_attempts_own_select"
  on public.class_quiz_attempts for select to authenticated
  using (student_user_id = auth.uid());

-- class_quiz_attempts: багш — өөрийн ангийн сорилын бүх оролдлого (устгаж дахин өгүүлж болно)
drop policy if exists "class_quiz_attempts_teacher_all" on public.class_quiz_attempts;
create policy "class_quiz_attempts_teacher_all"
  on public.class_quiz_attempts for all to authenticated
  using (
    exists (
      select 1 from public.class_quizzes q
      where q.id = class_quiz_attempts.quiz_id
        and public.teacher_owns_classroom(q.classroom_id)
    )
  )
  with check (
    exists (
      select 1 from public.class_quizzes q
      where q.id = class_quiz_attempts.quiz_id
        and public.teacher_owns_classroom(q.classroom_id)
    )
  );

drop policy if exists "class_quiz_attempts_org_manager_select" on public.class_quiz_attempts;
create policy "class_quiz_attempts_org_manager_select"
  on public.class_quiz_attempts for select to authenticated
  using (
    exists (
      select 1 from public.class_quizzes q
      where q.id = class_quiz_attempts.quiz_id
        and public.org_manager_reads_classroom(q.classroom_id)
    )
  );

drop policy if exists "class_quiz_attempts_admin_select" on public.class_quiz_attempts;
create policy "class_quiz_attempts_admin_select"
  on public.class_quiz_attempts for select to authenticated
  using (public.is_admin());

-- Багш сурагчийн цаг зарцуулсан байдлыг харах (050-д зөвхөн өөрийн + админ байсан).
drop policy if exists "user_activity_sessions_teacher_select" on public.user_activity_sessions;
create policy "user_activity_sessions_teacher_select"
  on public.user_activity_sessions for select to authenticated
  using (public.teacher_reads_learner(user_id));

-- ---------------------------------------------------------------------------
-- 4. RPC: start_class_quiz
-- ---------------------------------------------------------------------------
create or replace function public.start_class_quiz(p_quiz_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  q public.class_quizzes%rowtype;
  a public.class_quiz_attempts%rowtype;
  v_deadline timestamptz;
begin
  if v_uid is null then raise exception 'Нэвтрээгүй байна.'; end if;

  select * into q from public.class_quizzes where id = p_quiz_id;
  if not found then raise exception 'Сорил олдсонгүй.'; end if;

  if not exists (
    select 1 from public.classroom_students cs
    where cs.classroom_id = q.classroom_id and cs.student_user_id = v_uid
  ) then
    raise exception 'Та энэ ангийн сурагч биш байна.';
  end if;

  select * into a from public.class_quiz_attempts
   where quiz_id = p_quiz_id and student_user_id = v_uid;

  if found and a.submitted_at is not null then
    return jsonb_build_object('submitted', true, 'score_pct', a.score_pct,
                              'correct', a.correct, 'total', a.total);
  end if;

  if q.status <> 'open' or (q.closes_at is not null and now() > q.closes_at) then
    raise exception 'Сорил хаалттай байна.';
  end if;

  if not found then
    insert into public.class_quiz_attempts (quiz_id, student_user_id)
    values (p_quiz_id, v_uid)
    on conflict (quiz_id, student_user_id) do nothing;
    select * into a from public.class_quiz_attempts
     where quiz_id = p_quiz_id and student_user_id = v_uid;
  end if;

  v_deadline := a.started_at + make_interval(mins => q.duration_minutes);
  if q.closes_at is not null then v_deadline := least(v_deadline, q.closes_at); end if;

  return jsonb_build_object(
    'submitted', false,
    'started_at', a.started_at,
    'deadline', v_deadline,
    'server_now', now(),
    'duration_minutes', q.duration_minutes
  );
end;
$$;

revoke all on function public.start_class_quiz(uuid) from public, anon;
grant execute on function public.start_class_quiz(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. RPC: submit_class_quiz
--    p_answers = { "<quiz_questions.id>": "<сонгосон хариулт>" }
-- ---------------------------------------------------------------------------
create or replace function public.submit_class_quiz(p_quiz_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  q public.class_quizzes%rowtype;
  a public.class_quiz_attempts%rowtype;
  qq record;
  v_ans jsonb := coalesce(p_answers, '{}'::jsonb);
  v_sel text;
  v_ok boolean;
  v_correct int := 0;
  v_total int := 0;
  v_pct numeric;
  v_dur int;
  v_review jsonb := '[]'::jsonb;
  v_points int := 0;
  v_passed boolean;
  v_grace interval := interval '45 seconds';
  v_deadline timestamptz;
begin
  if v_uid is null then raise exception 'Нэвтрээгүй байна.'; end if;

  select * into q from public.class_quizzes where id = p_quiz_id;
  if not found then raise exception 'Сорил олдсонгүй.'; end if;

  if not exists (
    select 1 from public.classroom_students cs
    where cs.classroom_id = q.classroom_id and cs.student_user_id = v_uid
  ) then
    raise exception 'Та энэ ангийн сурагч биш байна.';
  end if;

  select * into a from public.class_quiz_attempts
   where quiz_id = p_quiz_id and student_user_id = v_uid
   for update;

  -- Аль хэдийн илгээсэн бол өмнөх дүнг буцаана (идемпотент).
  if found and a.submitted_at is not null then
    return jsonb_build_object('submitted', true, 'correct', a.correct, 'total', a.total,
                              'score_pct', a.score_pct, 'duration_sec', a.duration_sec,
                              'points', 0, 'already', true);
  end if;

  if q.status <> 'open' then raise exception 'Сорил хаалттай байна.'; end if;

  if not found then
    insert into public.class_quiz_attempts (quiz_id, student_user_id)
    values (p_quiz_id, v_uid)
    on conflict (quiz_id, student_user_id) do nothing;
    select * into a from public.class_quiz_attempts
     where quiz_id = p_quiz_id and student_user_id = v_uid for update;
  end if;

  v_deadline := a.started_at + make_interval(mins => q.duration_minutes);
  if q.closes_at is not null then v_deadline := least(v_deadline, q.closes_at); end if;
  if now() > v_deadline + v_grace then
    raise exception 'Хугацаа дууссан байна.';
  end if;

  for qq in
    select id, lesson_id, question, correct_answer, type
    from public.quiz_questions
    where id = any (q.question_ids)
    order by array_position(q.question_ids, id)
  loop
    v_total := v_total + 1;
    v_sel := nullif(btrim(v_ans ->> qq.id::text), '');
    v_ok := v_sel is not null and v_sel = btrim(qq.correct_answer);
    if v_ok then v_correct := v_correct + 1; end if;

    v_review := v_review || jsonb_build_object(
      'question_id', qq.id,
      'selected', v_sel,
      'correct_answer', qq.correct_answer,
      'is_correct', v_ok
    );

    insert into public.question_attempts
      (user_id, lesson_id, stage, question_id, question_type, is_correct,
       selected_answer, correct_answer, source)
    values
      (v_uid, qq.lesson_id, 'quiz', 'quiz:db:' || qq.id::text, 'choice', v_ok,
       v_sel, qq.correct_answer, 'class_quiz');
  end loop;

  v_pct := case when v_total > 0 then round(v_correct::numeric * 100 / v_total, 1) else 0 end;
  v_dur := greatest(0, extract(epoch from (now() - a.started_at))::int);

  update public.class_quiz_attempts
     set submitted_at = now(), answers = v_ans, correct = v_correct, total = v_total,
         score_pct = v_pct, duration_sec = v_dur
   where id = a.id;

  -- Оноо: шалгалттай ижил дүрэм (тэнцвэл 100 + оноо% ≤ 200, үгүй бол min(99, оноо%)).
  v_passed := v_pct >= 60;
  v_points := case
    when v_passed then least(200, 100 + round(v_pct)::int)
    else least(99, round(v_pct)::int)
  end;
  if v_points > 0 then
    perform public.award_points('exam', 'class_quiz:' || p_quiz_id::text, v_points,
      jsonb_build_object('label', q.title, 'quizId', p_quiz_id, 'percent', round(v_pct)));
  end if;

  return jsonb_build_object(
    'submitted', true, 'correct', v_correct, 'total', v_total, 'score_pct', v_pct,
    'duration_sec', v_dur, 'passed', v_passed, 'points', v_points, 'review', v_review
  );
end;
$$;

revoke all on function public.submit_class_quiz(uuid, jsonb) from public, anon;
grant execute on function public.submit_class_quiz(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. RPC: class_quiz_class_avg — ангийн дундаж (хаагдсан + багш зөвшөөрсөн үед л)
-- ---------------------------------------------------------------------------
create or replace function public.class_quiz_class_avg(p_quiz_id uuid)
returns table (avg_pct numeric, submitted int)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q public.class_quizzes%rowtype;
begin
  if auth.uid() is null then return; end if;
  select * into q from public.class_quizzes where id = p_quiz_id;
  if not found then return; end if;
  if not (
    q.share_results and q.status = 'closed'
    and exists (select 1 from public.classroom_students cs
                where cs.classroom_id = q.classroom_id and cs.student_user_id = auth.uid())
  ) then
    return;
  end if;
  return query
    select round(avg(a.score_pct), 1), count(*)::int
    from public.class_quiz_attempts a
    where a.quiz_id = p_quiz_id and a.submitted_at is not null;
end;
$$;

revoke all on function public.class_quiz_class_avg(uuid) from public, anon;
grant execute on function public.class_quiz_class_avg(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. RPC: my_open_class_quizzes — нүүр / даалгаврын хуудасны баннер
-- ---------------------------------------------------------------------------
create or replace function public.my_open_class_quizzes()
returns table (
  quiz_id uuid, title text, classroom_id uuid, classroom_name text,
  duration_minutes int, closes_at timestamptz, question_count int, submitted boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select q.id, q.title, q.classroom_id, c.name, q.duration_minutes, q.closes_at,
         coalesce(array_length(q.question_ids, 1), 0),
         exists (select 1 from public.class_quiz_attempts a
                  where a.quiz_id = q.id and a.student_user_id = auth.uid()
                    and a.submitted_at is not null)
  from public.class_quizzes q
  join public.classrooms c on c.id = q.classroom_id
  where auth.uid() is not null
    and q.status = 'open'
    and (q.closes_at is null or q.closes_at > now())
    and exists (select 1 from public.classroom_students cs
                 where cs.classroom_id = q.classroom_id and cs.student_user_id = auth.uid())
  order by q.created_at desc;
$$;

revoke all on function public.my_open_class_quizzes() from public, anon;
grant execute on function public.my_open_class_quizzes() to authenticated;

-- ---------------------------------------------------------------------------
-- 8. student_lesson_records — сурагч × хичээл бүрийн дүн
--    security_invoker → user_quiz_attempts-ийн RLS хэвээр: өөрөө, багш (055),
--    админ (056), байгууллагын менежер (072).
-- ---------------------------------------------------------------------------
create or replace view public.student_lesson_records
with (security_invoker = true) as
select
  a.user_id,
  a.lesson_id,
  max(a.percentage)::int       as best_score_pct,
  count(*)::int                as attempts,
  max(a.created_at)            as last_attempt_at,
  min(a.created_at)            as first_attempt_at
from public.user_quiz_attempts a
where a.user_id is not null
group by a.user_id, a.lesson_id;

grant select on public.student_lesson_records to authenticated;

comment on view public.student_lesson_records is
  'Сурагч × хичээл бүрийн хамгийн сайн дүн, оролдлогын тоо (user_quiz_attempts-аас). RLS нь суурь хүснэгтээс уламжилна.';
