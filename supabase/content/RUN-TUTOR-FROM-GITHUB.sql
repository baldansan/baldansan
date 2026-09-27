-- Хувийн багш (私教): 069 (mock_test_questions.tutor_note jsonb)
-- Supabase SQL editor дээр энэ 1 файлыг л Run. Дахин ажиллуулахад аюулгүй.
-- Шаардлага: 028/029 (mock_test_questions) урьд нь ажилласан байх.
create extension if not exists http with schema extensions;
do $$
declare
  base text := 'https://raw.githubusercontent.com/baldansan/baldansan/main/supabase/migrations/';
  f text; s text; st int;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '120000');
  foreach f in array array[
    '069_mock_tutor_notes.sql']
  loop
    select status, content into st, s from extensions.http_get(base || f);
    if st <> 200 then raise exception 'GitHub % -> HTTP %', f, st; end if;
    s := regexp_replace(s, '^\s*(begin|commit)\s*;\s*$', '', 'gmi');
    execute s;
    raise notice 'OK %', f;
  end loop;
end $$;
select
  (select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'mock_test_questions'
      and column_name = 'tutor_note'
  )) as tutor_note_column_ready,
  (select count(*) from public.mock_test_questions where tutor_note is not null) as questions_with_tutor_note;
