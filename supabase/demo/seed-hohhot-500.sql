-- =============================================================================
-- ЖИШЭЭ ӨГӨГДӨЛ — Хөх хотын их сургуулийн хөтөлбөр (20 анги × 25 = 500 оюутан)
-- =============================================================================
--
-- «Өвөр Монголын Их Сургууль — Монгол оюутны хятад хэлний хөтөлбөр»-ийн
-- тэнхимийн эрхлэгчид үзүүлэх демо. Самбарууд «амьд» харагдуулах зорилгоор:
--   * 1 байгууллага, 1 эрхлэгч, 20 багш, 20 анги (1班 … 20班), 500 оюутан
--   * сүүлийн 60 хоногийн идэвх, хичээл, дасгал, сорил, ирц, даалгавар, шалгалт,
--     хурдан сорил, оноо (points) — анги бүр өөр чадвартай (сайн / дунд / сул)
--   * анги бүрт 3–5 «од» оюутан, 2–3 «хоцорч буй» оюутан; нийт ~6% нь
--     сүүлийн 14+ хоног идэвхгүй; зарим нь шалгалтад тэнцээгүй
--
-- ⚠️ ЭНЭ БОЛ ЖИШЭЭ ӨГӨГДӨЛ. Бүх нэр зохиомол, бүх дүн тооцоолж үүсгэсэн.
-- Үзүүлбэр дээр «системийн боломжийг харуулсан жишээ өгөгдөл» гэж хэлнэ —
-- жинхэнэ оюутнуудын тоо биш.
--
-- Хэрхэн ажиллуулах: Supabase → SQL Editor → бүхэлд нь хуулж Run (1 удаа).
-- Дахин ажиллуулахад аюулгүй: эхлээд өмнөх (ЭНЭ seed-ийн) өгөгдлөө цэвэрлээд
-- дахин үүсгэнэ. Санамсаргүй тоо тогтмол (setseed(0.42) + md5 хэш) тул
-- ажиллуулах бүрт ИЖИЛ харагдана.
-- Устгах бол: доорх «ЦЭВЭРЛЭХ» хэсгийг (1-р DO блок) дангаар нь ажиллуулна.
-- Хуучин сургалтын төвийн seed (seed-training-center.sql)-д ХҮРЭХГҮЙ.
--
-- Шаардлага: миграц 009, 011–013, 038, 041, 042, 045/046, 050, 054, 057–059,
--            064, 066, 071, 073, 074 ажилласан байх (мөн mock_tests, lessons,
--            quiz_questions, videos хүснэгтэд жинхэнэ өгөгдөл байх).
--
-- ID-ийн дүрэм (seed-training-center.sql-тэй ижил угтвар, ӨӨР төрлийн код):
--   d0000000-0000-4000-8000-<төрөл 4 орон><дугаар 8 орон>
--   2001 байгууллага          2002 багш/эрхлэгчийн хэрэглэгч   2003 анги
--   2004 оюутны хэрэглэгч     2005 classroom_students.id        2006 organization_members.id
--   2007 assignments          2008 assignment_results           2009 classroom_exams
--   2010 class_quizzes        2011 class_quiz_attempts          2012 classroom_attendance
--   2013 user_test_attempts   2014 user_quiz_attempts           2015 user_lesson_progress
--   2016 question_attempts    2017 user_activity_sessions       2018 user_daily_activity
--   2019 user_game_results    2020 user_video_progress          2021 user_points_ledger
--   2022 chat_rooms
-- Байгууллагын ID: d0000000-0000-4000-8000-200100000001
--
-- ТЕХНИКИЙН ТЭМДЭГЛЭЛ (яагаад session_replication_role = replica вэ?):
--   Демо хэрэглэгчид auth.users-д БАЙХГҮЙ. Харин question_attempts,
--   user_activity_sessions, user_game_results, user_video_progress,
--   user_test_attempts, user_points_*, chat_* хүснэгтүүдийн user_id нь
--   auth.users-д FOREIGN KEY-тэй. Тиймээс энэ скрипт гүйлгэх хугацаандаа
--   (зөвхөн тухайн transaction-д) session_replication_role = replica болгож
--   FK шалгалт ба триггерийг түр унтраана. Үр дүнд:
--     - user_points_daily / user_points_totals-ийг триггер биш, энэ скрипт
--       өөрөө user_points_ledger-ээс тооцож бөглөнө (071-ийн триггертэй ижил дүн).
--     - Ангийн чат өрөөг (074-ийн триггер) энэ скрипт өөрөө үүсгэнэ
--       (owner_user_id = NULL; чатын гишүүн/топик өрөө үүсгэхгүй — FK-тэй).
--     - user_public_profile-ийг БИЧИХГҮЙ (auth.users-д FK, демо хэрэглэгчид
--       байхгүй) тул «Шилдэг сурагчид» (public) жагсаалтад харагдахгүй.
--       Харин байгууллагын самбар (rank_organization) нэрийг classroom_students-ээс авдаг.
-- =============================================================================


-- =============================================================================
-- 1. ЦЭВЭРЛЭХ  (энэ блокийг дангаар нь ажиллуулбал бүх демо өгөгдөл устна)
-- =============================================================================
do $cleanup$
declare
  v_sql text;
begin
  -- FK шалгалт + триггер түр унтраах (зөвхөн энэ transaction-д).
  begin
    perform set_config('session_replication_role', 'replica', true);
  exception when others then
    raise exception 'session_replication_role=replica тохируулах эрх алга (%). Supabase SQL Editor-ийг postgres эрхээр ажиллуулна уу.', sqlerrm;
  end;

  -- Зөвхөн ЭНЭ seed-ийн төрлийн кодууд (2001–2022). Хуучин seed-ийн 0001–0007 кодод хүрэхгүй.
  foreach v_sql in array array[
    $q$delete from public.user_points_daily  where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.user_points_totals where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.user_points_ledger where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.class_quiz_attempts where student_user_id::text like 'd0000000-0000-4000-8000-2004%' or quiz_id::text like 'd0000000-0000-4000-8000-2010%'$q$,
    $q$delete from public.class_quizzes where id::text like 'd0000000-0000-4000-8000-2010%' or classroom_id::text like 'd0000000-0000-4000-8000-2003%'$q$,
    $q$delete from public.question_attempts where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.user_activity_sessions where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.user_daily_activity where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.user_streaks where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.user_game_results where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.user_video_progress where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.user_test_attempts where user_id::text like 'd0000000-0000-4000-8000-2004%' or id::text like 'd0000000-0000-4000-8000-2013%'$q$,
    $q$delete from public.user_quiz_attempts where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.user_lesson_progress where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.classroom_attendance where classroom_id::text like 'd0000000-0000-4000-8000-2003%' or student_id::text like 'd0000000-0000-4000-8000-2005%'$q$,
    $q$delete from public.classroom_exams where id::text like 'd0000000-0000-4000-8000-2009%' or classroom_id::text like 'd0000000-0000-4000-8000-2003%'$q$,
    $q$delete from public.assignment_results where student_user_id::text like 'd0000000-0000-4000-8000-2004%' or assignment_id::text like 'd0000000-0000-4000-8000-2007%'$q$,
    $q$delete from public.assignments where id::text like 'd0000000-0000-4000-8000-2007%' or classroom_id::text like 'd0000000-0000-4000-8000-2003%'$q$,
    $q$delete from public.chat_rooms where id::text like 'd0000000-0000-4000-8000-2022%' or classroom_id::text like 'd0000000-0000-4000-8000-2003%'$q$,
    $q$delete from public.classroom_students where id::text like 'd0000000-0000-4000-8000-2005%' or student_user_id::text like 'd0000000-0000-4000-8000-2004%' or classroom_id::text like 'd0000000-0000-4000-8000-2003%'$q$,
    $q$delete from public.student_profiles where user_id::text like 'd0000000-0000-4000-8000-2004%'$q$,
    $q$delete from public.classrooms where id::text like 'd0000000-0000-4000-8000-2003%'$q$,
    $q$delete from public.teacher_profiles where user_id::text like 'd0000000-0000-4000-8000-2002%'$q$,
    $q$delete from public.organization_members where organization_id::text like 'd0000000-0000-4000-8000-2001%' or user_id::text like 'd0000000-0000-4000-8000-2002%'$q$,
    $q$delete from public.organizations where id::text like 'd0000000-0000-4000-8000-2001%'$q$
  ] loop
    begin
      execute v_sql;
    exception when undefined_table then
      raise notice 'Алгаслаа (хүснэгт алга): %', left(v_sql, 60);
    end;
  end loop;

  perform set_config('session_replication_role', 'origin', true);
  raise notice 'Хөх хотын демо өгөгдөл цэвэрлэгдлээ.';
