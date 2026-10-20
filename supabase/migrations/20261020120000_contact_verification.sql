-- Contact change: sync auth email → profiles; cleaner phone verification.

alter table public.profiles
  add column if not exists phone_verified_at timestamptz;

comment on column public.profiles.phone_verified_at is
  'When the current profiles.phone was verified by SMS OTP (cleaners).';

-- Existing cleaners with a phone keep working; new edits require re-verify.
update public.profiles
set phone_verified_at = coalesce(phone_verified_at, now())
where role = 'cleaner'
  and nullif(trim(phone), '') is not null
  and phone_verified_at is null;

create table if not exists public.phone_verification_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists phone_verification_challenges_user_idx
  on public.phone_verification_challenges (user_id, created_at desc);

alter table public.phone_verification_challenges enable row level security;

-- Only service role / APIs touch challenges (no direct client access).
revoke all on public.phone_verification_challenges from anon, authenticated;

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.profiles
    set email = new.email,
        updated_at = timezone('utc', now())
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email_from_auth();

-- Clients may clear verification when changing phone; only service role may set it.
create or replace function public.guard_phone_verified_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phone_verified_at is distinct from old.phone_verified_at then
    if new.phone_verified_at is not null
      and coalesce(auth.role(), '') <> 'service_role' then
      raise exception 'phone_verified_at can only be set by Mundoria verification';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_phone_verified_at on public.profiles;
create trigger profiles_guard_phone_verified_at
  before update of phone_verified_at on public.profiles
  for each row
  execute function public.guard_phone_verified_at();
