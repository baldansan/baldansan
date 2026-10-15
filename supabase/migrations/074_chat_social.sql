-- 074: Нийгмийн давхарга — чат өрөө, ангийн чат, багууд, нийтийн профайл.
-- Ажиллуулах: Supabase SQL editor (дахин ажиллуулахад аюулгүй). 071 (user_public_profile)-ийн ДАРАА.
--
-- Дүрэм (бүгд SQL дээр хэрэгжинэ):
--   * kind: class (ангийн чат, анги бүрт автоматаар) · topic (сэдвийн өрөө, 1 хүн = 1 өрөө)
--           team (баг, дээд тал нь 5) · age (Хятадаар ярилцъя, 4 насны өрөө) · dm (2 хүний мессеж)
--   * Нээлттэй өрөө бүх нэвтэрсэн хэрэглэгчид харагдана; мессежийг зөвхөн гишүүд уншина.
--   * Хориглосон хүний мессеж chat_messages_visible view-ээс нуугдана.
--   * Хүүхдийн бүртгэл (kid-*@kids.buunduu.mn) чатыг огт ашиглаж чадахгүй.
--   * chat_banned = true хэрэглэгч бичиж, нэгдэж чадахгүй.
--   * Realtime: chat_messages supabase_realtime publication-д нэмэгдэнэ.

-- ---------------------------------------------------------------------------
-- 0. Урьдчилсан нөхцөл
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.user_public_profile') is null then
    raise exception '074 нь user_public_profile хүснэгт шаардана — эхлээд 071-ийг ажиллуулна уу.';
  end if;
end $$;

alter table public.user_public_profile add column if not exists age_band text;
alter table public.user_public_profile add column if not exists bio text;
alter table public.user_public_profile add column if not exists chat_banned boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_public_profile_age_band_chk'
  ) then
    alter table public.user_public_profile
      add constraint user_public_profile_age_band_chk
      check (age_band is null or age_band in ('13-17', '18-24', '25-34', '35+'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'user_public_profile_bio_len_chk'
  ) then
    alter table public.user_public_profile
      add constraint user_public_profile_bio_len_chk
      check (bio is null or char_length(bio) <= 300);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Хүснэгтүүд
-- ---------------------------------------------------------------------------
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('class', 'topic', 'team', 'age', 'dm')),
  title text not null default '' check (char_length(title) <= 80),
  topic text check (topic is null or char_length(topic) <= 80),
  description text check (description is null or char_length(description) <= 500),
  owner_user_id uuid references auth.users(id) on delete set null,
  classroom_id uuid references public.classrooms(id) on delete cascade,
  age_band text check (age_band is null or age_band in ('13-17', '18-24', '25-34', '35+')),
  language text not null default 'zh',
  is_open boolean not null default true,
  is_closed boolean not null default false,
  max_members int check (max_members is null or max_members between 2 and 1000),
  dm_key text,
  created_at timestamptz not null default now(),
  constraint chat_rooms_team_max_chk
    check (kind <> 'team' or (max_members is not null and max_members between 2 and 5)),
  constraint chat_rooms_dm_chk
    check (kind <> 'dm' or (max_members = 2 and is_open = false and dm_key is not null))
);

create unique index if not exists chat_rooms_one_topic_per_owner
  on public.chat_rooms (owner_user_id) where kind = 'topic';
create unique index if not exists chat_rooms_one_per_classroom
  on public.chat_rooms (classroom_id) where kind = 'class';
create unique index if not exists chat_rooms_one_per_age_band
  on public.chat_rooms (age_band) where kind = 'age';
create unique index if not exists chat_rooms_dm_key_uniq
  on public.chat_rooms (dm_key) where kind = 'dm';
create index if not exists chat_rooms_kind_open_idx
  on public.chat_rooms (kind, is_open, created_at desc);

create table if not exists public.chat_members (
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index if not exists chat_members_user_idx on public.chat_members (user_id);

create table if not exists public.chat_messages (
  id bigserial primary key,
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_room_id_idx
  on public.chat_messages (room_id, id desc);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  message_id bigint references public.chat_messages(id) on delete set null,
  room_id uuid references public.chat_rooms(id) on delete set null,
  reported_user_id uuid,
  message_body text,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);
create index if not exists chat_reports_status_idx
  on public.chat_reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Тусламжийн функцууд (security definer — RLS рекурсээс сэргийлнэ)
-- ---------------------------------------------------------------------------
create or replace function public.chat_is_kid()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) like 'kid-%@kids.buunduu.mn';
$$;

create or replace function public.chat_is_banned(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.chat_banned from public.user_public_profile p where p.user_id = p_user),
    false
  );
