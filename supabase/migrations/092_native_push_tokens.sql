-- 092: Store-ын апп (Android/iOS)-ын жинхэнэ мэдэгдлийн token хадгалах.
-- Хөтчийн мэдэгдэл (push_subscriptions, 076) хэвээр; энэ нь апп доторх хэрэглэгчдэд.
-- Дахин ажиллуулахад аюулгүй.

create table if not exists public.native_push_tokens (
  token text primary key,
  user_id uuid not null,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now()
);

create index if not exists native_push_tokens_user_idx
  on public.native_push_tokens (user_id);

alter table public.native_push_tokens enable row level security;

drop policy if exists "native_push_tokens_own" on public.native_push_tokens;
create policy "native_push_tokens_own"
  on public.native_push_tokens for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Нэг утсанд өөр хүн нэвтэрвэл token шинэ хэрэглэгч рүү шилжинэ.
create or replace function public.register_native_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_platform not in ('android', 'ios') or length(coalesce(p_token, '')) < 20 then
    raise exception 'Bad token';
  end if;
  insert into public.native_push_tokens (token, user_id, platform)
  values (p_token, auth.uid(), p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

revoke all on function public.register_native_push_token(text, text) from public, anon;
grant execute on function public.register_native_push_token(text, text) to authenticated;
