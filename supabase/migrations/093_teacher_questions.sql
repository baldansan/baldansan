-- 093: Багш өөрөө асуулт зохиож «Хурдан сорил»-д оруулах.
--   teacher_questions  — багшийн асуултын сан (id нь 2 тэрбумаас эхэлнэ — аппын
--                        quiz_questions.id-тай хэзээ ч давхцахгүй)
--   submit_class_quiz  — дүгнэхдээ хоёр сангаас хоёулангаас нь уншдаг болгов
--                        (073-ын функцийн яг хуулбар, зөвхөн асуулт унших хэсэг өөр).
-- Дахин ажиллуулахад аюулгүй.

create sequence if not exists public.teacher_questions_id_seq start with 2000000000;

create table if not exists public.teacher_questions (
  id bigint primary key default nextval('public.teacher_questions_id_seq'),
  teacher_user_id uuid not null default auth.uid(),
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation text,
  created_at timestamptz not null default now()
);

create index if not exists teacher_questions_owner_idx
  on public.teacher_questions (teacher_user_id, created_at desc);

alter table public.teacher_questions enable row level security;

-- Унших: нэвтэрсэн хүн бүр (сорил өгөх сурагч асуултаа харах ёстой; аппын
-- quiz_questions ч мөн нээлттэй). Бичих: зөвхөн эзэмшигч багш.
drop policy if exists "teacher_questions_read" on public.teacher_questions;
create policy "teacher_questions_read"
  on public.teacher_questions for select to authenticated using (true);

drop policy if exists "teacher_questions_owner_write" on public.teacher_questions;
create policy "teacher_questions_owner_write"
  on public.teacher_questions for all to authenticated
  using (teacher_user_id = auth.uid())
  with check (teacher_user_id = auth.uid());

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
    select u.id, u.lesson_id, u.question, u.correct_answer, u.type
    from (
      select id, lesson_id, question, correct_answer, type
        from public.quiz_questions
       where id = any (q.question_ids)
      union all
      -- 093: багшийн өөрийн зохиосон асуултууд
      select id, 'teacher-custom'::text, question, correct_answer, 'choice'::text
        from public.teacher_questions
       where id = any (q.question_ids)
    ) u
    order by array_position(q.question_ids, u.id)
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