end $cleanup$;


-- =============================================================================
-- 2. ҮҮСГЭХ
-- =============================================================================
do $seed$
declare
  pfx      constant text := 'd0000000-0000-4000-8000-';
  v_org    constant uuid := 'd0000000-0000-4000-8000-200100000001';
  v_today  date := (now() at time zone 'Asia/Ulaanbaatar')::date;  -- Хөх хот/Улаанбаатар хоёул UTC+8
  v_nv     int;
  v_nt     int;
  v_n      bigint;
begin
  -- Тогтмол санамсаргүй тоо (хоёр давхар: setseed + md5-хэш хэрэгжүүлэлт).
  perform setseed(0.42);

  -- ------------------------------------------------------------------ Шалгалт
  if to_regclass('public.class_quizzes') is null
     or to_regclass('public.class_quiz_attempts') is null
     or to_regclass('public.user_points_ledger') is null
     or to_regclass('public.user_points_daily') is null
     or to_regclass('public.user_points_totals') is null
     or to_regclass('public.chat_rooms') is null
     or to_regclass('public.classroom_attendance') is null
     or to_regclass('public.classroom_exams') is null
     or to_regclass('public.user_activity_sessions') is null
     or to_regclass('public.user_game_results') is null
     or to_regclass('public.user_video_progress') is null then
    raise exception 'Шаардлагатай миграц (057, 059, 050, 038, 071, 073, 074) ажиллаагүй байна. Эхлээд supabase/migrations-ийг ажиллуулна уу.';
  end if;
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'question_attempts' and column_name = 'source'
  ) then
    raise exception '073 миграц (question_attempts.source) ажиллаагүй байна.';
  end if;

  -- FK шалгалт + триггер түр унтраах (зөвхөн энэ transaction-д; төгсгөлд буцаана).
  begin
    perform set_config('session_replication_role', 'replica', true);
  exception when others then
    raise exception 'session_replication_role=replica тохируулах эрх алга (%). Supabase SQL Editor-ийг postgres эрхээр ажиллуулна уу.', sqlerrm;
  end;
  if current_setting('session_replication_role') <> 'replica' then
    raise exception 'session_replication_role=replica идэвхжсэнгүй.';
  end if;

  -- ------------------------------------------------------------- Туслах функцүүд
  -- (pg_temp: зөвхөн энэ session-д, төгсгөлд устгана)
  -- hr(текст) → 0..1 хоорондох ТОГТМОЛ (deterministic) "санамсаргүй" тоо.
  execute $fn$
    create or replace function pg_temp.hr(t text) returns float8
    language sql immutable as $b$
      select ((('x' || substr(md5(t), 1, 7))::bit(28)::int) % 100000)::float8 / 100000.0
    $b$
  $fn$;
  -- did(төрөл, дугаар) → демо uuid
  execute $fn$
    create or replace function pg_temp.did(ty text, n bigint) returns uuid
    language sql immutable as $b$
      select ('d0000000-0000-4000-8000-' || ty || lpad(n::text, 8, '0'))::uuid
    $b$
  $fn$;
  -- ts(өдөр, 0..1) → тухайн өдрийн 09:00–23:00 (Хөх хотын цаг) дахь цаг; ирээдүйд гарахгүй.
  execute $fn$
    create or replace function pg_temp.ts(d date, f float8) returns timestamptz
    language sql stable as $b$
      select least(
        (d::timestamp + make_interval(secs => 32400 + f * 50400)) at time zone 'Asia/Ulaanbaatar',
        now() - interval '10 minutes'
      )
    $b$
  $fn$;
  execute $fn$
    create or replace function pg_temp.clamp(x float8, lo float8, hi float8) returns float8
    language sql immutable as $b$
      select greatest(lo, least(hi, x))
    $b$
  $fn$;

  -- ============================================================ Лавлах хүснэгтүүд
  -- Анги бүрийн багшийн чадвар (0.35–0.95) → ангийн түвшин. trend: сүүлийн
  -- 8 долоо хоногт идэвх өсч/буурч байгаа байдал.
  create temp table _cls on commit drop as
  select t.cls::int as cls,
         t.skill::float8 as skill,
         t.tname as teacher_name,
         case when t.cls <= 12 then 'fazhan-chuji1'
              when t.cls <= 18 then 'fazhan-chuji2'
              else 'fazhan-zhongji1' end as course_id,
         pg_temp.did('2002', t.cls) as teacher_id,
         pg_temp.did('2003', t.cls) as class_id,
         t.cls || '-р анги · ' || t.cls || '班' as class_name,
         ((((t.cls * 7) % 11) - 5) / 10.0)::float8 as trend,
         case when t.cls % 5 = 0 then 'hybrid' else 'in_person' end as delivery_mode,
         '5301' || lpad(t.cls::text, 2, '0') as join_code
    from unnest(
      array[0.91, 0.72, 0.56, 0.84, 0.38, 0.66, 0.79, 0.50, 0.95, 0.62,
            0.35, 0.76, 0.69, 0.88, 0.44, 0.58, 0.82, 0.64, 0.52, 0.86]::float8[],
      array['Б. Оюунчимэг', 'Д. Ганбаатар', 'С. Нарантуяа', 'Ж. Энхболд', 'Г. Мөнхзул',
            'Т. Батсайхан', 'Н. Сарантуяа', 'Э. Пүрэвдорж', 'Ц. Алтанцэцэг', 'Х. Дэлгэрмаа',
            'О. Ганзориг', 'Л. Уранчимэг', 'Ч. Бямбажав', 'Ш. Оюунгэрэл', 'М. Тэмүүжин',
            'Я. Хулан', 'А. Баттөмөр', 'Ү. Сайнбилэг', 'Р. Цэцэгдарь', 'З. Эрдэнэчимэг']::text[]
    ) with ordinality as t(skill, tname, cls);

  -- Ангийн хөтөлбөр: курсын эхний 10 хичээл.
  create temp table _cl on commit drop as
  select c.cls, g.k,
         c.course_id || '-l' || lpad(g.k::text, 2, '0') as lesson_id,
         coalesce(l.title, c.course_id || '-l' || lpad(g.k::text, 2, '0')) as title
    from _cls c
    cross join generate_series(1, 10) as g(k)
    left join public.lessons l on l.id = c.course_id || '-l' || lpad(g.k::text, 2, '0');

  -- Тэдгээр хичээлийн жинхэнэ асуултууд (байхгүй бол quiz-ийн мөр алгасагдана).
  create temp table _qq on commit drop as
  select q.id, q.lesson_id, q.correct_answer, q.options,
         row_number() over (partition by q.lesson_id order by q.order_index, q.id) as rn,
         count(*) over (partition by q.lesson_id) as cnt
    from public.quiz_questions q
   where q.lesson_id in (select lesson_id from _cl);

  create temp table _lq on commit drop as
  select lesson_id, max(cnt) as cnt from _qq group by lesson_id;

  -- Жинхэнэ видеонууд (байхгүй бол видео мөр алгасагдана).
  create temp table _vid on commit drop as
  select x.id, x.dur, x.rn
    from (
      select v.id, coalesce(v.duration_sec, 300)::float8 as dur,
             row_number() over (order by v.id) as rn
        from public.videos v
    ) x
   where x.rn <= 30;
  select count(*) into v_nv from _vid;
  if v_nv = 0 then
    raise notice 'videos хүснэгт хоосон — видео идэвх/ахиц алгасав.';
  end if;

  -- Жинхэнэ HSK3 / HSK4 загвар шалгалтууд.
  create temp table _tst on commit drop as
  select t.id, t.hsk_level,
         row_number() over (partition by t.hsk_level order by t.id) as rn,
         count(*) over (partition by t.hsk_level) as cnt
    from public.mock_tests t
   where t.hsk_level in (3, 4);
  select count(*) into v_nt from _tst;
  if v_nt = 0 then
    raise notice 'HSK3/HSK4 mock_tests олдсонгүй — ангийн шалгалт алгасав.';
  end if;

  -- Анги бүрийн өнгөрсөн + удахгүй болох шалгалтын тест.
  create temp table _cex on commit drop as
  select c.cls, lv.l as hsk_level,
         (select t.id from _tst t where t.hsk_level = lv.l and t.rn = 1 + (c.cls % t.cnt)) as past_test,
         (select t.id from _tst t where t.hsk_level = lv.l and t.rn = 1 + ((c.cls + 1) % t.cnt)) as next_test
    from _cls c
    cross join lateral (
      select case
               when exists (select 1 from _tst t where t.hsk_level = case when c.cls >= 19 then 4 else 3 end)
                 then case when c.cls >= 19 then 4 else 3 end
               else (select min(t.hsk_level) from _tst t)
             end as l
    ) lv;

  -- ================================================================ ОЮУТНУУД
  -- tier: star (од) | normal | struggling (хоцорч буй) | inactive (идэвхгүй, ~6%)
  -- ability: 0..1 чадвар; act: өдөр бүр суралцах магадлал; lastoff: хэдэн өдрийн
  -- өмнө сүүлд идэвхтэй байсан (идэвхгүйд 15–44, бусдад 0);
  -- weak: сул тал (grammar 30% | word_practice 25% | exam 20% | balanced 25%);
  -- n_done: дуусгасан хичээлийн тоо (хөтөлбөрийн 10-аас).
  create temp table _s on commit drop as
  with nm as (
    select
      array['Тэмүүлэн','Оюунчимэг','Ганбат','Номин','Энхбаяр','Саруул','Мөнхбаяр','Хулан','Билгүүн','Анужин',
            'Золбоот','Сарнай','Нямдорж','Цэцэгмаа','Баярсайхан','Уянга','Цогтбаатар','Энхжин','Эрдэнэбат','Мөнхцэцэг',
            'Хүрэлбаатар','Билгүүнзаяа','Анхбаяр','Наранцэцэг','Түвшинжаргал','Урантуяа','Дөлгөөн','Ариунаа','Сүхбат','Золзаяа',
            'Болдбаатар','Туяа','Пүрэвдорж','Оюунбилэг','Лхагвадорж','Ундрах','Мэндбаяр','Айнур','Отгонбаяр','Баярмаа',
            'Содномдорж','Дуламсүрэн','Алтангэрэл','Сайнзаяа','Ууганбаяр','Энхрий','Батсайхан','Пүрэвцэцэг','Бат-Эрдэнэ','Мөнхзул']::text[] as gn,
      array['А','Б','Г','Д','Ж','Л','М','Н','О','Ө','П','С','Т','Ү','Х','Ц','Ч','Ш','Э','Я']::text[] as fi
  ), b as (
    select g.sq::int as seq,
           ((g.sq - 1) / 25 + 1)::int as cls,
           ((g.sq - 1) % 25 + 1)::int as pos
      from generate_series(1, 500) as g(sq)
  ), t as (
    select b.seq, b.cls, b.pos, c.skill as cskill, c.class_id,
           case
             when b.pos <= 3 + (b.cls % 3) then 'star'
             when b.pos > 25 - (2 + (b.cls % 2)) then 'struggling'
             when b.pos = 10 or (b.pos = 11 and b.cls % 2 = 1) then 'inactive'
             else 'normal'
           end as tier
      from b join _cls c on c.cls = b.cls
  ), a as (
    select t.*,
           case t.tier
             when 'star' then pg_temp.clamp(t.cskill + 0.20 + pg_temp.hr('ab' || t.seq) * 0.10, 0.2, 0.98)
             when 'struggling' then pg_temp.clamp(t.cskill - 0.22 - pg_temp.hr('ab' || t.seq) * 0.10, 0.18, 0.9)
             when 'inactive' then pg_temp.clamp(t.cskill + (pg_temp.hr('ab' || t.seq) - 0.5) * 0.26 - 0.08, 0.18, 0.95)
             else pg_temp.clamp(t.cskill + (pg_temp.hr('ab' || t.seq) - 0.5) * 0.26, 0.2, 0.95)
           end as ability
      from t
  )
  select a.seq, a.cls, a.pos, a.tier, a.ability, a.class_id,
         pg_temp.did('2004', a.seq) as user_id,
         pg_temp.did('2005', a.seq) as row_id,
         nm.fi[1 + (((a.seq - 1) / 50) + 3 * ((a.seq - 1) % 50)) % 20] || '. ' || nm.gn[1 + ((a.seq - 1) % 50)] as full_name,
         'oyutan' || a.seq || '@example.mn' as email,
         case when a.tier = 'inactive' then 15 + floor(pg_temp.hr('lo' || a.seq) * 30)::int else 0 end as lastoff,
         case a.tier
           when 'star' then 0.88 + pg_temp.hr('ac' || a.seq) * 0.08
           when 'struggling' then 0.15 + a.ability * 0.35
           when 'inactive' then 0.25 + a.ability * 0.40
           else 0.25 + a.ability * 0.50
         end::float8 as act,
         case
           when pg_temp.hr('wk' || a.seq) < 0.30 then 'grammar'
           when pg_temp.hr('wk' || a.seq) < 0.55 then 'word_practice'
           when pg_temp.hr('wk' || a.seq) < 0.75 then 'exam'
           else 'balanced'
         end as weak,
         case a.tier
           when 'star' then 9 + (case when pg_temp.hr('nd' || a.seq) > 0.45 then 1 else 0 end)
           when 'struggling' then 1 + floor(pg_temp.hr('nd' || a.seq) * 3)::int
           when 'inactive' then greatest(1, least(6, round(a.ability * 6 + (pg_temp.hr('nd' || a.seq) - 0.5) * 2)::int))
           else greatest(2, least(10, round(a.ability * 10 + (pg_temp.hr('nd' || a.seq) - 0.5) * 3)::int))
         end as n_done
    from a cross join nm;

  -- =========================================================== ХИЧЭЭЛИЙН АХИЦ
  -- Дууссан хичээл бүр: хэдэн өдрийн өмнө (ago), хэдэн цагт (ts).
  create temp table _done on commit drop as
  select d.seq, d.user_id, d.cls, d.k, d.lesson_id, d.ago,
         (v_today - d.ago) as day,
         pg_temp.ts(v_today - d.ago, 0.80 + pg_temp.hr('dt' || d.seq || ':' || d.k) * 0.10) as ts
    from (
      select s.seq, s.user_id, s.cls, g.i as k, cl.lesson_id,
             (s.lastoff + floor((s.n_done - g.i + pg_temp.hr('dn' || s.seq || ':' || g.i))
                                * (56 - s.lastoff) / (s.n_done + 1)::float8)::int) as ago
        from _s s
        cross join lateral generate_series(1, s.n_done) as g(i)
        join _cl cl on cl.cls = s.cls and cl.k = g.i
    ) d;

  -- Дуусаагүй (явж буй) хичээл.
  create temp table _curp on commit drop as
  select s.seq, s.user_id, cl.lesson_id,
         15 + floor(pg_temp.hr('ip' || s.seq) * 70)::int as pct,
         (s.lastoff + floor(pg_temp.hr('ipo' || s.seq) * 3)::int) as ago
    from _s s
    join _cl cl on cl.cls = s.cls and cl.k = s.n_done + 1
   where s.n_done < 10 and pg_temp.hr('ipx' || s.seq) < 0.65;

  -- ============================================================ ИДЭВХТЭЙ ӨДРҮҮД
  -- Өдөр бүр: act × (амралтын өдөр 0.5) × (ангийн trend). Хичээл дуусгасан өдөр,
  -- идэвхгүй оюутны сүүлийн идэвхтэй өдөр заавал идэвхтэй.
  create temp table _act on commit drop as
  select distinct a.seq, a.ago
    from (
      select s.seq, g.o as ago
        from _s s
        cross join generate_series(0, 57) as g(o)
        join _cls c on c.cls = s.cls
       where g.o >= s.lastoff
         and pg_temp.hr('d' || s.seq || ':' || g.o) <
             least(0.97::float8,
                   s.act
                   * (case when extract(isodow from (v_today - g.o)) >= 6 then 0.5 else 1.0 end)::float8
                   * (1 + c.trend * (0.5 - g.o / 57.0))::float8)
      union
      select seq, ago from _done
      union
      select seq, lastoff from _s where lastoff > 0
    ) a;

  -- Дараалсан өдрүүдийн «арлууд» (streak тооцоход).
  create temp table _actx on commit drop as
  select x.seq, x.ago, x.day, x.grp,
         row_number() over (partition by x.seq, x.grp order by x.day) as pos,
         count(*) over (partition by x.seq, x.grp) as len
    from (
      select a.seq, a.ago, (v_today - a.ago) as day,
             (v_today - a.ago) - (row_number() over (partition by a.seq order by a.ago desc))::int as grp
        from _act a
    ) x;

  -- ================================================== user_activity_sessions
  create temp table _sess on commit drop as
  with ab as (
    select a.seq, a.ago, a.day, s.user_id, s.cls, s.ability, s.act, s.n_done, c.course_id,
           -- суралцах эрчим: од оюутан видео/давтлага/тоглоомыг илүү их хийнэ
           (case s.tier when 'star' then 1.8 when 'struggling' then 0.7 else 0.7 + 0.6 * s.act end)::float8 as ix
      from _actx a
      join _s s on s.seq = a.seq
      join _cls c on c.cls = s.cls
  )
  select u.seq, u.user_id, u.day, u.ago, u.surface, u.ref_id, u.seconds
    from (
      select ab.seq, ab.user_id, ab.day, ab.ago, 'lesson'::text as surface, cl.lesson_id as ref_id,
             round((600 + pg_temp.hr('sl' || ab.seq || ':' || ab.ago) * 1500) * (0.8 + ab.ability * 0.5))::int as seconds
        from ab
        join _cl cl on cl.cls = ab.cls
         and cl.k = greatest(1, least(10, 1 + floor((57 - ab.ago) * (ab.n_done + 1)::float8 / 58)::int))
      union all
      select ab.seq, ab.user_id, ab.day, ab.ago, 'video', v.id,
             round(240 + pg_temp.hr('sv2' || ab.seq || ':' || ab.ago) * 900)::int
        from ab
        join _vid v on v.rn = 1 + ((ab.seq + ab.ago) % greatest(v_nv, 1))
       where pg_temp.hr('sv' || ab.seq || ':' || ab.ago) < 0.28 * ab.ix
      union all
      select ab.seq, ab.user_id, ab.day, ab.ago, 'game',
             (array['match', 'translate', 'missing-word', 'arrange', 'meaning'])[1 + ((ab.seq + ab.ago) % 5)],
             round(180 + pg_temp.hr('sg2' || ab.seq || ':' || ab.ago) * 600)::int
        from ab
       where pg_temp.hr('sg' || ab.seq || ':' || ab.ago) < 0.33 * ab.ix
      union all
      select ab.seq, ab.user_id, ab.day, ab.ago, 'review', ab.course_id,
             round(120 + pg_temp.hr('sr2' || ab.seq || ':' || ab.ago) * 480)::int
        from ab
       where pg_temp.hr('sr' || ab.seq || ':' || ab.ago) < 0.30 * ab.ix
      union all
      select ab.seq, ab.user_id, ab.day, ab.ago, 'mock', 'HSK3',
             round(1800 + pg_temp.hr('sm2' || ab.seq || ':' || ab.ago) * 3000)::int
        from ab
       where pg_temp.hr('sm' || ab.seq || ':' || ab.ago) < 0.04
      union all
      select ab.seq, ab.user_id, ab.day, ab.ago, 'writing', 'hanzi',
             round(300 + pg_temp.hr('sw2' || ab.seq || ':' || ab.ago) * 600)::int
        from ab
       where pg_temp.hr('sw' || ab.seq || ':' || ab.ago) < 0.12
    ) u;

  -- ============================================================ Тоглоомын үр дүн
  create temp table _game on commit drop as
  select pg_temp.did('2019', row_number() over (order by z.seq, z.day, z.p)) as id,
         z.user_id, z.day, z.game_type, z.correct,
         (z.correct * 10) as accuracy,
         (z.correct * 10 + floor(pg_temp.hr('gs' || z.seq || ':' || z.ago || ':' || z.p) * 20)::int) as score,
         pg_temp.ts(z.day, pg_temp.hr('gt' || z.seq || ':' || z.ago || ':' || z.p)) as played_at
    from (
      select se.seq, se.user_id, se.day, se.ago, se.ref_id as game_type, g.p,
             round(pg_temp.clamp(
               s.ability
               + (pg_temp.hr('ga' || se.seq || ':' || se.ago || ':' || g.p) - 0.5) * 0.30
               - (case when s.weak = 'word_practice' then 0.08 else 0.0 end)::float8,
               0.2, 1.0) * 10)::int as correct
        from _sess se
        join _s s on s.seq = se.seq
        cross join lateral generate_series(1, 1 + floor(pg_temp.hr('gp' || se.seq || ':' || se.ago) * 2.6)::int + (case when s.tier = 'star' then 2 else 0 end)) as g(p)
       where se.surface = 'game'
    ) z;

  -- ============================================================ Хичээлийн quiz
  -- Дууссан хичээл бүр 1–3 оролдлого (чадвар доор байх тусам олон оролдоно).
  create temp table _qa on commit drop as
  select z.seq, z.user_id, z.lesson_id, z.day, z.ago, z.att, z.total, z.score,
         round(z.score * 100.0 / z.total)::int as percentage,
         pg_temp.ts(z.day, 0.30 + z.att * 0.12 + pg_temp.hr('qt' || z.seq || ':' || z.lesson_id || ':' || z.att) * 0.04) as created_at
    from (
      select d.seq, d.user_id, d.lesson_id, d.day, d.ago, g.a as att, t.total,
             least(t.total, greatest(0, round(
               pg_temp.clamp(
                 s.ability * 100
                 + (pg_temp.hr('qp' || d.seq || ':' || d.lesson_id || ':' || g.a) - 0.5) * 26
                 + (g.a - 1) * 7
                 - (case when s.weak = 'exam' then 6 else 0 end)::float8,
                 15, 100) * t.total / 100)::int)) as score
        from _done d
        join _s s on s.seq = d.seq
        cross join generate_series(1, 3) as g(a)
        cross join lateral (
          select least(20, coalesce((select q.cnt from _lq q where q.lesson_id = d.lesson_id), 10))::int as total
        ) t
       where g.a = 1
          or (g.a = 2 and pg_temp.hr('qa2' || d.seq || ':' || d.lesson_id) > s.ability * 0.9)
          or (g.a = 3 and pg_temp.hr('qa2' || d.seq || ':' || d.lesson_id) > s.ability * 0.9
                      and pg_temp.hr('qa3' || d.seq || ':' || d.lesson_id) > s.ability * 0.9 + 0.05)
    ) z;

  -- ====================================================== Асуулт тус бүрийн хариулт
  -- Үе шат: grammar | word_practice | quiz. Оюутан бүр нэг сул талтай:
  -- тэр үе шатандаа ~30 пункт доогуур зөв хариулна.
  create temp table _qrows on commit drop as
  select z.*,
         (pg_temp.hr('qr' || z.seq || ':' || z.lesson_id || ':' || z.stage || ':' || z.n) < z.p) as ok
    from (
      select d.seq, d.user_id, d.lesson_id, st.stage, g.n,
             (d.ago + (case when pg_temp.hr('qo' || d.seq || ':' || d.lesson_id || ':' || st.stage || ':' || g.n) < 0.25 then 1 else 0 end)) as qago,
             pg_temp.hr('qh' || d.seq || ':' || d.lesson_id || ':' || st.stage || ':' || g.n) as qfrac,
             q.id as qid, q.correct_answer, q.options,
             pg_temp.clamp(
               s.ability
               - (case when st.stage = s.weak or (st.stage = 'quiz' and s.weak = 'exam') then 0.30 else 0.0 end)::float8
               + (case when s.weak = 'balanced' then (pg_temp.hr('bal' || s.seq || st.stage) - 0.5) * 0.08 else 0.02 end)::float8
               - (case when st.stage = 'quiz' then (pg_temp.hr('qd' || q.id) * 0.30 - 0.12) else 0.0 end)::float8,
               0.05, 0.97) as p
        from _done d
        join _s s on s.seq = d.seq
        cross join (values ('grammar'), ('word_practice'), ('quiz')) as st(stage)
        cross join lateral generate_series(1, 3 + floor(pg_temp.hr('n' || d.seq || ':' || d.lesson_id || ':' || st.stage) * 2)::int) as g(n)
        left join _qq q on st.stage = 'quiz' and q.lesson_id = d.lesson_id and q.rn = 1 + ((g.n + d.seq) % q.cnt)
       where st.stage <> 'quiz' or q.id is not null
    ) z;

  -- ================================================== Ангийн шалгалтын оролдлого
  -- Тэнцэх босго HSK3/4: 180/300. Оюутны оноо = 0.49 + 0.27·чадвар + шуугиан.
  create temp table _ea on commit drop as
  with base as (
    select s.seq, s.user_id, s.cls, s.weak, x.past_test as test_id, x.hsk_level,
           round(pg_temp.clamp(
             0.49 + 0.27 * s.ability
             + (pg_temp.hr('e1' || s.seq) + pg_temp.hr('e2' || s.seq) + pg_temp.hr('e3' || s.seq) - 1.5) * 0.14,
             0.2, 0.98) * 300)::int as tot
      from _s s
      join _cex x on x.cls = s.cls
     where x.past_test is not null
       and s.lastoff <= 18
       and pg_temp.hr('sat' || s.seq) < (case s.tier when 'struggling' then 0.82 when 'star' then 0.99 else 0.94 end)
  ), sec as (
    select b.*,
           least(100, greatest(0, round(b.tot / 3.0::float8
             + (case when b.weak = 'exam' then -12.0 else (pg_temp.hr('el' || b.seq) - 0.5) * 10 end)::float8)::int)) as l,
           least(100, greatest(0, round(b.tot / 3.0::float8
             + ((pg_temp.hr('er' || b.seq) - 0.5) * 10)::float8)::int)) as r
      from base b
  )
  select pg_temp.did('2013', row_number() over (order by sec.seq)) as id,
         sec.seq, sec.user_id, sec.cls, sec.test_id, sec.hsk_level, sec.l, sec.r,
         least(100, greatest(0, sec.tot - sec.l - sec.r)) as w,
         sec.l + sec.r + least(100, greatest(0, sec.tot - sec.l - sec.r)) as total,
         pg_temp.ts(v_today - 18, 0.10 + pg_temp.hr('ef' || sec.seq) * 0.10) as finished_at
    from sec;

  -- ================================================================ Даалгаврууд
  -- 11, 12 = ангид өгсөн энгийн даалгавар; 13 = хамгийн сул оюутанд өгсөн (target).
  create temp table _asg on commit drop as
  select c.cls, v.k, pg_temp.did('2007', c.cls * 100 + v.k) as id, v.atype, cl.lesson_id,
         v.ttl || ' — ' || v.lno || '-р хичээл' as title, v.due_off, null::uuid as target_user
    from _cls c
    cross join (values (11, 'vocabulary', 3, 35, 'Үгсийн дасгал'),
                       (12, 'quiz',       6, 14, 'Бататгах сорил')) as v(k, atype, lno, due_off, ttl)
    join _cl cl on cl.cls = c.cls and cl.k = v.lno
  union all
  select s.cls, 13, pg_temp.did('2007', s.cls * 100 + 13), 'review', cl.lesson_id,
         'Нэмэлт давтлага — ' || s.full_name, -4, s.user_id
    from _s s
    join _cl cl on cl.cls = s.cls and cl.k = 2
   where s.pos = 25;

  create temp table _ar on commit drop as
  with cur as (
    select pg_temp.did('2007', d.cls * 100 + d.k) as assignment_id, d.user_id, d.seq,
           'completed'::text as status, d.ts as completed_at,
           b.score as qscore, b.total as qtotal, b.percentage as qpct,
           false as late, 'curriculum'::text as kind, d.day as day
      from _done d
      left join (
        select distinct on (q.seq, q.lesson_id) q.seq, q.lesson_id, q.score, q.total, q.percentage
          from _qa q
         order by q.seq, q.lesson_id, q.percentage desc
      ) b on b.seq = d.seq and b.lesson_id = d.lesson_id
  ), reg0 as (
    select a.id as assignment_id, s.user_id, s.seq, s.ability, s.lastoff, a.due_off,
           (pg_temp.hr('ac' || s.seq || ':' || a.k) < pg_temp.clamp(s.ability * 0.9 + 0.15, 0.2, 0.99)) as wants,
           (pg_temp.hr('al' || s.seq || ':' || a.k) < 0.35 - s.ability * 0.25) as late,
           pg_temp.hr('ao' || s.seq || ':' || a.k) as ho,
           pg_temp.hr('as' || s.seq || ':' || a.k) as hs
      from _asg a
      join _s s on s.cls = a.cls
     where a.target_user is null
  ), reg1 as (
    select r.*,
           case when r.late then r.due_off - (1 + floor(r.ho * 3)::int)
                else r.due_off + 1 + floor(r.ho * 5)::int end as coff
      from reg0 r
  ), reg as (
    select r.assignment_id, r.user_id, r.seq,
           (case when r.wants and r.coff >= r.lastoff and r.coff >= 0 then 'completed' else 'not_started' end)::text as status,
           case when r.wants and r.coff >= r.lastoff and r.coff >= 0
                then pg_temp.ts(v_today - r.coff, 0.30 + r.ho * 0.50) end as completed_at,
           case when r.wants and r.coff >= r.lastoff and r.coff >= 0
                then round(pg_temp.clamp(r.ability + (r.hs - 0.5) * 0.30, 0.2, 1.0) * 10)::int end as qscore,
           case when r.wants and r.coff >= r.lastoff and r.coff >= 0 then 10 end as qtotal,
           case when r.wants and r.coff >= r.lastoff and r.coff >= 0
                then round(pg_temp.clamp(r.ability + (r.hs - 0.5) * 0.30, 0.2, 1.0) * 10)::int * 10 end as qpct,
           (r.late and r.wants and r.coff >= r.lastoff and r.coff >= 0) as late,
           'regular'::text as kind,
           (v_today - r.coff) as day
      from reg1 r
  ), tgt as (
    select a.id as assignment_id, s.user_id, s.seq, 'not_started'::text as status,
           null::timestamptz as completed_at, null::int as qscore, null::int as qtotal, null::int as qpct,
           false as late, 'regular'::text as kind, v_today as day
      from _asg a
      join _s s on s.user_id = a.target_user
     where a.target_user is not null
  )
  select * from cur
  union all select * from reg
  union all select * from tgt;

  -- ============================================================ Хурдан сорил (073)
  -- Анги бүр: хөтөлбөрийн эхний 5 хичээлийн жинхэнэ асуултаас 12.
  create temp table _cqq on commit drop as
  select x.cls, x.id, x.lesson_id, x.correct_answer, x.options, x.ord
    from (
      select c.cls, q.id, q.lesson_id, q.correct_answer, q.options,
             row_number() over (partition by c.cls order by md5(q.id::text || c.cls::text)) as ord
        from _cls c
        join _cl cl on cl.cls = c.cls and cl.k <= 5
        join _qq q on q.lesson_id = cl.lesson_id
    ) x
   where x.ord <= 12;

  create temp table _cqa on commit drop as
  select z.*,
         case when z.ok then z.correct_answer
              else coalesce((
                select o
                  from jsonb_array_elements_text(case when jsonb_typeof(z.options) = 'array' then z.options else '[]'::jsonb end) as o
                 where o <> z.correct_answer
                 order by md5(o || z.seq::text)
                 limit 1), 'Буруу сонголт')
         end as sel
    from (
      select s.seq, s.user_id, s.cls, q.id as qid, q.lesson_id, q.ord, q.correct_answer, q.options,
             (pg_temp.hr('cq' || s.seq || ':' || q.id) <
              pg_temp.clamp(
                s.ability
                - (pg_temp.hr('qd' || q.id) * 0.30 - 0.12)
                - (case when s.weak = 'exam' then 0.12 else 0.0 end)::float8,
                0.05, 0.97)) as ok
        from _s s
        join _cqq q on q.cls = s.cls
       where s.lastoff <= 9
         and pg_temp.hr('csat' || s.seq) < (case s.tier when 'struggling' then 0.75 when 'star' then 0.99 else 0.90 end)
    ) z;

  create temp table _cqs on commit drop as
  select pg_temp.did('2011', row_number() over (order by a.seq)) as id,
         a.seq, a.user_id, a.cls,
         pg_temp.ts(v_today - 9, 0.10) + make_interval(secs => 60 + floor(pg_temp.hr('cs' || a.seq) * 600)::int) as started_at,
         (420 + floor(pg_temp.hr('cd' || a.seq) * 420))::int as dur,
         jsonb_object_agg(a.qid::text, a.sel) as answers,
         (count(*) filter (where a.ok))::int as correct,
         count(*)::int as total
    from _cqa a
   group by a.seq, a.user_id, a.cls;

  -- ================================================================= БИЧЛЭГҮҮД
  -- 2.1 Байгууллага
  insert into public.organizations
    (id, name, organization_type, status, email, phone, address, notes, created_at, updated_at)
  values (
    v_org,
    'Өвөр Монголын Их Сургууль — Монгол оюутны хятад хэлний хөтөлбөр',
    'university',
    'active',
    'demo-hohhot@example.mn',
    '0471-000-0000',
    'Хөх хот, Өвөр Монгол',
    'ЖИШЭЭ ӨГӨГДӨЛ — системийн боломжийг харуулах зорилгоор үүсгэсэн (20 анги × 25 оюутан).',
    now() - interval '70 days',
    now()
  );

  -- 2.2 Багш нар (teacher_profiles + organization_members) ба эрхлэгч
  insert into public.teacher_profiles
    (user_id, display_name, organization, role, default_organization_id, created_at, updated_at)
  select c.teacher_id, c.teacher_name, 'Өвөр Монголын Их Сургууль', 'teacher', v_org,
         now() - interval '70 days', now()
    from _cls c;

  insert into public.organization_members
    (id, organization_id, user_id, email, display_name, role, status, permissions, joined_at, created_at, updated_at)
  select pg_temp.did('2006', c.cls), v_org, c.teacher_id, 'bagsh' || c.cls || '@example.mn', c.teacher_name,
         'teacher', 'active', '{}'::jsonb, now() - interval '69 days', now() - interval '69 days', now()
    from _cls c
  union all
  select pg_temp.did('2006', 21), v_org, pg_temp.did('2002', 21), 'zahiral@example.mn',
         'Д. Гантулга (тэнхимийн эрхлэгч)',
         'owner', 'active', '{}'::jsonb, now() - interval '70 days', now() - interval '70 days', now();

  -- 2.3 Ангиуд (join_code тогтмол — 054/064/066 баганууд)
  insert into public.classrooms
    (id, teacher_user_id, name, level, description, status, organization_id, created_by,
     delivery_mode, schedule_note, course_id, join_code, curriculum_course_id, created_at, updated_at)
  select c.class_id, c.teacher_id, c.class_name,
         case c.course_id when 'fazhan-chuji1' then 'Анхан шат I'
                          when 'fazhan-chuji2' then 'Анхан шат II'
                          else 'Дунд шат I' end,
         'Хятад хэлний хөтөлбөр — ' || c.cls || '-р анги (' ||
           case c.course_id when 'fazhan-chuji1' then '《发展汉语·初级综合(Ⅰ)》'
                            when 'fazhan-chuji2' then '《发展汉语·初级综合(Ⅱ)》'
                            else '《发展汉语·中级综合(Ⅰ)》' end || ')',
         'active', v_org, c.teacher_id,
         c.delivery_mode,
         case when c.cls % 2 = 1 then 'Даваа, Лхагва, Баасан 08:00–11:25 (Хөх хотын кампус)'
              else 'Даваа, Лхагва, Баасан 14:00–17:25 (Хөх хотын кампус)' end,
         c.course_id, c.join_code, c.course_id,
         now() - interval '68 days', now()
    from _cls c;

  -- 2.4 Ангийн чат өрөө (074 триггерийг орлоно; owner NULL — FK-тэй тул)
  insert into public.chat_rooms
    (id, kind, title, owner_user_id, classroom_id, is_open, is_closed, language, created_at)
  select pg_temp.did('2022', c.cls), 'class', left(c.class_name, 80), null, c.class_id, false, false, 'zh',
         now() - interval '68 days'
    from _cls c
  on conflict do nothing;

  -- 2.5 Оюутнууд
  insert into public.classroom_students
    (id, classroom_id, student_user_id, display_name, email, status, joined_at, created_at, updated_at)
  select s.row_id, s.class_id, s.user_id, s.full_name, s.email, 'active',
         pg_temp.ts(v_today - 65, 0.30), pg_temp.ts(v_today - 65, 0.30), now()
    from _s s;

  insert into public.student_profiles
    (user_id, display_name, school_name, grade_level, created_at, updated_at)
  select s.user_id, s.full_name, 'Өвөр Монголын Их Сургууль', '1-р курс',
         pg_temp.ts(v_today - 65, 0.30), now()
    from _s s;

  -- 2.6 Даалгавар: хөтөлбөр (066) + энгийн + нэг сул оюутанд зориулсан
  insert into public.assignments
    (id, classroom_id, lesson_id, assignment_type, title, instructions, due_date, status,
     organization_id, created_by, is_curriculum, order_index, course_id, target_student_user_id,
     created_at, updated_at)
  select pg_temp.did('2007', cl.cls * 100 + cl.k), c.class_id, cl.lesson_id, 'full_lesson', cl.title,
         null::text, null::date, 'assigned', v_org, c.teacher_id, true, cl.k - 1, c.course_id, null::uuid,
         pg_temp.ts(v_today - 66, 0.30), pg_temp.ts(v_today - 66, 0.30)
    from _cl cl
    join _cls c on c.cls = cl.cls
  union all
  select a.id, c.class_id, a.lesson_id, a.atype, a.title,
         'Дасгалыг хугацаандаа гүйцэтгэнэ үү.', v_today - a.due_off, 'assigned', v_org, c.teacher_id,
         false, null::int, null::text, a.target_user,
         pg_temp.ts(v_today - (a.due_off + 8), 0.30), pg_temp.ts(v_today - (a.due_off + 8), 0.30)
    from _asg a
    join _cls c on c.cls = a.cls;

  insert into public.assignment_results
    (id, assignment_id, student_user_id, status, completed_at, quiz_score, quiz_total, quiz_percentage,
     metadata, created_at, updated_at)
  select pg_temp.did('2008', row_number() over (order by r.assignment_id, r.seq)),
         r.assignment_id, r.user_id, r.status, r.completed_at, r.qscore, r.qtotal, r.qpct,
         case when r.late then '{"late": true}'::jsonb else '{}'::jsonb end,
         coalesce(r.completed_at - interval '2 hours', now() - interval '20 days'),
         coalesce(r.completed_at, now() - interval '20 days')
    from _ar r;

  -- 2.7 Хичээлийн ахиц (041: completed_stages)
  insert into public.user_lesson_progress
    (id, user_id, lesson_id, status, progress_percent, completed_at, updated_at, completed_stages)
  select pg_temp.did('2015', row_number() over (order by x.seq, x.lesson_id)),
         x.user_id, x.lesson_id, x.status, x.pct, x.completed_at, x.updated_at, x.stages
    from (
      select d.seq, d.user_id, d.lesson_id, 'completed'::text as status, 100 as pct,
             d.ts as completed_at, d.ts as updated_at,
             '["goal_warmup","vocabulary","text","grammar","practice","quiz","summary"]'::jsonb as stages
        from _done d
      union all
      select c.seq, c.user_id, c.lesson_id, 'in_progress', c.pct, null::timestamptz,
             pg_temp.ts(v_today - c.ago, 0.50),
             case when c.pct < 30 then '["goal_warmup","vocabulary"]'::jsonb
                  when c.pct < 55 then '["goal_warmup","vocabulary","text"]'::jsonb
                  when c.pct < 75 then '["goal_warmup","vocabulary","text","grammar"]'::jsonb
                  else '["goal_warmup","vocabulary","text","grammar","practice"]'::jsonb end
        from _curp c
    ) x;

  -- 2.8 Хичээлийн quiz оролдлого
  insert into public.user_quiz_attempts
    (id, user_id, lesson_id, score, total, percentage, answers, created_at)
  select pg_temp.did('2014', row_number() over (order by q.seq, q.lesson_id, q.att)),
         q.user_id, q.lesson_id, q.score, q.total, q.percentage, '[]'::jsonb, q.created_at
    from _qa q;

  -- 2.9 Асуулт тус бүрийн хариулт (045/046)
  insert into public.question_attempts
    (id, user_id, lesson_id, stage, question_id, question_type, is_correct,
     selected_answer, correct_answer, created_at, attempt_number, time_spent_ms, source)
  select pg_temp.did('2016', row_number() over (order by r.seq, r.lesson_id, r.stage, r.n)),
         r.user_id, r.lesson_id, r.stage,
         case r.stage
           when 'quiz' then 'quiz:db:' || r.qid
           when 'grammar' then 'grammar:' || r.lesson_id || ':' || (1 + ((r.n + r.seq) % 6))
           else 'word:' || r.lesson_id || ':' || (1 + ((r.n * 3 + r.seq) % 10))
         end,
         'choice', r.ok,
         case when r.ok then coalesce(r.correct_answer, 'Зөв хариулт')
              when r.stage = 'quiz' then coalesce((
                select o
                  from jsonb_array_elements_text(case when jsonb_typeof(r.options) = 'array' then r.options else '[]'::jsonb end) as o
                 where o <> r.correct_answer
                 order by md5(o || r.seq::text)
                 limit 1), 'Буруу сонголт')
              else 'Буруу сонголт'
         end,
         case when r.stage = 'quiz' then r.correct_answer else 'Зөв хариулт' end,
         pg_temp.ts(v_today - r.qago, r.qfrac),
         1, 2500 + floor(r.qfrac * 14000)::int, null::text
    from _qrows r;

  -- 2.10 Идэвхийн хугацаа (050)
  insert into public.user_activity_sessions
    (id, user_id, surface, ref_id, seconds, day, created_at, updated_at)
  select pg_temp.did('2017', row_number() over (order by se.seq, se.day, se.surface)),
         se.user_id, se.surface, se.ref_id, se.seconds, se.day,
         pg_temp.ts(se.day, 0.90), pg_temp.ts(se.day, 0.95)
    from _sess se;

  -- 2.11 Өдрийн идэвх (009) — session, дууссан хичээл, quiz-ээс гарган нэгтгэнэ
  insert into public.user_daily_activity
    (id, user_id, activity_date, activity_type, count, metadata, created_at, updated_at)
  select pg_temp.did('2018', row_number() over (order by g.user_id, g.activity_date, g.activity_type)),
         g.user_id, g.activity_date, g.activity_type, g.cnt, '{}'::jsonb,
         pg_temp.ts(g.activity_date, 0.50), pg_temp.ts(g.activity_date, 0.55)
    from (
      select u.user_id, u.activity_date, u.activity_type, sum(u.cnt)::int as cnt
        from (
          select se.user_id, se.day as activity_date, 'lesson_started'::text as activity_type, 1 as cnt
            from _sess se where se.surface = 'lesson'
          union all
          select se.user_id, se.day, 'review_opened', 1
            from _sess se where se.surface = 'review'
          union all
          select se.user_id, se.day, 'vocabulary_learned', 3 + floor(pg_temp.hr('vl' || se.seq || ':' || se.ago) * 12)::int
            from _sess se where se.surface = 'lesson' and pg_temp.hr('vlx' || se.seq || ':' || se.ago) < 0.55
          union all
          select d.user_id, d.day, 'lesson_completed', 1 from _done d
          union all
          select q.user_id, q.day, 'quiz_completed', 1 from _qa q
        ) u
       group by u.user_id, u.activity_date, u.activity_type
    ) g;

  -- 2.12 Streak (009)
  insert into public.user_streaks
    (user_id, current_streak, longest_streak, last_active_date, updated_at)
  select s.user_id,
         coalesce(max(i.len) filter (where i.e >= v_today - 1), 0)::int,
         max(i.len)::int,
         max(i.e),
         pg_temp.ts(max(i.e), 0.90)
    from _s s
    join (
      select x.seq, x.grp, max(x.len) as len, max(x.day) as e
        from _actx x
       group by x.seq, x.grp
    ) i on i.seq = s.seq
   group by s.user_id;

  -- 2.13 Тоглоомын үр дүн (050)
  insert into public.user_game_results
    (id, user_id, game_type, lesson_id, score, correct, total, accuracy, played_at, created_at)
  select g.id, g.user_id, g.game_type, '', g.score, g.correct, 10, g.accuracy, g.played_at, g.played_at
    from _game g;

  -- 2.14 Видео үзсэн ахиц (038)
  insert into public.user_video_progress
    (id, user_id, video_id, watched_sec, completed, last_watched_at)
  select pg_temp.did('2020', row_number() over (order by z.seq, z.k)),
         z.user_id, z.vid, round((z.dur * z.frac)::numeric, 1), z.frac >= 0.92, z.lw
    from (
      select s.seq, s.user_id, g.k, v.id as vid, v.dur,
             pg_temp.clamp(pg_temp.hr('vf' || s.seq || ':' || g.k) * 0.6 + s.ability * 0.5, 0.05, 1.0) as frac,
             pg_temp.ts(v_today - (s.lastoff + floor(pg_temp.hr('vl' || s.seq || ':' || g.k) * 45)::int),
                        pg_temp.hr('vlt' || s.seq || ':' || g.k)) as lw
        from _s s
        cross join generate_series(1, 4) as g(k)
        join _vid v on v.rn = 1 + ((s.seq * g.k * 7 + g.k) % greatest(v_nv, 1))
       where g.k <= floor(s.act * 5)::int
    ) z
  on conflict (user_id, video_id) do nothing;

  -- 2.15 Ирц (057): долоо хоногт 3 хичээл (Да/Лх/Ба) × сүүлийн 8 долоо хоног
  insert into public.classroom_attendance
    (id, classroom_id, student_id, session_date, status, note, recorded_by, created_at, updated_at)
  select pg_temp.did('2012', row_number() over (order by z.seq, z.day)),
         z.class_id, z.row_id, z.day,
         case
           when z.lastoff > 0 and (v_today - z.day) < z.lastoff then (case when z.r < 0.90 then 'absent' else 'present' end)
           when z.r < 0.02 then 'excused'
           when z.r < 0.02 + z.absr then 'absent'
           when z.r < 0.02 + z.absr + z.latr then 'late'
           else 'present'
         end,
         null::text, z.teacher_id,
         pg_temp.ts(z.day, 0.40), pg_temp.ts(z.day, 0.40)
    from (
      select s.seq, s.row_id, s.class_id, c.teacher_id, s.lastoff, d.day,
             pg_temp.hr('at' || s.seq || ':' || d.day) as r,
             ((0.03 + (1 - c.skill) * 0.10)
               * (case s.tier when 'star' then 0.3 when 'struggling' then 2.0 else 1.0 end))::float8 as absr,
             (0.05 + (1 - s.ability) * 0.05)::float8 as latr
        from _s s
        join _cls c on c.cls = s.cls
        cross join lateral (
          select dd::date as day
            from generate_series((v_today - 56)::timestamp, (v_today - 1)::timestamp, interval '1 day') as dd
           where extract(isodow from dd) in (1, 3, 5)
        ) d
    ) z;

  -- 2.16 Ангийн шалгалт (059): анги бүр өнгөрсөн (хаасан) 1 + сондгой ангид удахгүй болох 1
  insert into public.classroom_exams
    (id, classroom_id, test_id, title, scheduled_for, due_date, status, created_by, created_at, updated_at)
  select pg_temp.did('2009', x.cls * 10 + 1), c.class_id, x.past_test,
         'Улирлын дунд шалгалт · HSK' || x.hsk_level || ' загвар',
         v_today - 18, v_today - 17, 'closed', c.teacher_id,
         pg_temp.ts(v_today - 28, 0.40), pg_temp.ts(v_today - 17, 0.40)
    from _cex x
    join _cls c on c.cls = x.cls
   where x.past_test is not null
  union all
  select pg_temp.did('2009', x.cls * 10 + 2), c.class_id, x.next_test,
         'Улирлын төгсгөлийн шалгалт · HSK' || x.hsk_level || ' загвар',
         v_today + 9, v_today + 10, 'scheduled', c.teacher_id,
         pg_temp.ts(v_today - 3, 0.40), pg_temp.ts(v_today - 3, 0.40)
    from _cex x
    join _cls c on c.cls = x.cls
   where x.next_test is not null
     and x.cls % 2 = 1;  -- удахгүй болох шалгалт сондгой ангид л (самбарын «сүүлийн шалгалт» нь өнгөрсөн шалгалт хэвээр үлдэж, тэнцээгүй оюутнууд харагдана)

  -- Өнгөрсөн шалгалтыг өгсөн оюутнуудын дүн (042: score_metadata)
  insert into public.user_test_attempts
    (id, user_id, test_id, mode, started_at, finished_at, raw_score, max_score,
     assigned_level, confidence, status, score_metadata)
  select e.id, e.user_id, e.test_id, 'exam',
         e.finished_at - interval '100 minutes', e.finished_at,
         e.total, 300, e.hsk_level, null, 'completed',
         jsonb_build_object(
           'hsk_total', e.total,
           'hsk_max', 300,
           'pass_threshold', 180,
           'passed', e.total >= 180,
           'section_scores', jsonb_build_object('listening', e.l, 'reading', e.r, 'writing', e.w),
           'writing_graded', true,
           'writing_self_grades', '{}'::jsonb
         )
    from _ea e;

  -- 2.17 Хурдан сорил (073): анги бүр 1 хаагдсан сорил
  insert into public.class_quizzes
    (id, classroom_id, teacher_user_id, title, question_ids, lesson_ids, duration_minutes,
     opens_at, closes_at, status, share_results, created_at)
  select pg_temp.did('2010', q.cls), c.class_id, c.teacher_id,
         c.cls || '-р анги · Хурдан сорил #1',
         q.qids, q.lids, 15,
         pg_temp.ts(v_today - 9, 0.10), pg_temp.ts(v_today - 8, 0.10),
         'closed', true, pg_temp.ts(v_today - 10, 0.50)
    from (
      select x.cls, array_agg(x.id order by x.ord) as qids, array_agg(distinct x.lesson_id) as lids
        from _cqq x
       group by x.cls
    ) q
    join _cls c on c.cls = q.cls;

  insert into public.class_quiz_attempts
    (id, quiz_id, student_user_id, started_at, submitted_at, answers, correct, total, score_pct, duration_sec)
  select s.id, pg_temp.did('2010', s.cls), s.user_id, s.started_at,
         s.started_at + make_interval(secs => s.dur), s.answers, s.correct, s.total,
         round(100.0 * s.correct / s.total, 1), s.dur
    from _cqs s;

  -- Хурдан сорилын асуулт тус бүрийн хариулт (source = 'class_quiz')
  insert into public.question_attempts
    (id, user_id, lesson_id, stage, question_id, question_type, is_correct,
     selected_answer, correct_answer, created_at, attempt_number, time_spent_ms, source)
  select pg_temp.did('2016', 1000000 + row_number() over (order by a.seq, a.ord)),
         a.user_id, a.lesson_id, 'quiz', 'quiz:db:' || a.qid, 'choice', a.ok,
         a.sel, a.correct_answer,
         s.started_at + make_interval(secs => a.ord * 25),
         1, 15000, 'class_quiz'
    from _cqa a
    join _cqs s on s.seq = a.seq;

  -- ===================================================== ОНОО (071: ledger)
  -- user_points_daily / user_points_totals-ийг ledger-ээс доор нэгтгэнэ
  -- (replica горимд 071-ийн триггер ажиллахгүй тул).
  create temp table _led on commit drop as
  select u.user_id, u.points, u.source, u.ref_id, u.day, u.created_at
    from (
      select d.user_id, 50 as points, 'lesson_complete'::text as source, d.lesson_id as ref_id,
             d.day as day, d.ts as created_at
        from _done d
      union all
      select d.user_id, 5, 'quiz_correct', d.lesson_id || ':demo' || g.k, d.day, d.ts - interval '20 minutes'
        from _done d
        join _s s on s.seq = d.seq
        cross join lateral generate_series(1,
          round(pg_temp.clamp(s.ability + (pg_temp.hr('qc' || d.seq || ':' || d.lesson_id) - 0.5) * 0.3, 0.0, 1.0) * 5)::int) as g(k)
      union all
      select se.user_id, least(30, 2 * (se.seconds / 60)), 'video_minutes', se.ref_id || ':' || se.day,
             se.day, pg_temp.ts(se.day, 0.60)
        from _sess se
       where se.surface = 'video' and se.seconds >= 60
      union all
      select se.user_id, least(50, se.seconds / 15), 'srs_review', se.day::text, se.day, pg_temp.ts(se.day, 0.70)
        from _sess se
       where se.surface = 'review' and se.seconds >= 15
      union all
      select g.user_id, least(30, 10 + round(g.accuracy * 0.2)::int), 'game', 'g:' || g.id::text,
             g.day, g.played_at
        from _game g
      union all
      select e.user_id, least(200, 100 + round(e.total / 3.0)::int), 'exam', e.id::text,
             (v_today - 18), e.finished_at
        from _ea e
      union all
      select r.user_id, case when r.late then 10 else 30 end, 'assignment', r.assignment_id::text,
             r.day, r.completed_at
        from _ar r
       where r.kind = 'regular' and r.status = 'completed'
      union all
      select s.user_id, 10, 'streak_bonus', a.day::text, a.day, pg_temp.ts(a.day, 0.95)
        from _actx a
        join _s s on s.seq = a.seq
       where a.pos >= 3
    ) u;

  insert into public.user_points_ledger
    (id, user_id, points, source, ref_id, meta, day, created_at, updated_at)
  select pg_temp.did('2021', row_number() over (order by l.user_id, l.source, l.ref_id)),
         l.user_id, l.points, l.source, l.ref_id, '{"demo": true}'::jsonb, l.day, l.created_at, l.created_at
    from _led l;

  insert into public.user_points_daily (user_id, day, points)
  select l.user_id, l.day, sum(l.points)::int
    from public.user_points_ledger l
   where l.user_id::text like (pfx || '2004%')
   group by l.user_id, l.day;

  insert into public.user_points_totals (user_id, total, last_7d, last_30d, by_source, updated_at)
  with src as (
    select l.user_id, l.source, sum(l.points)::int as sp
      from public.user_points_ledger l
     where l.user_id::text like (pfx || '2004%')
     group by l.user_id, l.source
  ), tot as (
    select s.user_id, sum(s.sp)::int as total, jsonb_object_agg(s.source, s.sp) as by_source
      from src s
     group by s.user_id
  ), wk as (
    select d.user_id,
           coalesce(sum(d.points) filter (where d.day >= v_today - 6), 0)::int as l7,
           coalesce(sum(d.points) filter (where d.day >= v_today - 29), 0)::int as l30
      from public.user_points_daily d
     where d.user_id::text like (pfx || '2004%')
     group by d.user_id
  )
  select t.user_id, t.total, coalesce(w.l7, 0), coalesce(w.l30, 0), t.by_source, now()
    from tot t
    left join wk w on w.user_id = t.user_id;

  -- ============================================================ Дуусгавар
  perform set_config('session_replication_role', 'origin', true);

  execute 'drop function if exists pg_temp.hr(text)';
  execute 'drop function if exists pg_temp.did(text, bigint)';
  execute 'drop function if exists pg_temp.ts(date, float8)';
  execute 'drop function if exists pg_temp.clamp(float8, float8, float8)';

  select count(*) into v_n from public.classroom_students where student_user_id::text like (pfx || '2004%');
  raise notice 'Хөх хотын демо өгөгдөл үүслээ: 20 анги, % оюутан. Байгууллагын ID = %', v_n, v_org;
