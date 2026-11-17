-- 104: RLS бодлогуудыг хурдлуулах (Supabase Performance Advisor: «Auth RLS Initialization Plan»).
--
-- Бодлого дотор auth.uid() / auth.role() / auth.jwt() нүцгэн байвал Postgres түүнийг МӨР БҮРД
-- дахин тооцдог. (select auth.uid()) гэж боовол нэг хүсэлтэд НЭГ л удаа тооцно — үр дүн яг адил,
-- зөвхөн хурдан. Энэ скрипт public схемийн бүх бодлогыг гүйлгэж, зөвхөн тэр хэсгийг л сольж бичнэ.
-- Хэн юу харах/бичих эрх ӨӨРЧЛӨГДӨХГҮЙ.
--
-- Бүгд нэг transaction: аль нэг бодлого дээр алдаа гарвал юу ч өөрчлөгдөхгүй буцна.
-- Дахин ажиллуулахад аюулгүй (аль хэдийн боосон бодлогыг алгасна).

do $$
declare
  p record;
  new_qual text;
  new_check text;
  changed int := 0;
  stmt text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ~ 'auth\.(uid|role|jwt)\(\)'
        or coalesce(with_check, '') ~ 'auth\.(uid|role|jwt)\(\)'
      )
  loop
    -- «SELECT auth.uid() AS uid» хэлбэрээр аль хэдийн боогдсоныг хөндөхгүй (lookbehind).
    new_qual := regexp_replace(p.qual, '(?<!SELECT )auth\.(uid|role|jwt)\(\)', '(select auth.\1())', 'g');
    new_check := regexp_replace(p.with_check, '(?<!SELECT )auth\.(uid|role|jwt)\(\)', '(select auth.\1())', 'g');

    if new_qual is not distinct from p.qual and new_check is not distinct from p.with_check then
      continue;
    end if;

    stmt := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if new_qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;
    execute stmt;
    changed := changed + 1;
  end loop;

  raise notice '104: % бодлого шинэчлэгдлээ', changed;
end $$;
