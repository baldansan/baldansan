-- Buunduu Surtsgaay — minimal lesson route status for public unavailable vs not-found
-- Returns id + status + display fields only (no subtitles/vocabulary/quiz).

create or replace function public.get_lesson_route_status(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', l.id::text,
    'status', l.status,
    'title', l.title,
    'chinese_title', l.chinese_title,
    'course_id', l.course_id,
    'subtitle', l.subtitle,
    'description', l.description,
    'duration', l.duration
  )
  from public.lessons l
  where l.id::text = trim(p_id)
  limit 1;
$$;

grant execute on function public.get_lesson_route_status(text) to anon, authenticated;

comment on function public.get_lesson_route_status(text) is
  'Route helper: lesson existence + publish status without exposing draft content.';
