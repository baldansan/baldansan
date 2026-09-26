-- Сургуулийн систем: 064 (ангийн код) → 065 (хүүхдийн профайл) → 066 (заавал хөтөлбөр)
-- Supabase SQL editor дээр энэ 1 файлыг л Run. Дахин ажиллуулахад аюулгүй.
create extension if not exists http with schema extensions;
do $$
declare
  base text := 'https://raw.githubusercontent.com/baldansan/baldansan/main/supabase/migrations/';
  f text; s text; st int;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '120000');
  foreach f in array array[
    '064_classroom_join_code.sql',
    '065_kid_profiles.sql',
    '066_classroom_curriculum.sql']
  loop
    select status, content into st, s from extensions.http_get(base || f);
    if st <> 200 then raise exception 'GitHub % -> HTTP %', f, st; end if;
    s := regexp_replace(s, '^\s*(begin|commit)\s*;\s*$', '', 'gmi');
    execute s;
    raise notice 'OK %', f;
  end loop;
end $$;
select
  (select count(*) from public.classrooms where join_code is not null) as classes_with_code,
  (select to_regclass('public.kid_profiles') is not null) as kid_profiles_ready,
  (select exists (select 1 from information_schema.columns where table_name='assignments' and column_name='is_curriculum')) as curriculum_ready;
