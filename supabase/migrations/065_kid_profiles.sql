-- 065: Хүүхдийн бүртгэл (имэйлгүй сурагч) — эцэг эх эсвэл ангийн багш үүсгэнэ.
-- Ажиллуулах: Supabase SQL editor (дахин ажиллуулахад аюулгүй).
--
-- Урсгал:
--   1. Эцэг эх (/family) эсвэл багш (ангийн хуудас) хүүхдийн нэр, avatar, 4 оронтой PIN оруулна.
--   2. Server route (/api/kids/create, SUPABASE_SERVICE_ROLE_KEY) жинхэнэ Supabase auth хэрэглэгч
--      үүсгэнэ: имэйл нь зохиомол `kid-<uuid>@kids.buunduu.mn` (имэйл хэзээ ч очихгүй), нууц үг нь
--      HMAC-SHA256(KIDS_PASSWORD_SECRET, child_user_id) — хаана ч хадгалагдахгүй, server дээр л гаргана.
--      Ингэснээр бүх ахицын хүснэгт (auth.uid()-аар түлхүүрлэсэн) өөрчлөлтгүй ажиллана.
--   3. Энд kid_profiles мөр оруулна: pin_hash = sha256(child_user_id || pin). Ангийн код өгвөл
--      classroom_students-д шууд идэвхтэй сурагчаар нэмнэ.
--   4. Хүүхэд утсан дээр /kids → avatar дээрээ дараад PIN оруулна → /api/kids/login нь асран
--      хамгаалагч (эсвэл ангийн багш) нэвтэрсэн эсэх + PIN-г шалгаад хүүхдийн session token буцаана.
--
-- Мөр оруулах нь ЗӨВХӨН server (service role)-оор — authenticated-д insert policy байхгүй.

create table if not exists public.kid_profiles (
  child_user_id uuid primary key references auth.users(id) on delete cascade,
  guardian_user_id uuid not null,
  display_name text not null,
  avatar text not null default '🐼',
  pin_hash text not null,
  birth_year int,
  classroom_id uuid references public.classrooms(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kid_profiles_guardian_user_id_idx
  on public.kid_profiles (guardian_user_id);

create index if not exists kid_profiles_classroom_id_idx
  on public.kid_profiles (classroom_id);

drop trigger if exists kid_profiles_updated_at on public.kid_profiles;
create trigger kid_profiles_updated_at
  before update on public.kid_profiles
  for each row
  execute function public.update_updated_at_column();

alter table public.kid_profiles enable row level security;

-- Асран хамгаалагч өөрийн хүүхдүүдээ харна
drop policy if exists "kid_profiles_guardian_select" on public.kid_profiles;
create policy "kid_profiles_guardian_select"
  on public.kid_profiles for select to authenticated
  using (guardian_user_id = auth.uid());

-- Ангийн багш өөрийн ангийн хүүхдүүдийг харна
drop policy if exists "kid_profiles_teacher_select" on public.kid_profiles;
create policy "kid_profiles_teacher_select"
  on public.kid_profiles for select to authenticated
  using (classroom_id is not null and public.can_manage_org_classroom(classroom_id));

drop policy if exists "kid_profiles_guardian_update" on public.kid_profiles;
create policy "kid_profiles_guardian_update"
  on public.kid_profiles for update to authenticated
  using (guardian_user_id = auth.uid())
  with check (guardian_user_id = auth.uid());

drop policy if exists "kid_profiles_guardian_delete" on public.kid_profiles;
create policy "kid_profiles_guardian_delete"
  on public.kid_profiles for delete to authenticated
  using (guardian_user_id = auth.uid());

-- pin_hash-г client (anon/authenticated)-д огт буцаахгүй: 4 оронтой PIN-ий hash-г
-- хялбар тайлж болох тул баганын түвшинд хаана. App нь service role-оор уншдаг.
revoke select on public.kid_profiles from anon, authenticated;
grant select (
  child_user_id, guardian_user_id, display_name, avatar, birth_year,
  classroom_id, created_at, updated_at
) on public.kid_profiles to authenticated;

-- Дараа нь тайлангийн RLS-д: нэвтэрсэн хэрэглэгч энэ хүүхдийн асран хамгаалагч мөн эсэх
create or replace function public.is_guardian_of(child uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.kid_profiles k
    where k.child_user_id = child
      and k.guardian_user_id = auth.uid()
  );
$$;

grant execute on function public.is_guardian_of(uuid) to authenticated;
