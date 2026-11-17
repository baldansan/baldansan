-- 103: Түвшний групп чат — HSK 1–6 тус бүрт нэг нээлттэй өрөө (kind = 'level').
-- 074 (чат)-ийн ДАРАА. Дахин ажиллуулахад аюулгүй.

-- 1. kind-д 'level' нэмнэ (хуучин check-ийг нэрээс үл хамааран олж солино)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.chat_rooms'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%''class''%'
      and pg_get_constraintdef(oid) like '%''dm''%'
      and pg_get_constraintdef(oid) like '%''topic''%'
  loop
    execute format('alter table public.chat_rooms drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.chat_rooms
  add constraint chat_rooms_kind_check
  check (kind in ('class', 'topic', 'team', 'age', 'dm', 'level'));

create unique index if not exists chat_rooms_one_per_level
  on public.chat_rooms (topic) where kind = 'level';

-- 2. Түвшний өрөөнд нэвтэрсэн хэн ч нэгдэж болно (хүүхдийн бүртгэл, түгжигдсэн хүнээс бусад)
create or replace function public.chat_can_join(p_room uuid, p_user uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.chat_rooms;
  band text;
begin
  if p_user is null or p_user <> auth.uid() then
    return false;
  end if;
  if public.chat_is_kid() or public.chat_is_banned(p_user) then
    return false;
  end if;
  select * into r from public.chat_rooms where id = p_room;
  if not found or r.is_closed then
    return false;
  end if;
  if r.kind in ('topic', 'team', 'level') then
    return r.is_open;
  end if;
  if r.kind = 'age' then
    select p.age_band into band from public.user_public_profile p where p.user_id = p_user;
    return band is not null and band = r.age_band;
  end if;
  return false;
end;
$$;

-- 3. 6 өрөө
insert into public.chat_rooms (kind, title, topic, description, language, is_open, max_members)
select 'level', v.title, v.topic, v.descr, 'zh', true, null
from (values
  ('HSK 1', 'HSK 1 · Анхан шатныхан', 'HSK 1 үзэж байгаа хүмүүсийн чат — асуултаа асуу, хамт сур.'),
  ('HSK 2', 'HSK 2 · Хамт суралцъя',  'HSK 2 үзэж байгаа хүмүүсийн чат — асуултаа асуу, хамт сур.'),
  ('HSK 3', 'HSK 3 · Хамт суралцъя',  'HSK 3 үзэж байгаа хүмүүсийн чат — асуултаа асуу, хамт сур.'),
  ('HSK 4', 'HSK 4 · Хамт суралцъя',  'HSK 4 үзэж байгаа хүмүүсийн чат — асуултаа асуу, хамт сур.'),
  ('HSK 5', 'HSK 5 · Хамт суралцъя',  'HSK 5 үзэж байгаа хүмүүсийн чат — асуултаа асуу, хамт сур.'),
  ('HSK 6', 'HSK 6 · Ахисан шатныхан', 'HSK 6 үзэж байгаа хүмүүсийн чат — асуултаа асуу, хамт сур.')
) as v(topic, title, descr)
where not exists (
  select 1 from public.chat_rooms r where r.kind = 'level' and r.topic = v.topic
);
