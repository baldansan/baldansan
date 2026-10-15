-- Хөх хотын сургуулийн систем + оноо/rank + чат + жишээ 500 оюутан
-- 071 (оноо, rank, нийтийн профайл) → 072 (захирал сурагчдын өгөгдөл уншина)
-- → 073 (хурдан сорил, дүнгийн record) → 074 (чат, баг, өрөө) → seed (500 жишээ оюутан).
-- Supabase SQL editor дээр энэ 1 файлыг л Run. Дахин ажиллуулахад аюулгүй
-- (seed нь хуучин жишээгээ цэвэрлээд дахин үүсгэнэ).
create extension if not exists http with schema extensions;
do $$
declare
  base text := 'https://raw.githubusercontent.com/baldansan/baldansan/main/supabase/';
  f text; s text; st int;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '180000');
  foreach f in array array[
    'migrations/071_points_rank.sql',
    'migrations/072_org_manager_reads_learner_data.sql',
    'migrations/073_class_quick_quiz_records.sql',
    'migrations/074_chat_social.sql',
    'demo/seed-hohhot-500.sql']
  loop
    select status, content into st, s from extensions.http_get(base || f);
    if st <> 200 then raise exception 'GitHub % -> HTTP %', f, st; end if;
    s := regexp_replace(s, '^\s*(begin|commit)\s*;\s*$', '', 'gmi');
    execute s;
    raise notice 'OK %', f;
  end loop;
end $$;
select
  (select to_regclass('public.user_points_ledger') is not null) as points_ready,
  (select to_regclass('public.class_quizzes') is not null) as quiz_ready,
  (select to_regclass('public.chat_rooms') is not null) as chat_ready,
  (select count(*) from public.classroom_students
    where student_user_id::text like 'd0000000-0000-4000-8000-2004%') as demo_students,
  (select count(*) from public.classrooms
    where organization_id = 'd0000000-0000-4000-8000-200100000001') as demo_classes;
