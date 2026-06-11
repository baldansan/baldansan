-- 035: Course cover URLs for catalog cards.
-- cover_url column already exists on production — no schema change here.
-- Idempotent seed; safe to re-run after adding public/covers/*.png.

update public.courses
set cover_url = '/covers/hsk4.png', updated_at = now()
where id = 'hsk4'
  and coalesce(cover_url, '') = '';

update public.courses
set cover_url = '/covers/hsk5.png', updated_at = now()
where id = 'hsk5'
  and coalesce(cover_url, '') = '';

update public.courses
set cover_url = '/covers/hsk6.png', updated_at = now()
where id = 'hsk6'
  and coalesce(cover_url, '') = '';
