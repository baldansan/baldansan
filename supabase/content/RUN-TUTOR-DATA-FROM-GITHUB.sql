-- Хувийн багш (私教) өгөгдөл: 862 асуултын tutor_note-ыг бөглөнө.
-- Supabase SQL editor дээр энэ 1 файлыг л Run. Дахин ажиллуулахад аюулгүй.
-- Шаардлага: 069_mock_tutor_notes.sql (баганыг үүсгэсэн) урьд нь ажилласан байх.
create extension if not exists http with schema extensions;
do $$
declare
  base text := 'https://raw.githubusercontent.com/baldansan/baldansan/main/supabase/migrations/';
  f text; s text; st int;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '120000');
  foreach f in array array[
    '070_mock_tutor_notes_data_1.sql',
    '070_mock_tutor_notes_data_2.sql',
    '070_mock_tutor_notes_data_3.sql',
    '070_mock_tutor_notes_data_4.sql']
  loop
    select status, content into st, s from extensions.http_get(base || f);
    if st <> 200 then raise exception 'GitHub % -> HTTP %', f, st; end if;
    s := regexp_replace(s, '^\s*(begin|commit)\s*;\s*$', '', 'gmi');
    execute s;
    raise notice 'OK %', f;
  end loop;
end $$;
select
  count(*) as questions_with_tutor_note,
  count(*) filter (where tutor_note ? 'transcript') as with_transcript
from public.mock_test_questions
where tutor_note is not null;
