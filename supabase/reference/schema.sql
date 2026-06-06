-- Buunduu Surtsgaay — HSK reference vocabulary (Phase 1)
-- Source: drkameleon/complete-hsk-vocabulary (MIT)
-- Safe to re-run: IF NOT EXISTS + conditional column adds

create table if not exists public.hsk_words (
  id bigserial primary key,
  simplified text not null,
  traditional text,
  pinyin text,
  pinyin_numeric text,
  bopomofo text,
  pos text[] not null default '{}',
  radical text,
  frequency integer,
  hsk_level integer,
  hsk_old text[] not null default '{}',
  hsk_new text[] not null default '{}',
  hsk_newest text[] not null default '{}',
  classifiers text[] not null default '{}',
  meanings_en text[] not null default '{}',
  meaning_en text,
  cedict_key text,
  meaning_mn text,
  meaning_mn_status text,
  example_zh text,
  example_pinyin text,
  example_mn text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (simplified, pinyin)
);

-- Add example columns when upgrading an existing hsk_words table
alter table public.hsk_words add column if not exists hsk_level integer;
alter table public.hsk_words add column if not exists example_zh text;
alter table public.hsk_words add column if not exists example_pinyin text;
alter table public.hsk_words add column if not exists example_mn text;

create index if not exists hsk_words_simplified_idx on public.hsk_words (simplified);
create index if not exists hsk_words_frequency_idx on public.hsk_words (frequency);
create index if not exists hsk_words_hsk_old_gin_idx on public.hsk_words using gin (hsk_old);
create index if not exists hsk_words_hsk_new_gin_idx on public.hsk_words using gin (hsk_new);

drop trigger if exists hsk_words_updated_at on public.hsk_words;
create trigger hsk_words_updated_at
  before update on public.hsk_words
  for each row
  execute function public.update_updated_at_column();

alter table public.hsk_words enable row level security;

drop policy if exists "hsk_words_select_public" on public.hsk_words;
create policy "hsk_words_select_public"
  on public.hsk_words for select
  using (true);
