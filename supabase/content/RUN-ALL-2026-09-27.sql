-- 2026-09-27: Сургуулийн систем (064–066, хэрэв өмнө нь ажиллуулаагүй бол) + Бичих дэвтэр (067) + HSK 3.0 үгийн засвар (839 шинэ үг, 232 пиньинь) + HSK1–3 байгалийн орчуулга (408)
-- Supabase SQL editor дээр энэ 1 файлыг л Run. Дахин ажиллуулахад аюулгүй.
create extension if not exists http with schema extensions;
do $$
declare
  base text := 'https://raw.githubusercontent.com/baldansan/baldansan/main/supabase/';
  f text; s text; st int;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '180000');
  foreach f in array array[
    'migrations/064_classroom_join_code.sql',
    'migrations/065_kid_profiles.sql',
    'migrations/066_classroom_curriculum.sql',
    'migrations/067_writing_lists.sql',
    'content/hsk_words_2025_patch.sql',
    'content/hsk_words_mn_natural_hsk1-3.sql']
  loop
    select status, content into st, s from extensions.http_get(base || f);
    if st <> 200 then raise exception 'GitHub % -> HTTP %', f, st; end if;
    s := regexp_replace(s, '^\s*(begin|commit)\s*;\s*$', '', 'gmi');
    execute s;
    raise notice 'OK %', f;
  end loop;
end $$;
select
  (select to_regclass('public.writing_lists') is not null) as writing_ready,
  (select count(*) from public.hsk_words) as hsk_words_total,
  (select count(*) from public.hsk_words where simplified in ('没事','扫码','网购')) as new_words_found,
  (select pinyin from public.hsk_words where simplified='时候' limit 1) as shihou_pinyin,
  (select example_mn from public.hsk_words where simplified='他' limit 1) as ta_example;
