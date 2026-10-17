-- 077: Алдаа мэдээлэх (feedback.stage='report') — дэлгэцийн зураг + төхөөрөмжийн мэдээлэл.
-- Дахин ажиллуулахад аюулгүй. Зураг нь public bucket `feedback-screenshots`-д
-- (server route service-role-оор upload хийнэ; bucket байхгүй бол route өөрөө үүсгэнэ).

alter table public.feedback
  add column if not exists screenshot_url text,
  add column if not exists user_agent text,
  add column if not exists viewport text;

insert into storage.buckets (id, name, public)
values ('feedback-screenshots', 'feedback-screenshots', true)
on conflict (id) do update set public = true;

drop policy if exists "feedback_screenshots_public_read" on storage.objects;
create policy "feedback_screenshots_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'feedback-screenshots');
