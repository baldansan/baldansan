-- Бичих дэвтэр (写字本): 067 (writing_lists / writing_list_items / writing_progress + RPC)
-- Supabase SQL editor дээр энэ 1 файлыг л Run. Дахин ажиллуулахад аюулгүй.
-- Шаардлага: 011, 013, 065 (is_guardian_of) урьд нь ажилласан байх.
create extension if not exists http with schema extensions;
do $$
declare
  base text := 'https://raw.githubusercontent.com/baldansan/baldansan/main/supabase/migrations/';
  f text; s text; st int;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '120000');
  foreach f in array array[
    '067_writing_lists.sql']
  loop
    select status, content into st, s from extensions.http_get(base || f);
    if st <> 200 then raise exception 'GitHub % -> HTTP %', f, st; end if;
    s := regexp_replace(s, '^\s*(begin|commit)\s*;\s*$', '', 'gmi');
    execute s;
    raise notice 'OK %', f;
  end loop;
end $$;
select
  (select to_regclass('public.writing_lists') is not null) as writing_lists_ready,
  (select to_regclass('public.writing_list_items') is not null) as writing_items_ready,
  (select to_regclass('public.writing_progress') is not null) as writing_progress_ready,
  (select exists (select 1 from pg_proc where proname = 'writing_list_progress')) as writing_rpc_ready;
