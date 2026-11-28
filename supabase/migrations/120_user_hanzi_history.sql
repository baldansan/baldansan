-- 120: Ханзны түүх — ханз бүрийг хэзээ, хэдэн удаа бичсэн, хэдэн удаа алдсан.
-- Ханзны дэвтэр, Давтах → Бичих, HSK ханз гурвуулаа энд нэг мөрөнд бүртгэнэ.
-- Апп энэ хүснэгтгүйгээр ч ажиллана (утсан дээрээ хадгална); хүснэгт байвал
-- өөр төхөөрөмж дээр түүх нь дагаж ирнэ.
-- Дахин ажиллуулахад аюулгүй.

create table if not exists public.user_hanzi_history (
  user_id        uuid        not null references auth.users (id) on delete cascade,
  ch             text        not null,
  pinyin         text,
  meaning_mn     text,
  writes         integer     not null default 0,
  mistakes       integer     not null default 0,
  recall_ok      integer     not null default 0,
  recall_fail    integer     not null default 0,
  recall_days    text[]      not null default '{}',
  last_recall_ok boolean,
  by_source      jsonb       not null default '{}'::jsonb,
  in_review      boolean     not null default false,
  first_at       timestamptz not null default now(),
  last_at        timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (user_id, ch)
);

comment on table public.user_hanzi_history is
  'Ханз бүрийн бичсэн түүх (хэрэглэгч × ханз). in_review = сурагч өөрөө Давтах → Бичих хуваарьт нэмэхийг зөвшөөрсөн.';

create index if not exists user_hanzi_history_review_idx
  on public.user_hanzi_history (user_id)
  where in_review;

alter table public.user_hanzi_history enable row level security;

drop policy if exists "user_hanzi_history_select_own" on public.user_hanzi_history;
create policy "user_hanzi_history_select_own"
  on public.user_hanzi_history for select
  using (auth.uid() = user_id);

drop policy if exists "user_hanzi_history_insert_own" on public.user_hanzi_history;
create policy "user_hanzi_history_insert_own"
  on public.user_hanzi_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_hanzi_history_update_own" on public.user_hanzi_history;
create policy "user_hanzi_history_update_own"
  on public.user_hanzi_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_hanzi_history_delete_own" on public.user_hanzi_history;
create policy "user_hanzi_history_delete_own"
  on public.user_hanzi_history for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_hanzi_history to authenticated;
