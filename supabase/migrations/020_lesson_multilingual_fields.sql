-- Multilingual lesson metadata from ZIP import (target/ui language tags).
alter table public.lessons
  add column if not exists target_language text;

alter table public.lessons
  add column if not exists ui_language text;

comment on column public.lessons.target_language is
  'ISO-style target language code from import manifest, e.g. ko or zh';

comment on column public.lessons.ui_language is
  'UI language code from import manifest, e.g. mn';
