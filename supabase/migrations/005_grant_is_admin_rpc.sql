-- Allow authenticated users to call is_admin() from the app server (admin gate).

grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is
  'True when auth.uid() has admin or owner role in admin_profiles. Callable from app server.';