end $seed$;


-- =============================================================================
-- 3. ШАЛГАХ — үүссэн мөрийн тоо (нийт ~150–200 мянга байх ёстой)
-- =============================================================================
select husnegt, too from (
  select 1 as o, 'organizations' as husnegt, count(*) as too from public.organizations where id::text like 'd0000000-0000-4000-8000-2001%'
  union all select 2, 'organization_members (багш 20 + эрхлэгч 1)', count(*) from public.organization_members where organization_id::text like 'd0000000-0000-4000-8000-2001%'
  union all select 3, 'teacher_profiles', count(*) from public.teacher_profiles where user_id::text like 'd0000000-0000-4000-8000-2002%'
  union all select 4, 'classrooms', count(*) from public.classrooms where id::text like 'd0000000-0000-4000-8000-2003%'
  union all select 5, 'classroom_students', count(*) from public.classroom_students where student_user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 6, 'student_profiles', count(*) from public.student_profiles where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 7, 'chat_rooms (ангийн)', count(*) from public.chat_rooms where classroom_id::text like 'd0000000-0000-4000-8000-2003%'
  union all select 8, 'assignments', count(*) from public.assignments where id::text like 'd0000000-0000-4000-8000-2007%'
  union all select 9, 'assignment_results', count(*) from public.assignment_results where assignment_id::text like 'd0000000-0000-4000-8000-2007%'
  union all select 10, 'user_lesson_progress', count(*) from public.user_lesson_progress where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 11, 'user_quiz_attempts', count(*) from public.user_quiz_attempts where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 12, 'question_attempts', count(*) from public.question_attempts where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 13, 'user_activity_sessions', count(*) from public.user_activity_sessions where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 14, 'user_daily_activity', count(*) from public.user_daily_activity where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 15, 'user_streaks', count(*) from public.user_streaks where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 16, 'user_game_results', count(*) from public.user_game_results where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 17, 'user_video_progress', count(*) from public.user_video_progress where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 18, 'user_points_ledger', count(*) from public.user_points_ledger where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 19, 'user_points_daily', count(*) from public.user_points_daily where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 20, 'user_points_totals', count(*) from public.user_points_totals where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 21, 'classroom_attendance', count(*) from public.classroom_attendance where classroom_id::text like 'd0000000-0000-4000-8000-2003%'
  union all select 22, 'classroom_exams', count(*) from public.classroom_exams where classroom_id::text like 'd0000000-0000-4000-8000-2003%'
  union all select 23, 'user_test_attempts (шалгалт)', count(*) from public.user_test_attempts where user_id::text like 'd0000000-0000-4000-8000-2004%'
  union all select 24, 'class_quizzes', count(*) from public.class_quizzes where classroom_id::text like 'd0000000-0000-4000-8000-2003%'
  union all select 25, 'class_quiz_attempts', count(*) from public.class_quiz_attempts where student_user_id::text like 'd0000000-0000-4000-8000-2004%'
) x
order by o;
