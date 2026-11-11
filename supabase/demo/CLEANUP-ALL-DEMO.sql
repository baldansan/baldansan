-- =============================================================================
-- БҮХ ДЕМО/ХИЙМЭЛ ХЭРЭГЛЭГЧ, ӨГӨГДЛИЙГ УСТГАХ
-- =============================================================================
-- Хиймэл өгөгдөл бүгд 'd0000000-0000-4000-8000-' угтвартай uuid-тай
-- (seed-training-center.sql 0001–0007, seed-hohhot-500.sql 2001–2022, lib/demo-data.ts).
-- Энэ скрипт public схемийн БҮХ хүснэгтийн uuid баганаас тэр угтвартай мөрийг устгаад,
-- сүүлд auth.users-ийн демо хэрэглэгчдийг устгана. Жинхэнэ бүртгүүлсэн хэрэглэгчдэд хүрэхгүй.
--
-- Supabase → SQL Editor → бүхэлд нь Run (1 удаа). Дахин ажиллуулахад аюулгүй.
-- Дараа нь доод талын ШАЛГАХ хэсэг 0 буцаах ёстой.

do $cleanup$
declare
  pfx constant text := 'd0000000-0000-4000-8000-%';
  r record;
  n bigint;
  total bigint := 0;
  pass int := 0;
  deleted_this_pass bigint;
begin
  -- FK-ийн дарааллаас хамаарахгүйн тулд устгалт амжилтгүй болсон хүснэгтийг
  -- дараагийн давталтад дахин оролдоно (хүүхэд мөр нь урьд нь устсан байх).
  loop
    pass := pass + 1;
    deleted_this_pass := 0;
    for r in
      select c.table_name, c.column_name
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name
      where c.table_schema = 'public'
        and t.table_type = 'BASE TABLE'
        and c.data_type = 'uuid'
    loop
      begin
        execute format('delete from public.%I where %I::text like %L', r.table_name, r.column_name, pfx);
        get diagnostics n = row_count;
        if n > 0 then
          raise notice '%.%: % мөр устлаа', r.table_name, r.column_name, n;
          deleted_this_pass := deleted_this_pass + n;
        end if;
      exception when foreign_key_violation then
        -- дараагийн давталтад
        null;
      when others then
        raise notice 'Алгаслаа %.%: %', r.table_name, r.column_name, sqlerrm;
      end;
    end loop;
    total := total + deleted_this_pass;
    exit when deleted_this_pass = 0 or pass >= 8;
  end loop;

  -- Демо auth хэрэглэгчид (имэйл @demo.buunduu.mn эсвэл демо id).
  begin
    delete from auth.users
    where id::text like pfx or email ilike '%@demo.buunduu.mn';
    get diagnostics n = row_count;
    raise notice 'auth.users: % демо хэрэглэгч устлаа', n;
    total := total + n;
  exception when others then
    raise notice 'auth.users устгахад алдаа: %', sqlerrm;
  end;

  raise notice 'НИЙТ % мөр устлаа (% давталт).', total, pass;
end $cleanup$;

-- ---------------------------------------------------------------------------
-- ШАЛГАХ — бүгд 0 байх ёстой
-- ---------------------------------------------------------------------------
select
  (select count(*) from auth.users where id::text like 'd0000000-0000-4000-8000-%' or email ilike '%@demo.buunduu.mn') as demo_auth_users,
  (select count(*) from public.classrooms where id::text like 'd0000000-0000-4000-8000-%') as demo_classrooms,
  (select count(*) from public.organizations where id::text like 'd0000000-0000-4000-8000-%') as demo_orgs,
  (select count(*) from public.user_points_totals where user_id::text like 'd0000000-0000-4000-8000-%') as demo_points,
  (select count(*) from auth.users) as real_users_left;
