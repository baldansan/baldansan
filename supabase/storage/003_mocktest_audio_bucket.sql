-- Mock test listening audio (full exam MP3, up to ~60MB)
-- Importer: scripts/load_mocktest.mjs

insert into storage.buckets (id, name, public)
values ('mocktest-audio', 'mocktest-audio', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "mocktest_audio_public_select" on storage.objects;
create policy "mocktest_audio_public_select"
  on storage.objects
  for select
  to public
  using (bucket_id = 'mocktest-audio');

-- Service role importer uploads via service key (bypasses RLS).
-- Optional admin upload via Dashboard if needed later.
