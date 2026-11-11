-- 090: Админд суралцагчдыг КОДоор биш НЭРЭЭР нь харуулах.
--
-- Өмнө нь нэр зөвхөн ангийн жагсаалтаас (classroom_students) авдаг байсан тул
-- ангид ороогүй хүн «Суралцагч 7557d2d8» гэж харагддаг байв.
-- Энэ функц нэрийг дараах дарааллаар хайна:
--   профайлын нэр → сурагчийн профайл → багшийн профайл → ангийн жагсаалт
--   → бүртгүүлэхдээ өгсөн нэр (Google г.м.) ; олдохгүй бол имэйл нь харагдана.
-- Зөвхөн админ дуудаж чадна (is_admin).

create or replace function public.admin_learner_names()
returns table (user_id uuid, display_name text, email text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id as user_id,
    coalesce(
      nullif(btrim(pp.display_name), ''),
      nullif(btrim(sp.display_name), ''),
      nullif(btrim(tp.display_name), ''),
      (
        select nullif(btrim(cs.display_name), '')
        from public.classroom_students cs
        where cs.student_user_id = u.id
          and nullif(btrim(cs.display_name), '') is not null
        limit 1
      ),
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'display_name'), '')
    ) as display_name,
    u.email::text as email
  from auth.users u
  left join public.user_public_profile pp on pp.user_id = u.id
  left join public.student_profiles sp on sp.user_id = u.id
  left join public.teacher_profiles tp on tp.user_id = u.id
  where coalesce(public.is_admin(), false);
$$;

revoke all on function public.admin_learner_names() from public, anon;
grant execute on function public.admin_learner_names() to authenticated;

comment on function public.admin_learner_names() is
  'Админд: хэрэглэгч бүрийн харуулах нэр + имэйл. Админ биш бол хоосон буцаана.';
