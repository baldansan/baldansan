-- Buunduu Surtsgaay — initial schema (Phase 3 Step 1)
-- PostgreSQL / Supabase compatible
--
-- RLS will be added in Phase 4 with authentication.
-- user_id columns will later reference auth.users(id).

-- ---------------------------------------------------------------------------
-- Helper: auto-update updated_at on row change
-- ---------------------------------------------------------------------------

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------------

create table public.courses (
  id text primary key,
  title text not null,
  description text,
  level text,
  status text not null default 'available',
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  title text not null,
  chinese_title text,
  subtitle text,
  description text,
  duration text,
  vocabulary_count integer not null default 0,
  quiz_count integer not null default 0,
  status text not null default 'locked',
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subtitle_lines (
  id bigserial primary key,
  lesson_id text not null references public.lessons (id) on delete cascade,
  start_time text not null,
  end_time text not null,
  chinese text not null,
  pinyin text,
  mongolian text not null,
  order_index integer not null default 0
);

create table public.vocabulary_words (
  id bigserial primary key,
  lesson_id text not null references public.lessons (id) on delete cascade,
  chinese text not null,
  pinyin text,
  mongolian text not null,
  hsk_level text,
  example_chinese text,
  example_mongolian text,
  order_index integer not null default 0
);

create table public.quiz_questions (
  id bigserial primary key,
  lesson_id text not null references public.lessons (id) on delete cascade,
  type text not null,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation text,
  order_index integer not null default 0
);

-- ---------------------------------------------------------------------------
-- User progress tables (no auth FK yet — Phase 4)
-- ---------------------------------------------------------------------------

create table public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  lesson_id text not null references public.lessons (id) on delete cascade,
  status text not null default 'not_started',
  progress_percent integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table public.user_vocabulary_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  vocabulary_word_id bigint not null references public.vocabulary_words (id) on delete cascade,
  status text not null default 'learning',
  learned_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, vocabulary_word_id)
);

create table public.user_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  lesson_id text not null references public.lessons (id) on delete cascade,
  score integer not null,
  total integer not null,
  percentage integer not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index lessons_course_id_idx on public.lessons (course_id);

create index subtitle_lines_lesson_order_idx
  on public.subtitle_lines (lesson_id, order_index);

create index vocabulary_words_lesson_order_idx
  on public.vocabulary_words (lesson_id, order_index);

create index vocabulary_words_hsk_level_idx
  on public.vocabulary_words (hsk_level);

create index quiz_questions_lesson_order_idx
  on public.quiz_questions (lesson_id, order_index);

create index user_lesson_progress_user_id_idx
  on public.user_lesson_progress (user_id);

create index user_vocabulary_progress_user_id_idx
  on public.user_vocabulary_progress (user_id);

create index user_quiz_attempts_user_lesson_idx
  on public.user_quiz_attempts (user_id, lesson_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger courses_updated_at
  before update on public.courses
  for each row
  execute function public.update_updated_at_column();

create trigger lessons_updated_at
  before update on public.lessons
  for each row
  execute function public.update_updated_at_column();

create trigger user_lesson_progress_updated_at
  before update on public.user_lesson_progress
  for each row
  execute function public.update_updated_at_column();

create trigger user_vocabulary_progress_updated_at
  before update on public.user_vocabulary_progress
  for each row
  execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Row Level Security (deferred to Phase 4)
-- ---------------------------------------------------------------------------
-- alter table public.courses enable row level security;
-- alter table public.lessons enable row level security;
-- ... policies will tie user_id to auth.uid() after Supabase Auth is enabled.
