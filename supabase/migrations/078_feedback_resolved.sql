-- 078: admin/feedback — «Засагдсан ✓» тэмдэглэх (resolved_at). Дахин ажиллуулахад аюулгүй.
alter table public.feedback
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references auth.users (id) on delete set null;

create index if not exists feedback_resolved_idx on public.feedback (resolved_at);

drop policy if exists "feedback_admin_update" on public.feedback;
create policy "feedback_admin_update"
  on public.feedback
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
