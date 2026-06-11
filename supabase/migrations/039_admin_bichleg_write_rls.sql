-- Admin бичлэг импорт: Vercel дээр service_role байхгүй ч admin JWT-ээр бичих боломжтой.

drop policy if exists "video_series_admin_write" on public.video_series;
create policy "video_series_admin_write"
  on public.video_series for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "videos_admin_write" on public.videos;
create policy "videos_admin_write"
  on public.videos for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "video_subtitles_admin_write" on public.video_subtitles;
create policy "video_subtitles_admin_write"
  on public.video_subtitles for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
