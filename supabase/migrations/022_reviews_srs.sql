-- Buunduu Surtsgaay — spaced repetition reviews (SM-2-lite)
-- Safe to re-run: IF NOT EXISTS + drop policy if exists

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('vocab', 'sentence', 'listening')),
  item_ref text not null,
  ease double precision not null default 2.5,
  interval_days integer not null default 0,
  due_at timestamptz not null default now(),
  last_result text,
  reps integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_ref)
);

create index if not exists reviews_user_id_due_at_idx
  on public.reviews (user_id, due_at);

create index if not exists reviews_user_id_item_type_idx
  on public.reviews (user_id, item_type);

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
  before update on public.reviews
  for each row
  execute function public.update_updated_at_column();

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_own" on public.reviews;
create policy "reviews_select_own"
  on public.reviews for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete to authenticated
  using (auth.uid() = user_id);
