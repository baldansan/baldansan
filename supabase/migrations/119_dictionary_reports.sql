-- Толь бичиг: «Буруу орчуулга» мэдэгдэл (HSK үг ба CC-CEDICT лексикон хоёуланд)
create table if not exists public.dictionary_reports (
  id          uuid primary key default gen_random_uuid(),
  word_id     bigint references public.hsk_words (id) on delete set null,
  lexicon_id  bigint references public.dictionary_lexicon (id) on delete set null,
  simplified  text not null,
  current_mn  text,
  suggestion  text,
  user_id     uuid references auth.users (id) on delete set null,
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_dictionary_reports_open
  on public.dictionary_reports (created_at desc) where status = 'open';

alter table public.dictionary_reports enable row level security;

drop policy if exists dictionary_reports_insert on public.dictionary_reports;
create policy dictionary_reports_insert on public.dictionary_reports
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists dictionary_reports_select on public.dictionary_reports;
create policy dictionary_reports_select on public.dictionary_reports
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists dictionary_reports_admin_update on public.dictionary_reports;
create policy dictionary_reports_admin_update on public.dictionary_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
