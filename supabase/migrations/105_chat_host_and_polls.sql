-- 105: Чатын хөтлөгч («Балдан ах») + санал асуулга.
-- 103-ын ДАРАА. Дахин ажиллуулахад аюулгүй.
--
-- 1) Аппын эзэн (admin_profiles: role = 'owner', байхгүй бол хамгийн анхны админ)-ийг
--    түвшний 6 чатад «хөтлөгч» (role = 'owner') болгож нэмнэ, чатын нэрийг «Балдан ах» болгоно.
-- 2) chat_poll_votes — санал асуулгын хариу (нэг хүн нэг асуулгад нэг санал, сольж болно).

do $$
declare
  v_host uuid;
begin
  select a.user_id into v_host
  from public.admin_profiles a
  order by (a.role = 'owner') desc, a.created_at asc
  limit 1;

  if v_host is null then
    raise notice '105: админ олдсонгүй — хөтлөгч тохируулаагүй';
    return;
  end if;

  insert into public.chat_members (room_id, user_id, role)
  select r.id, v_host, 'owner'
  from public.chat_rooms r
  where r.kind = 'level'
  on conflict (room_id, user_id) do update set role = 'owner';

  insert into public.user_public_profile (user_id, display_name)
  values (v_host, 'Балдан ах')
  on conflict (user_id) do update set display_name = 'Балдан ах', updated_at = now();

  raise notice '105: хөтлөгч % — түвшний чатуудад нэмэгдлээ', v_host;
end $$;

create table if not exists public.chat_poll_votes (
  message_id bigint not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  option_idx int not null check (option_idx between 0 and 9),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.chat_poll_votes enable row level security;

drop policy if exists chat_poll_votes_select on public.chat_poll_votes;
create policy chat_poll_votes_select on public.chat_poll_votes
  for select to authenticated
  using (
    exists (
      select 1 from public.chat_messages m
      where m.id = chat_poll_votes.message_id
        and public.chat_is_member(m.room_id, (select auth.uid()))
    )
  );

drop policy if exists chat_poll_votes_insert on public.chat_poll_votes;
create policy chat_poll_votes_insert on public.chat_poll_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not public.chat_is_banned((select auth.uid()))
    and exists (
      select 1 from public.chat_messages m
      where m.id = chat_poll_votes.message_id
        and public.chat_is_member(m.room_id, (select auth.uid()))
    )
  );

drop policy if exists chat_poll_votes_update on public.chat_poll_votes;
create policy chat_poll_votes_update on public.chat_poll_votes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.chat_poll_votes to authenticated;