$$;

create or replace function public.chat_is_member(p_room uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_members m
    where m.room_id = p_room and m.user_id = p_user
  );
$$;

create or replace function public.chat_is_room_owner(p_room uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_rooms r
    where r.id = p_room and r.owner_user_id = p_user
  );
$$;

create or replace function public.chat_room_closed(p_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select r.is_closed from public.chat_rooms r where r.id = p_room), true);
$$;

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
  if r.kind in ('topic', 'team') then
    return r.is_open;
  end if;
  if r.kind = 'age' then
    select p.age_band into band from public.user_public_profile p where p.user_id = p_user;
    return band is not null and band = r.age_band;
  end if;
  return false;
end;
$$;

grant execute on function public.chat_is_kid() to authenticated;
grant execute on function public.chat_is_banned(uuid) to authenticated;
grant execute on function public.chat_is_member(uuid, uuid) to authenticated;
grant execute on function public.chat_is_room_owner(uuid, uuid) to authenticated;
grant execute on function public.chat_room_closed(uuid) to authenticated;
grant execute on function public.chat_can_join(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Триггерүүд
-- ---------------------------------------------------------------------------

-- 3a. Өрөө үүсэхэд эзэмшигчийг гишүүнээр нэмнэ
create or replace function public.chat_rooms_add_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_user_id is not null then
    insert into public.chat_members (room_id, user_id, role)
    values (new.id, new.owner_user_id, 'owner')
    on conflict (room_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists chat_rooms_add_owner_trg on public.chat_rooms;
create trigger chat_rooms_add_owner_trg
  after insert on public.chat_rooms
  for each row execute function public.chat_rooms_add_owner();

-- 3b. kind / эзэмшигчийг өөрчлөхийг хориглоно
create or replace function public.chat_rooms_guard_update()
returns trigger
language plpgsql
as $$
begin
  if new.kind is distinct from old.kind
     or new.owner_user_id is distinct from old.owner_user_id
     or new.classroom_id is distinct from old.classroom_id
     or new.age_band is distinct from old.age_band
     or new.dm_key is distinct from old.dm_key then
    raise exception 'chat_room_immutable_field';
  end if;
  return new;
end;
$$;

drop trigger if exists chat_rooms_guard_update_trg on public.chat_rooms;
create trigger chat_rooms_guard_update_trg
  before update on public.chat_rooms
  for each row execute function public.chat_rooms_guard_update();

-- 3c. Өрөөний багтаамж (баг ≤ 5)
create or replace function public.chat_members_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mx int;
  cnt int;
begin
  select r.max_members into mx
  from public.chat_rooms r where r.id = new.room_id for update;
  if mx is not null then
    select count(*) into cnt from public.chat_members m where m.room_id = new.room_id;
    if cnt >= mx then
      raise exception 'chat_room_full';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists chat_members_capacity_trg on public.chat_members;
create trigger chat_members_capacity_trg
  before insert on public.chat_members
  for each row execute function public.chat_members_capacity();

-- 3d. Анги бүрт чат өрөө автоматаар
create or replace function public.chat_classroom_create_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Эзэмшигч нь auth.users-д байхгүй (жишээ багш) бол owner-гүй үүсгэнэ
  insert into public.chat_rooms
    (kind, title, owner_user_id, classroom_id, is_open, language, max_members)
  values
    ('class', left(new.name, 80),
     case when exists (select 1 from auth.users u where u.id = new.teacher_user_id)
          then new.teacher_user_id else null end,
     new.id, false, 'zh', null)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists chat_classroom_create_room_trg on public.classrooms;
create trigger chat_classroom_create_room_trg
  after insert on public.classrooms
  for each row execute function public.chat_classroom_create_room();

create or replace function public.chat_classroom_rename_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_rooms
     set title = left(new.name, 80)
   where classroom_id = new.id and kind = 'class';
  return new;
end;
$$;

drop trigger if exists chat_classroom_rename_room_trg on public.classrooms;
create trigger chat_classroom_rename_room_trg
  after update of name on public.classrooms
  for each row execute function public.chat_classroom_rename_room();

-- 3e. Ангийн сурагч → ангийн чатын гишүүн
create or replace function public.chat_classroom_student_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  if tg_op = 'DELETE' then
    select r.id into rid from public.chat_rooms r
      where r.classroom_id = old.classroom_id and r.kind = 'class';
    if rid is not null and old.student_user_id is not null then
      delete from public.chat_members
       where room_id = rid and user_id = old.student_user_id and role = 'member';
    end if;
    return old;
  end if;

  select r.id into rid from public.chat_rooms r
    where r.classroom_id = new.classroom_id and r.kind = 'class';
  if rid is null then
    return new;
  end if;

  if new.student_user_id is not null and new.status = 'active'
     and exists (select 1 from auth.users u where u.id = new.student_user_id) then
    insert into public.chat_members (room_id, user_id, role)
    values (rid, new.student_user_id, 'member')
    on conflict (room_id, user_id) do nothing;
  elsif new.student_user_id is not null then
    delete from public.chat_members
     where room_id = rid and user_id = new.student_user_id and role = 'member';
  end if;
  return new;
end;
$$;

drop trigger if exists chat_classroom_student_sync_trg on public.classroom_students;
create trigger chat_classroom_student_sync_trg
  after insert or update of student_user_id, status or delete on public.classroom_students
  for each row execute function public.chat_classroom_student_sync();

-- 3f. chat_banned-ийг зөвхөн админ өөрчилнө; нас өөрчлөгдвөл таарахгүй насны өрөөнөөс гаргана
create or replace function public.chat_profile_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.chat_banned and not coalesce(public.is_admin(), false) then
      new.chat_banned := false;
    end if;
    return new;
  end if;

  if new.chat_banned is distinct from old.chat_banned
     and not coalesce(public.is_admin(), false) then
    new.chat_banned := old.chat_banned;
  end if;

  if new.age_band is distinct from old.age_band then
    delete from public.chat_members m
     using public.chat_rooms r
     where m.room_id = r.id
       and r.kind = 'age'
       and m.user_id = new.user_id
       and (new.age_band is null or r.age_band is distinct from new.age_band);
  end if;
  return new;
end;
$$;

drop trigger if exists chat_profile_guard_trg on public.user_public_profile;
create trigger chat_profile_guard_trg
  before insert or update on public.user_public_profile
  for each row execute function public.chat_profile_guard();

-- ---------------------------------------------------------------------------
-- 4. Тогтсон өгөгдөл: 4 насны өрөө
-- ---------------------------------------------------------------------------
insert into public.chat_rooms (kind, title, topic, description, age_band, language, is_open, max_members)
select 'age', v.title, '聊天', v.descr, v.band, 'zh', true, null
from (values
  ('13-17', '13-17 нас · 用中文聊天', 'Хятадаар ярилцъя — 13-17 насныхан'),
  ('18-24', '18-24 нас · 用中文聊天', 'Хятадаар ярилцъя — 18-24 насныхан'),
  ('25-34', '25-34 нас · 用中文聊天', 'Хятадаар ярилцъя — 25-34 насныхан'),
  ('35+',   '35+ нас · 用中文聊天',   'Хятадаар ярилцъя — 35-аас дээш насныхан')
) as v(band, title, descr)
where not exists (
  select 1 from public.chat_rooms r where r.kind = 'age' and r.age_band = v.band
);

-- Одоо байгаа ангиудад өрөө + гишүүд (нэг удаагийн backfill)
insert into public.chat_rooms (kind, title, owner_user_id, classroom_id, is_open, language)
select 'class', left(c.name, 80),
  case when exists (select 1 from auth.users u where u.id = c.teacher_user_id)
       then c.teacher_user_id else null end,
  c.id, false, 'zh'
from public.classrooms c
where not exists (
  select 1 from public.chat_rooms r where r.kind = 'class' and r.classroom_id = c.id
);

insert into public.chat_members (room_id, user_id, role)
select r.id, c.teacher_user_id, 'owner'
from public.chat_rooms r
join public.classrooms c on c.id = r.classroom_id
where r.kind = 'class'
  and exists (select 1 from auth.users u where u.id = c.teacher_user_id)
on conflict (room_id, user_id) do nothing;

insert into public.chat_members (room_id, user_id, role)
select r.id, cs.student_user_id, 'member'
from public.chat_rooms r
join public.classroom_students cs on cs.classroom_id = r.classroom_id
where r.kind = 'class'
  and cs.student_user_id is not null
  and cs.status = 'active'
  and exists (select 1 from auth.users u where u.id = cs.student_user_id)
on conflict (room_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
alter table public.chat_rooms enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.user_blocks enable row level security;
alter table public.chat_reports enable row level security;

-- chat_rooms
drop policy if exists chat_rooms_select on public.chat_rooms;
create policy chat_rooms_select on public.chat_rooms
  for select to authenticated
  using (
    not public.chat_is_kid()
    and (
      owner_user_id = auth.uid()
      or public.chat_is_member(id, auth.uid())
      or (is_open and not is_closed)
      or public.is_admin()
    )
  );

drop policy if exists chat_rooms_insert on public.chat_rooms;
create policy chat_rooms_insert on public.chat_rooms
  for insert to authenticated
  with check (
    owner_user_id = auth.uid()
    and kind in ('topic', 'team')
    and not public.chat_is_kid()
    and not public.chat_is_banned(auth.uid())
  );

drop policy if exists chat_rooms_update on public.chat_rooms;
create policy chat_rooms_update on public.chat_rooms
  for update to authenticated
  using (owner_user_id = auth.uid() and not public.chat_is_kid())
  with check (owner_user_id = auth.uid() and not public.chat_is_kid());

drop policy if exists chat_rooms_delete on public.chat_rooms;
create policy chat_rooms_delete on public.chat_rooms
  for delete to authenticated
  using (
    (owner_user_id = auth.uid() and kind in ('topic', 'team') and not public.chat_is_kid())
    or public.is_admin()
  );

-- chat_members
drop policy if exists chat_members_select on public.chat_members;
create policy chat_members_select on public.chat_members
  for select to authenticated
  using (
    not public.chat_is_kid()
    and (public.chat_is_member(room_id, auth.uid()) or public.is_admin())
  );

drop policy if exists chat_members_insert on public.chat_members;
create policy chat_members_insert on public.chat_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'member'
    and public.chat_can_join(room_id, auth.uid())
  );

drop policy if exists chat_members_delete on public.chat_members;
create policy chat_members_delete on public.chat_members
  for delete to authenticated
  using (
    not public.chat_is_kid()
    and (
      (user_id = auth.uid() and role = 'member')
      or (role = 'member' and public.chat_is_room_owner(room_id, auth.uid()))
      or public.is_admin()
    )
  );

-- chat_messages
drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages
  for select to authenticated
  using (
    not public.chat_is_kid()
    and (public.chat_is_member(room_id, auth.uid()) or public.is_admin())
  );

drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and not public.chat_is_kid()
    and not public.chat_is_banned(auth.uid())
    and public.chat_is_member(room_id, auth.uid())
    and not public.chat_room_closed(room_id)
  );

drop policy if exists chat_messages_delete on public.chat_messages;
create policy chat_messages_delete on public.chat_messages
  for delete to authenticated
  using (
    not public.chat_is_kid()
    and (user_id = auth.uid() or public.is_admin())
  );

-- user_blocks
drop policy if exists user_blocks_select on public.user_blocks;
create policy user_blocks_select on public.user_blocks
  for select to authenticated using (blocker_id = auth.uid());

drop policy if exists user_blocks_insert on public.user_blocks;
create policy user_blocks_insert on public.user_blocks
  for insert to authenticated
  with check (blocker_id = auth.uid() and not public.chat_is_kid());

drop policy if exists user_blocks_delete on public.user_blocks;
create policy user_blocks_delete on public.user_blocks
  for delete to authenticated using (blocker_id = auth.uid());

-- chat_reports: оруулах нь зөвхөн chat_report_message() RPC-ээр
drop policy if exists chat_reports_admin_select on public.chat_reports;
create policy chat_reports_admin_select on public.chat_reports
  for select to authenticated using (public.is_admin());

drop policy if exists chat_reports_admin_update on public.chat_reports;
create policy chat_reports_admin_update on public.chat_reports
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. RPC-ууд
-- ---------------------------------------------------------------------------
create or replace function public.chat_report_message(p_message_id bigint, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.chat_messages;
  rid uuid;
begin
  if auth.uid() is null or public.chat_is_kid() then
    raise exception 'not_allowed';
  end if;
  select * into m from public.chat_messages where id = p_message_id;
  if not found or not public.chat_is_member(m.room_id, auth.uid()) then
    raise exception 'not_allowed';
  end if;
  insert into public.chat_reports
    (message_id, room_id, reported_user_id, message_body, reporter_id, reason)
  values
    (m.id, m.room_id, m.user_id, m.body, auth.uid(), left(coalesce(p_reason, ''), 500))
  returning id into rid;
  return rid;
end;
$$;

create or replace function public.chat_open_dm(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  key text;
  rid uuid;
  other_email text;
begin
  if me is null or public.chat_is_kid() or public.chat_is_banned(me) then
    raise exception 'not_allowed';
  end if;
  if p_other is null or p_other = me then
    raise exception 'invalid_user';
  end if;
  select lower(u.email) into other_email from auth.users u where u.id = p_other;
  if other_email is null or other_email like 'kid-%@kids.buunduu.mn' then
    raise exception 'invalid_user';
  end if;
  if exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = p_other and b.blocked_id = me)
       or (b.blocker_id = me and b.blocked_id = p_other)
  ) then
    raise exception 'blocked';
  end if;

  key := least(me::text, p_other::text) || ':' || greatest(me::text, p_other::text);
  select r.id into rid from public.chat_rooms r where r.kind = 'dm' and r.dm_key = key;
  if rid is not null then
    return rid;
  end if;

  insert into public.chat_rooms (kind, title, owner_user_id, is_open, max_members, dm_key, language)
  values ('dm', '', me, false, 2, key, 'zh')
  returning id into rid;

  insert into public.chat_members (room_id, user_id, role)
  values (rid, p_other, 'member')
  on conflict (room_id, user_id) do nothing;
  return rid;
end;
$$;

create or replace function public.chat_admin_set_ban(p_user uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'not_allowed';
  end if;
  update public.user_public_profile set chat_banned = p_banned where user_id = p_user;
  if not found then
    insert into public.user_public_profile (user_id, display_name, chat_banned)
    values (p_user, 'Хэрэглэгч', p_banned);
  end if;
  if p_banned then
    delete from public.chat_members where user_id = p_user and role = 'member';
  end if;
end;
$$;

grant execute on function public.chat_report_message(bigint, text) to authenticated;
grant execute on function public.chat_open_dm(uuid) to authenticated;
grant execute on function public.chat_admin_set_ban(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. View-үүд
-- ---------------------------------------------------------------------------

-- Блоклосон хүний мессеж нуугдана (RLS нь дуудагчийн эрхээр хэрэгжинэ)
create or replace view public.chat_messages_visible
with (security_invoker = true) as
select m.*
from public.chat_messages m
where not exists (
  select 1 from public.user_blocks b
  where b.blocker_id = auth.uid() and b.blocked_id = m.user_id
);

-- Өрөөний жагсаалт: гишүүний тоо, миний гишүүнчлэл, эзэмшигчийн нэр
create or replace view public.chat_room_directory as
select
  r.id, r.kind, r.title, r.topic, r.description, r.owner_user_id, r.classroom_id,
  r.age_band, r.language, r.is_open, r.is_closed, r.max_members, r.created_at,
  (select count(*) from public.chat_members m where m.room_id = r.id)::int as member_count,
  public.chat_is_member(r.id, auth.uid()) as is_member,
  p.display_name as owner_name,
  p.avatar as owner_avatar
from public.chat_rooms r
left join public.user_public_profile p on p.user_id = r.owner_user_id
where not public.chat_is_kid()
  and (
    public.chat_is_member(r.id, auth.uid())
    or (r.is_open and not r.is_closed)
    or coalesce(public.is_admin(), false)
  );

-- Өрөөний гишүүд + нэр/avatar (зөвхөн тухайн өрөөний гишүүдэд)
create or replace view public.chat_member_profiles as
select
  m.room_id, m.user_id, m.role, m.joined_at,
  coalesce(
    nullif(p.display_name, ''),
    (select cs.display_name from public.classroom_students cs
      where cs.student_user_id = m.user_id and cs.display_name is not null limit 1),
    ''
  ) as display_name,
  p.avatar
from public.chat_members m
left join public.user_public_profile p on p.user_id = m.user_id
where not public.chat_is_kid()
  and (public.chat_is_member(m.room_id, auth.uid()) or coalesce(public.is_admin(), false));

-- Нийтийн профайл: нэр/avatar бүх нэвтэрсэн хэрэглэгчид, бусад нь зөвхөн is_public үед
create or replace view public.chat_profiles as
select
  p.user_id,
  p.display_name,
  p.avatar,
  p.is_public,
  case when p.is_public then p.level_label end as level_label,
  case when p.is_public then p.instagram end as instagram,
  case when p.is_public then p.bio end as bio,
  case when p.is_public then p.age_band end as age_band,
  p.chat_banned
from public.user_public_profile p
where not public.chat_is_kid();

revoke all on public.chat_room_directory from anon;
revoke all on public.chat_member_profiles from anon;
revoke all on public.chat_profiles from anon;
revoke all on public.chat_messages_visible from anon;
grant select on public.chat_room_directory to authenticated;
grant select on public.chat_member_profiles to authenticated;
grant select on public.chat_profiles to authenticated;
grant select on public.chat_messages_visible to authenticated;

revoke all on public.chat_rooms, public.chat_members, public.chat_messages,
  public.user_blocks, public.chat_reports from anon;
grant select, insert, update, delete on public.chat_rooms to authenticated;
grant select, insert, delete on public.chat_members to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;
grant select, insert, delete on public.user_blocks to authenticated;
grant select, update on public.chat_reports to authenticated;
grant usage, select on sequence public.chat_messages_id_seq to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
