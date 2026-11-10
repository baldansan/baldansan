-- 083: test-assets Storage бодлогыг дахин үүсгэнэ (080-ийн storage хэсэг бүрэн ороогүй байж магадгүй).
-- DB-д is_admin(check_user_id uuid default auth.uid()) ганц хувилбар, security definer — зөв.
drop policy if exists "test_assets_admin_insert" on storage.objects;
create policy "test_assets_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'test-assets' and public.is_admin(auth.uid()));

drop policy if exists "test_assets_admin_update" on storage.objects;
create policy "test_assets_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'test-assets' and public.is_admin(auth.uid()))
  with check (bucket_id = 'test-assets' and public.is_admin(auth.uid()));

drop policy if exists "test_assets_admin_delete" on storage.objects;
create policy "test_assets_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'test-assets' and public.is_admin(auth.uid()));

drop policy if exists "test_assets_public_select" on storage.objects;
create policy "test_assets_public_select"
  on storage.objects for select to public
  using (bucket_id = 'test-assets');

-- mock_tests / mock_test_questions / skill_tags админ бичих эрх (080-тай ижил, давтахад аюулгүй)
drop policy if exists "mock_tests_admin_write" on public.mock_tests;
create policy "mock_tests_admin_write" on public.mock_tests for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists "mock_test_questions_admin_write" on public.mock_test_questions;
create policy "mock_test_questions_admin_write" on public.mock_test_questions for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists "skill_tags_admin_write" on public.skill_tags;
create policy "skill_tags_admin_write" on public.skill_tags for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Шалгах: storage.objects дээрх бодлогууд + та админ мөн эсэх
select 'policy' as kind, policyname as name, cmd, roles::text as roles from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'test_assets%'
union all
select 'is_admin(auth.uid())', public.is_admin(auth.uid())::text, auth.uid()::text, null;
