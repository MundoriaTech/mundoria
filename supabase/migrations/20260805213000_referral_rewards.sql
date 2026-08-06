-- Referral tracking + personal promo vouchers for invitee/referrer rewards.

begin;

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id) on delete set null;

create index if not exists profiles_referred_by_idx
  on public.profiles(referred_by);

alter table public.promo_codes
  add column if not exists kind text not null default 'standard'
    check (kind in ('standard', 'referral_invite', 'referral_reward')),
  add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists source_referral_id uuid;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referee_id uuid not null references public.profiles(id) on delete cascade,
  referee_promo_code_id uuid references public.promo_codes(id) on delete set null,
  referrer_reward_promo_code_id uuid references public.promo_codes(id) on delete set null,
  qualifying_booking_id uuid references public.bookings(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'qualified', 'rewarded', 'cancelled')),
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  unique (referee_id)
);

create index if not exists referrals_referrer_id_idx on public.referrals(referrer_id);
create index if not exists referrals_status_idx on public.referrals(status);

alter table public.promo_codes
  drop constraint if exists promo_codes_source_referral_id_fkey;

alter table public.promo_codes
  add constraint promo_codes_source_referral_id_fkey
  foreign key (source_referral_id) references public.referrals(id) on delete set null;

alter table public.referrals enable row level security;

drop policy if exists "Users can read own referrals" on public.referrals;
create policy "Users can read own referrals"
on public.referrals for select
to authenticated
using (referrer_id = auth.uid() or referee_id = auth.uid());

drop policy if exists "Users can read owned promo codes" on public.promo_codes;
create policy "Users can read owned promo codes"
on public.promo_codes for select
to authenticated
using (
  owner_user_id = auth.uid()
  or (
    is_active
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until >= now())
    and (max_uses is null or uses_count < max_uses)
  )
);

grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;

commit;
