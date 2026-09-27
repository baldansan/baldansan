-- Дуу (karaoke): 068 (videos.artist / year / kind + video_series.kind)
-- Supabase SQL editor дээр энэ 1 файлыг л Run. Дахин ажиллуулахад аюулгүй.
-- Шаардлага: 030, 031, 044 (videos / video_series / subtitle_offset_sec) урьд нь ажилласан байх.
create extension if not exists http with schema extensions;
do $$
declare
  base text := 'https://raw.githubusercontent.com/baldansan/baldansan/main/supabase/migrations/';
  f text; s text; st int;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '120000');
  foreach f in array array[
    '068_videos_song_meta.sql']
  loop
    select status, content into st, s from extensions.http_get(base || f);
    if st <> 200 then raise exception 'GitHub % -> HTTP %', f, st; end if;
    s := regexp_replace(s, '^\s*(begin|commit)\s*;\s*$', '', 'gmi');
    execute s;
    raise notice 'OK %', f;
  end loop;
end $$;
select
  (select exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'videos' and column_name = 'kind')) as videos_kind_ready,
  (select exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'videos' and column_name = 'artist')) as videos_artist_ready,
  (select exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'videos' and column_name = 'year')) as videos_year_ready,
  (select exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'video_series' and column_name = 'kind')) as series_kind_ready;
