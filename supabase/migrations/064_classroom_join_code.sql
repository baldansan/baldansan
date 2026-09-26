-- 064: Ангийн 6 оронтой код — сурагч бүртгүүлэхдээ/дараа нь кодоор ангидаа нэгдэнэ.
-- Ажиллуулах: Supabase SQL editor (дахин ажиллуулахад аюулгүй).

alter table public.classrooms
  add column if not exists join_code text;

create unique index if not exists classrooms_join_code_uidx
  on public.classrooms (join_code)
  where join_code is not null;

-- 6 оронтой давтагдашгүй код үүсгэнэ (0-оор эхлэхгүй)
create or replace function public.generate_classroom_join_code()
returns text
language plpgsql
as $$
declare
  code text;
  tries int := 0;
begin
  loop
    code := lpad(((floor(random() * 900000))::int + 100000)::text, 6, '0');
    exit when not exists (select 1 from public.classrooms where join_code = code);
    tries := tries + 1;
    if tries > 50 then
      raise exception 'join code generation failed';
    end if;
  end loop;
  return code;
end;
$$;

-- Шинэ анги бүрт автоматаар код
create or replace function public.set_classroom_join_code()
returns trigger
language plpgsql
as $$
begin
  if new.join_code is null or new.join_code = '' then
    new.join_code := public.generate_classroom_join_code();
  end if;
  return new;
end;
$$;

drop trigger if exists classrooms_set_join_code on public.classrooms;
create trigger classrooms_set_join_code
  before insert on public.classrooms
  for each row execute function public.set_classroom_join_code();

-- Хуучин ангиудад код олгох
update public.classrooms
  set join_code = public.generate_classroom_join_code()
  where join_code is null;

-- Багш кодоо шинэчлэх (RLS: анги нь өөрийнх байх)
create or replace function public.regenerate_classroom_join_code(p_classroom_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  if not public.can_manage_org_classroom(p_classroom_id) then
    raise exception 'not allowed';
  end if;
  code := public.generate_classroom_join_code();
  update public.classrooms set join_code = code where id = p_classroom_id;
  return code;
end;
$$;

-- Сурагч кодоор нэгдэх: нэвтэрсэн хэрэглэгч → classroom_students (идэвхтэй)
drop function if exists public.join_classroom_by_code(text, text);
create function public.join_classroom_by_code(p_code text, p_display_name text default null)
returns table (out_classroom_id uuid, out_classroom_name text, out_already_member boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_class public.classrooms%rowtype;
  v_email text;
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  select * into v_class from public.classrooms
    where join_code = regexp_replace(coalesce(p_code, ''), '\D', '', 'g')
      and status = 'active';
  if not found then
    raise exception 'invalid code';
  end if;

  select id into v_existing from public.classroom_students
    where classroom_id = v_class.id and student_user_id = v_uid limit 1;
  if v_existing is not null then
    update public.classroom_students
      set status = 'active', joined_at = coalesce(joined_at, now())
      where id = v_existing;
    return query select v_class.id, v_class.name, true;
    return;
  end if;

  select email into v_email from auth.users where id = v_uid;

  -- Багш урьдчилж имэйлээр нэмсэн мөр байвал холбоно
  select id into v_existing from public.classroom_students
    where classroom_id = v_class.id and student_user_id is null
      and v_email is not null and lower(email) = lower(v_email) limit 1;
  if v_existing is not null then
    update public.classroom_students
      set student_user_id = v_uid, status = 'active', joined_at = now(),
          display_name = coalesce(nullif(p_display_name, ''), display_name)
      where id = v_existing;
  else
    insert into public.classroom_students (classroom_id, student_user_id, display_name, email, status, joined_at)
    values (v_class.id, v_uid, coalesce(nullif(p_display_name, ''), split_part(coalesce(v_email, ''), '@', 1)), v_email, 'active', now());
  end if;
  return query select v_class.id, v_class.name, false;
end;
$$;

grant execute on function public.join_classroom_by_code(text, text) to authenticated;
grant execute on function public.regenerate_classroom_join_code(uuid) to authenticated;

-- Кодыг зөвхөн шалгах (нэвтрээгүй ч ангийн нэрийг харуулах — бүртгэлийн дэлгэц)
drop function if exists public.peek_classroom_by_code(text);
create function public.peek_classroom_by_code(p_code text)
returns table (out_classroom_name text, out_organization_name text)
language sql
security definer
set search_path = public
stable
as $$
  select c.name, o.name
  from public.classrooms c
  left join public.organizations o on o.id = c.organization_id
  where c.join_code = regexp_replace(coalesce(p_code, ''), '\D', '', 'g')
    and c.status = 'active'
  limit 1;
$$;

grant execute on function public.peek_classroom_by_code(text) to anon, authenticated;
