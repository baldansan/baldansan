-- 083: is_admin() — security definer болгов.
-- Storage (storage.objects) RLS бодлогод public.is_admin() дуудагдахад admin_profiles-ийн RLS
-- давхар шүүж false буцаадаг байсан (真题 импорт: "new row violates row-level security policy").
-- Security definer + тогтсон search_path: зөвхөн boolean буцаадаг тул аюулгүй.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Хэрэв Storage дээр бодлого өмнө нь үүсээгүй бол дахин баталгаажуулна (080-тай ижил).
drop policy if exists "test_assets_admin_insert" on storage.objects;
create policy "test_assets_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'test-assets' and public.is_admin());
drop policy if exists "test_assets_admin_update" on storage.objects;
create policy "test_assets_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'test-assets' and public.is_admin())
  with check (bucket_id = 'test-assets' and public.is_admin());
drop policy if exists "test_assets_admin_delete" on storage.objects;
create policy "test_assets_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'test-assets' and public.is_admin());
