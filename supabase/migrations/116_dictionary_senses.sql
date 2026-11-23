-- Толь бичиг v2 — hsk_words дээр баялаг утга давхарга.
-- Нэг үг → олон утга (sense) → утга бүрт монгол синонимууд + олон жишээ.
-- Ажлын урсгал: draft (AI ноорог) → reviewed (оюутан/редактор) → approved (ерөнхий редактор).
-- Сурагч талд зөвхөн approved харагдана; admin бүгдийг хардаг.

-- 1. Үгийн толийн толгой (нэг үг = нэг мөр)
create table if not exists public.dictionary_entries (
  word_id         bigint primary key references public.hsk_words (id) on delete cascade,
  status          text not null default 'draft'
                  check (status in ('draft', 'reviewed', 'approved', 'rejected')),
  usage_note_mn   text,            -- хэрэглээний тайлбар (хэзээ хэрэглэх, юунаас ялгаатай)
  measure_words   text[],          -- тооны нэр: 个, 本 …
  collocations    jsonb,           -- [{zh, pinyin, mn}] түгээмэл холбоо үг
  confusable_with text[],          -- андуурагддаг үгс (ханзаар)
  register        text,            -- 'ярианы' | 'бичгийн' | 'албан' | 'хуучин' …
  source          text not null default 'ai',   -- ai | teacher | menksoft-ref | student
  reviewed_by     uuid references auth.users (id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_dictionary_entries_status on public.dictionary_entries (status);

-- 2. Утгууд
create table if not exists public.dictionary_senses (
  id            bigserial primary key,
  word_id       bigint not null references public.hsk_words (id) on delete cascade,
  sense_no      smallint not null default 1,
  pos           text,              -- n, v, a, ad, prep, conj, m, u …
  gloss_zh      text,              -- хятад тайлбар (толь бичгийн 释义)
  meaning_mn    text not null,     -- үндсэн монгол утга (1–2 үг/хэллэг)
  synonyms_mn   text[],            -- 3–5 ижил/ойролцоо утгатай монгол үг — үгийн баялаг
  meaning_en    text,
  note_mn       text,              -- энэ утгын онцлог (хэлзүйн хэрэглээ, өнгө аяс)
  status        text not null default 'draft'
                check (status in ('draft', 'reviewed', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (word_id, sense_no)
);

create index if not exists idx_dictionary_senses_word on public.dictionary_senses (word_id);

-- 3. Жишээ өгүүлбэр (утга бүрт ≥2)
create table if not exists public.dictionary_examples (
  id          bigserial primary key,
  sense_id    bigint not null references public.dictionary_senses (id) on delete cascade,
  example_no  smallint not null default 1,
  zh          text not null,
  pinyin      text,
  mn          text not null,
  source      text not null default 'ai',
  created_at  timestamptz not null default now()
);

create index if not exists idx_dictionary_examples_sense on public.dictionary_examples (sense_id);

-- 4. Сурагчдын санал («орчуулга буруу/дутуу») → редакторын дараалал
create table if not exists public.dictionary_feedback (
  id          uuid primary key default gen_random_uuid(),
  word_id     bigint not null references public.hsk_words (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete set null,
  kind        text not null default 'wrong'
              check (kind in ('wrong', 'missing', 'example', 'other')),
  message     text,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_dictionary_feedback_open
  on public.dictionary_feedback (created_at desc) where resolved_at is null;

-- updated_at автоматаар
create or replace function public.dictionary_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_dictionary_entries_touch on public.dictionary_entries;
create trigger trg_dictionary_entries_touch before update on public.dictionary_entries
  for each row execute function public.dictionary_touch_updated_at();

drop trigger if exists trg_dictionary_senses_touch on public.dictionary_senses;
create trigger trg_dictionary_senses_touch before update on public.dictionary_senses
  for each row execute function public.dictionary_touch_updated_at();

-- 5. RLS
alter table public.dictionary_entries  enable row level security;
alter table public.dictionary_senses   enable row level security;
alter table public.dictionary_examples enable row level security;
alter table public.dictionary_feedback enable row level security;

-- Нийтэд: зөвхөн approved
drop policy if exists dictionary_entries_public_read on public.dictionary_entries;
create policy dictionary_entries_public_read on public.dictionary_entries
  for select using (status = 'approved' or public.is_admin());

drop policy if exists dictionary_senses_public_read on public.dictionary_senses;
create policy dictionary_senses_public_read on public.dictionary_senses
  for select using (status = 'approved' or public.is_admin());

drop policy if exists dictionary_examples_public_read on public.dictionary_examples;
create policy dictionary_examples_public_read on public.dictionary_examples
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.dictionary_senses s
      where s.id = dictionary_examples.sense_id and s.status = 'approved'
    )
  );

-- Admin: бүх бичилт
drop policy if exists dictionary_entries_admin_write on public.dictionary_entries;
create policy dictionary_entries_admin_write on public.dictionary_entries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists dictionary_senses_admin_write on public.dictionary_senses;
create policy dictionary_senses_admin_write on public.dictionary_senses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists dictionary_examples_admin_write on public.dictionary_examples;
create policy dictionary_examples_admin_write on public.dictionary_examples
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Санал: нэвтэрсэн хүн бүр өгч болно, өөрийнхөө харна; admin бүгдийг
drop policy if exists dictionary_feedback_insert on public.dictionary_feedback;
create policy dictionary_feedback_insert on public.dictionary_feedback
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists dictionary_feedback_select on public.dictionary_feedback;
create policy dictionary_feedback_select on public.dictionary_feedback
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists dictionary_feedback_admin_update on public.dictionary_feedback;
create policy dictionary_feedback_admin_update on public.dictionary_feedback
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6. Төлөвийн тоо — admin самбарын толгой (түвшин бүрээр)
create or replace function public.dictionary_status_counts()
returns table (hsk_level text, total bigint, draft bigint, reviewed bigint, approved bigint, "none" bigint)
language sql stable security definer set search_path = public as $$
  select w.hsk_level,
         count(*)                                         as total,
         count(*) filter (where e.status = 'draft')       as draft,
         count(*) filter (where e.status = 'reviewed')    as reviewed,
         count(*) filter (where e.status = 'approved')    as approved,
         count(*) filter (where e.word_id is null)        as "none"
  from public.hsk_words w
  left join public.dictionary_entries e on e.word_id = w.id
  group by w.hsk_level
  order by case w.hsk_level when '7-9' then 7 else w.hsk_level::int end;
$$;

grant execute on function public.dictionary_status_counts() to authenticated;

comment on table public.dictionary_entries is
  'Толь бичиг v2 толгой — hsk_words-ийн нэг үг. Утгууд dictionary_senses-д.';
comment on table public.dictionary_senses is
  'Нэг үгийн салаа утгууд; synonyms_mn = монгол үгийн баялаг (3–5 ойролцоо үг).';
