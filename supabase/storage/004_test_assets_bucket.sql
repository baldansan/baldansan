-- Mock test assets: audio + question images
-- Importer: scripts/load_tests.mjs → bucket test-assets

insert into storage.buckets (id, name, public)
values ('test-assets', 'test-assets', true)
on conflict (id) do update
set name = excluded.name, public = excluded.public;

drop policy if exists "test_assets_public_select" on storage.objects;
create policy "test_assets_public_select"
  on storage.objects for select to public
  using (bucket_id = 'test-assets');
