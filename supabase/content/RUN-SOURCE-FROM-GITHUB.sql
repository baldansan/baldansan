-- Эх сурвалжийн санг GitHub-аас шууд татаж ажиллуулна (Supabase SQL editor дээр энэ 1 файлыг л Run).
-- Дараалал: 062 (хүснэгт) → 006 hsk3 → 007 hsk1 → 008 hsk2 → 009 hsk4 → 010 hsk5 → 011 hsk6. Дахин ажиллуулахад аюулгүй (upsert).
create extension if not exists http with schema extensions;
do $$
declare
  base text := 'https://raw.githubusercontent.com/baldansan/baldansan/main/supabase/';
  f text; s text; st int;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '120000');
  foreach f in array array[
    'migrations/062_hsk_source_lessons.sql',
    'migrations/063_hsk_source_lessons_public_read.sql',
    'content/006_hsk3_source_lessons.sql',
    'content/007_hsk1_source_lessons.sql',
    'content/008_hsk2_source_lessons.sql',
    'content/009_hsk4_source_lessons.sql',
    'content/010_hsk5_source_lessons.sql',
    'content/011_hsk6_source_lessons.sql']
  loop
    select status, content into st, s from extensions.http_get(base || f);
    if st <> 200 then raise exception 'GitHub % -> HTTP %', f, st; end if;
    -- DO блок дотор begin/commit хэрэггүй
    s := regexp_replace(s, '^\s*(begin|commit)\s*;\s*$', '', 'gmi');
    execute s;
    raise notice 'OK %', f;
  end loop;
end $$;
select level, count(*) as lessons,
       count(*) filter (where payload ? 'hsk30') as hsk30,
       sum((select count(*) from jsonb_path_query(payload,'$.workbook.sections[*].items[*].answer'))) as wb_answers
from public.hsk_source_lessons group by 1 order by 1;
