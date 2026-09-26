-- Эх сурвалжийн санг суралцагчид (нэвтэрсэн ч, нэвтрээгүй ч) уншиж болно — /books хэсэг.
-- Бичих эрх админ хэвээр (062).
drop policy if exists hsk_source_lessons_public_read on public.hsk_source_lessons;
create policy hsk_source_lessons_public_read
  on public.hsk_source_lessons for select
  using (true);
