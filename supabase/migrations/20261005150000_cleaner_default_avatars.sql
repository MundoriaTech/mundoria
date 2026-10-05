-- Mundoria character drawings, and the default look for a new cleaner.

create table if not exists public.mundoria_avatars (
  id text primary key,
  character text not null check (character in ('woman', 'man')),
  kind text not null check (kind in ('profile', 'figure', 'offer', 'visit', 'streak', 'clear')),
  src text not null,
  unique (character, kind)
);

alter table public.mundoria_avatars enable row level security;

drop policy if exists "Anyone can read Mundoria avatars" on public.mundoria_avatars;
create policy "Anyone can read Mundoria avatars"
on public.mundoria_avatars
for select
to anon, authenticated
using (true);

grant select on public.mundoria_avatars to anon, authenticated;

insert into public.mundoria_avatars (id, character, kind, src)
values
  ('woman-profile', 'woman', 'profile', '/images/avatars/mundoria-woman-profile.png'),
  ('woman-figure', 'woman', 'figure', '/images/avatars/mundoria-woman.png'),
  ('woman-offer', 'woman', 'offer', '/images/avatars/mundoria-woman-offer.png'),
  ('woman-visit', 'woman', 'visit', '/images/avatars/mundoria-woman-walk.png'),
  ('woman-streak', 'woman', 'streak', '/images/avatars/mundoria-woman-streak.png'),
  ('woman-clear', 'woman', 'clear', '/images/avatars/mundoria-woman-wave.png'),
  ('man-profile', 'man', 'profile', '/images/avatars/mundoria-man-profile.png'),
  ('man-figure', 'man', 'figure', '/images/avatars/mundoria-man.png'),
  ('man-offer', 'man', 'offer', '/images/avatars/mundoria-man-offer.png'),
  ('man-visit', 'man', 'visit', '/images/avatars/mundoria-man-walk.png'),
  ('man-streak', 'man', 'streak', '/images/avatars/mundoria-man-streak.png'),
  ('man-clear', 'man', 'clear', '/images/avatars/mundoria-man-wave.png')
on conflict (id) do update
set character = excluded.character,
    kind = excluded.kind,
    src = excluded.src;

alter table public.cleaner_profiles
  add column if not exists gender text;

alter table public.cleaner_profiles
  drop constraint if exists cleaner_profiles_gender_check;

alter table public.cleaner_profiles
  add constraint cleaner_profiles_gender_check
  check (gender is null or gender in ('woman', 'man'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.user_role;
  requested_gender text;
  chosen_avatar text;
begin
  requested_role := case new.raw_user_meta_data ->> 'role'
    when 'cleaner' then 'cleaner'::public.user_role
    else 'customer'::public.user_role
  end;

  requested_gender := new.raw_user_meta_data ->> 'gender';
  if requested_gender not in ('woman', 'man') then
    requested_gender := null;
  end if;

  chosen_avatar := nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '');
  if requested_role = 'cleaner'::public.user_role and requested_gender is not null then
    select src into chosen_avatar
    from public.mundoria_avatars
    where character = requested_gender
      and kind = 'profile';
  end if;

  insert into public.profiles (id, full_name, email, phone, role, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Mundoria user'
    ),
    coalesce(new.email, new.id::text || '@pending.local'),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    requested_role,
    chosen_avatar
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role,
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  if requested_role = 'cleaner'::public.user_role then
    insert into public.cleaner_profiles (id, gender)
    values (new.id, requested_gender)
    on conflict (id) do update
    set gender = coalesce(public.cleaner_profiles.gender, excluded.gender);
  end if;

  return new;
end;
$$;
