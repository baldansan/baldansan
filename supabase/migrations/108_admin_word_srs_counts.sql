-- 108: Админы «Сурсан үг» тоолуур — тоглоом/давталтаар цээжилсэн үгийг (user_word_srs) хүн бүрээр нэгтгэж өгнө.
-- Өмнө нь админ хуудас зөвхөн хичээл доторх «сурсан» тэмдэглэгээг тоолдог байсан тул бараг бүгд 0 гарч байв.
-- Зөвхөн админ/эзэмшигч дуудаж чадна. Дахин ажиллуулахад аюулгүй.
create or replace function public.admin_word_srs_counts()
returns table (user_id uuid, total bigint, known bigint, last_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.user_id,
         count(*)::bigint as total,
         count(*) filter (where s.last_rating = 'known')::bigint as known,
         max(s.updated_at) as last_at
  from public.user_word_srs s
  where public.is_admin()
  group by s.user_id;
$$;

revoke all on function public.admin_word_srs_counts() from public, anon;
grant execute on function public.admin_word_srs_counts() to authenticated;
