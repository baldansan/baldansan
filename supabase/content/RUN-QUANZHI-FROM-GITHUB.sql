-- 全职法师 S1 (Versatile Mage) — 12 анги + цуврал, хадмалтайгаа GitHub-аас татаж оруулна.
-- Supabase SQL editor дээр энэ 1 файлыг л Run. Дахин ажиллуулахад аюулгүй (upsert).
-- Мөн 039 (admin бичих RLS) бодлогыг дахин тавина — /admin/import/bichleg цаашид ажиллана.
create extension if not exists http with schema extensions;

drop policy if exists "video_series_admin_write" on public.video_series;
create policy "video_series_admin_write" on public.video_series for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "videos_admin_write" on public.videos;
create policy "videos_admin_write" on public.videos for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "video_subtitles_admin_write" on public.video_subtitles;
create policy "video_subtitles_admin_write" on public.video_subtitles for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

do $$
declare
  base text := 'https://raw.githubusercontent.com/baldansan/baldansan/main/supabase/content/videos/quanzhi-fashi/';
  f text; st int; body text; j jsonb; s jsonb; n int := 0;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '120000');

  -- Цуврал
  select status, content into st, body from extensions.http_get(base || 'series.json');
  if st <> 200 then raise exception 'GitHub series.json -> HTTP %', st; end if;
  j := body::jsonb;
  insert into public.video_series (id, title_zh, title_mn, description_mn, hsk_level)
  values (j->>'id', j->>'title_zh', j->>'title_mn', j->>'description_mn', (j->>'hsk_level')::int)
  on conflict (id) do update set title_zh = excluded.title_zh, title_mn = excluded.title_mn,
    description_mn = excluded.description_mn, hsk_level = excluded.hsk_level;

  -- 12 анги
  foreach f in array array[
    'quanzhi-s1-ep01.json','quanzhi-s1-ep02.json','quanzhi-s1-ep03.json','quanzhi-s1-ep04.json',
    'quanzhi-s1-ep05.json','quanzhi-s1-ep06.json','quanzhi-s1-ep07.json','quanzhi-s1-ep08.json',
    'quanzhi-s1-ep09.json','quanzhi-s1-ep10.json','quanzhi-s1-ep11.json','quanzhi-s1-ep12.json']
  loop
    select status, content into st, body from extensions.http_get(base || f);
    if st <> 200 then raise exception 'GitHub % -> HTTP %', f, st; end if;
    j := body::jsonb;

    insert into public.videos (id, youtube_id, title_zh, title_mn, source, source_url, hsk_level,
      duration_sec, sync_offset_sec, subtitle_offset_sec, tags, series_id, episode_no)
    values (j->>'video_id', j->>'youtube_id', j->>'title_zh', j->>'title_mn', j->>'source', j->>'source_url',
      (j->>'hsk_level')::int, (j->>'duration_sec')::numeric, 0, coalesce((j->>'subtitle_offset_sec')::numeric, 0),
      coalesce((select array_agg(x) from jsonb_array_elements_text(j->'tags') x), '{}'),
      j->>'series_id', (j->>'episode_no')::int)
    on conflict (id) do update set youtube_id = excluded.youtube_id, title_zh = excluded.title_zh,
      title_mn = excluded.title_mn, source = excluded.source, source_url = excluded.source_url,
      hsk_level = excluded.hsk_level, duration_sec = excluded.duration_sec,
      subtitle_offset_sec = excluded.subtitle_offset_sec, tags = excluded.tags,
      series_id = excluded.series_id, episode_no = excluded.episode_no;

    delete from public.video_subtitles where video_id = j->>'video_id';
    for s in select * from jsonb_array_elements(j->'subtitles') loop
      insert into public.video_subtitles (video_id, idx, start_sec, end_sec, speaker, zh, pinyin, mn, words, slang_note)
      values (j->>'video_id', (s->>'index')::int, (s->>'start')::numeric, (s->>'end')::numeric,
        nullif(s->>'speaker',''), s->>'zh', s->>'pinyin', s->>'mn', s->'words', s->'slang_note');
      n := n + 1;
    end loop;
    raise notice 'OK % (% мөр)', f, jsonb_array_length(j->'subtitles');
  end loop;
  raise notice 'Нийт хадмал мөр: %', n;
end $$;

select
  (select count(*) from public.videos where series_id = 'quanzhi-fashi') as episodes,
  (select count(*) from public.video_subtitles vs join public.videos v on v.id = vs.video_id
     where v.series_id = 'quanzhi-fashi') as subtitle_lines;
