-- 064: lessons.content_type / lesson_type — жагсаалтын query-д source_note татахгүй байх.
--
-- lessons.source_note нь хичээлийн БҮХ агуулгыг (hskStudyContent JSON, 100–300KB/мөр)
-- хадгалдаг. Жагсаалт (/home, каталог, admin list) зөвхөн contentType/lessonType гэсэн
-- 2 tag-ийг л хэрэглэдэг байсан ч бүх баганыг татаж /home нэг удаад ~6MB DB egress болж байв.
-- Энэ migration 2 жижиг багана нэмж, trigger-ээр source_note-оос автоматаар бөглөнө.
-- Supabase SQL Editor дээр нэг удаа ажиллуулна (дахин ажиллуулахад аюулгүй).

alter table public.lessons
  add column if not exists content_type text,
  add column if not exists lesson_type text;

create or replace function public.lessons_sync_type_cols()
returns trigger
language plpgsql
as $$
declare
  j   jsonb;
  raw text;
begin
  raw := coalesce(new.source_note, '');
  new.content_type := null;
  new.lesson_type := null;

  if left(ltrim(raw), 1) = '{' then
    begin
      j := raw::jsonb;
      new.content_type := lower(nullif(trim(j->>'contentType'), ''));
      if new.content_type is null then
        new.content_type := lower(nullif(trim(j->>'content_type'), ''));
      end if;
      new.lesson_type := lower(nullif(trim(j->>'lessonType'), ''));
      -- HSK бүтэцтэй хичээл (hskStudyContent байгаа) = сурах бичиг
      if new.content_type is null and (j ? 'hskStudyContent') then
        new.content_type := 'textbook';
      end if;
      if new.content_type is null and (j->>'legacySourceNote') is not null then
        raw := j->>'legacySourceNote';
      else
        raw := '';
      end if;
    exception when others then
      j := null; -- JSON биш → доорх key=value задлалт
    end;
  end if;

  if raw <> '' then
    if new.content_type is null then
      new.content_type := lower((regexp_match(raw, 'contentType=([^·\s,]+)', 'i'))[1]);
    end if;
    if new.content_type is null then
      new.content_type := lower((regexp_match(raw, 'content_type=([^·\s,]+)', 'i'))[1]);
    end if;
    if new.lesson_type is null then
      new.lesson_type := lower((regexp_match(raw, 'lessonType=([^·\s,]+)', 'i'))[1]);
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists lessons_sync_type_cols_trg on public.lessons;
create trigger lessons_sync_type_cols_trg
  before insert or update of source_note on public.lessons
  for each row execute function public.lessons_sync_type_cols();

-- Одоо байгаа мөрүүдийг бөглөх (trigger ажиллана)
update public.lessons set source_note = source_note;

-- Жагсаалтын query-ийн индекс
create index if not exists lessons_course_status_order_idx
  on public.lessons (course_id, status, order_index);
