-- 112: Групп чатын 7 хоногийн сорилт — «Бүгдээрээ N үг цээжилье».
-- Хөтлөгч (чатын owner) сорилт зарлана; гишүүдийн тухайн хугацаанд цээжилсэн үгийг (user_word_srs, «мэднэ» гэж
-- тэмдэглэсэн) нийлүүлж тоолно. Хэн хэдэн үг хийснийг зөвхөн нийлбэр ба эхний 3-аар харуулна.
-- 074, 103, 105-ын ДАРАА. Дахин ажиллуулахад аюулгүй.

create table if not exists public.chat_challenges (
  id bigserial primary key,
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  target int not null check (target between 10 and 100000),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists chat_challenges_room_idx on public.chat_challenges (room_id, ends_at desc);

alter table public.chat_challenges enable row level security;

drop policy if exists chat_challenges_select on public.chat_challenges;
create policy chat_challenges_select on public.chat_challenges
  for select to authenticated
  using (public.chat_is_member(room_id, (select auth.uid())));

-- Зөвхөн тухайн чатын хөтлөгч (chat_members.role = 'owner') сорилт үүсгэнэ.
drop policy if exists chat_challenges_insert on public.chat_challenges;
create policy chat_challenges_insert on public.chat_challenges
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.chat_members m
      where m.room_id = chat_challenges.room_id
        and m.user_id = (select auth.uid())
        and m.role = 'owner'
    )
  );

drop policy if exists chat_challenges_delete on public.chat_challenges;
create policy chat_challenges_delete on public.chat_challenges
  for delete to authenticated
  using (created_by = (select auth.uid()));

grant select, insert, delete on public.chat_challenges to authenticated;
grant usage, select on sequence public.chat_challenges_id_seq to authenticated;

-- Идэвхтэй сорилтын төлөв: нийт, миний тоо, эхний 3. Зөвхөн гишүүн дуудаж чадна.
create or replace function public.chat_challenge_status(p_room uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  c record;
  v_total bigint;
  v_mine bigint;
  v_top jsonb;
begin
  if v_uid is null or not public.chat_is_member(p_room, v_uid) then
    return null;
  end if;

  select * into c
  from public.chat_challenges
  where room_id = p_room and ends_at > now() and starts_at <= now()
  order by created_at desc
  limit 1;
  if not found then
    return null;
  end if;

  with per_user as (
    select s.user_id, count(*)::bigint as n
    from public.user_word_srs s
    join public.chat_members m on m.user_id = s.user_id and m.room_id = p_room
    where s.last_rating = 'known'
      and s.updated_at >= c.starts_at
      and s.updated_at < c.ends_at
    group by s.user_id
  )
  select coalesce(sum(n), 0),
         coalesce(max(n) filter (where user_id = v_uid), 0),
         coalesce(
           (select jsonb_agg(jsonb_build_object('name', t.name, 'n', t.n) order by t.n desc)
            from (
              select coalesce(nullif(trim(p.display_name), ''), 'Сурагч') as name, pu.n
              from per_user pu
              left join public.user_public_profile p on p.user_id = pu.user_id
              order by pu.n desc
              limit 3
            ) t),
           '[]'::jsonb)
    into v_total, v_mine, v_top
  from per_user;

  return jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'target', c.target,
    'starts_at', c.starts_at,
    'ends_at', c.ends_at,
    'total', v_total,
    'mine', v_mine,
    'top', v_top
  );
end;
$$;

revoke all on function public.chat_challenge_status(uuid) from public, anon;
grant execute on function public.chat_challenge_status(uuid) to authenticated;
