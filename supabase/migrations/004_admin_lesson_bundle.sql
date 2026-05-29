-- Admin-only full lesson fetch (SECURITY DEFINER + is_admin check).
-- Fallback when direct table reads fail due to RLS/id typing; uses id::text match.

create or replace function public.get_admin_lesson_bundle(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lid text;
  bundle jsonb;
begin
  if not public.is_admin() then
    return null;
  end if;

  select l.id::text
  into lid
  from public.lessons l
  where l.id::text = trim(p_id)
  limit 1;

  if lid is null then
    return null;
  end if;

  select jsonb_build_object(
    'lesson', to_jsonb(l),
    'subtitles', coalesce(
      (
        select jsonb_agg(to_jsonb(s) order by s.order_index)
        from public.subtitle_lines s
        where s.lesson_id::text = lid
      ),
      '[]'::jsonb
    ),
    'vocabulary', coalesce(
      (
        select jsonb_agg(to_jsonb(v) order by v.order_index)
        from public.vocabulary_words v
        where v.lesson_id::text = lid
      ),
      '[]'::jsonb
    ),
    'quiz', coalesce(
      (
        select jsonb_agg(to_jsonb(q) order by q.order_index)
        from public.quiz_questions q
        where q.lesson_id::text = lid
      ),
      '[]'::jsonb
    )
  )
  into bundle
  from public.lessons l
  where l.id::text = lid;

  return bundle;
end;
$$;

grant execute on function public.get_admin_lesson_bundle(text) to authenticated;

comment on function public.get_admin_lesson_bundle(text) is
  'Admin-only: full lesson + child rows. Requires is_admin() and authenticated JWT.';
