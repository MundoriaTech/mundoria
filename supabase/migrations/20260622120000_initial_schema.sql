-- CleanScape initial database schema
-- Run this file in the Supabase SQL editor, or apply it with the Supabase CLI.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('customer', 'cleaner', 'admin');
create type public.property_type as enum ('house', 'flat', 'office', 'other');
create type public.cleaner_tier as enum ('bronze', 'silver', 'gold', 'elite');
create type public.cleaner_status as enum ('pending', 'active', 'suspended', 'removed');
create type public.payout_preference as enum ('weekly', 'monthly');
create type public.service_type as enum (
  'regular',
  'one_off',
  'deep_clean',
  'end_of_tenancy',
  'airbnb_turnover',
  'post_construction'
);
create type public.booking_status as enum (
  'pending_match',
  'matched',
  'confirmed',
  'cleaner_en_route',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
);
create type public.recurrence_pattern as enum ('weekly', 'fortnightly', 'monthly');
create type public.payment_status as enum ('unpaid', 'held', 'released', 'refunded');
create type public.dispute_type as enum ('damage', 'no_show', 'quality', 'payment', 'other');
create type public.dispute_status as enum ('open', 'under_review', 'resolved', 'closed');
create type public.payout_status as enum ('pending', 'processing', 'paid', 'failed');
create type public.discount_type as enum ('percentage', 'fixed');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) > 0),
  email text not null unique check (char_length(trim(email)) > 0),
  phone text,
  role public.user_role not null,
  avatar_url text,
  onesignal_player_id text,
  stripe_customer_id text unique,
  stripe_account_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  postcode text not null,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  is_default boolean not null default false,
  property_type public.property_type,
  num_bedrooms integer check (num_bedrooms >= 0),
  num_bathrooms integer check (num_bathrooms >= 0),
  special_requirements text,
  created_at timestamptz not null default now(),
  unique (id, customer_id)
);

create table public.cleaner_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  years_experience integer check (years_experience >= 0),
  tier public.cleaner_tier not null default 'bronze',
  performance_score numeric(5, 2) not null default 0
    check (performance_score between 0 and 100),
  rating numeric(3, 2) not null default 0 check (rating between 0 and 5),
  total_jobs integer not null default 0 check (total_jobs >= 0),
  acceptance_rate numeric(5, 2) not null default 100
    check (acceptance_rate between 0 and 100),
  on_time_rate numeric(5, 2) not null default 100
    check (on_time_rate between 0 and 100),
  cancellation_count integer not null default 0 check (cancellation_count >= 0),
  no_show_count integer not null default 0 check (no_show_count >= 0),
  dbs_verified boolean not null default false,
  dbs_document_url text,
  id_verified boolean not null default false,
  id_document_url text,
  references_verified boolean not null default false,
  onboarding_complete boolean not null default false,
  status public.cleaner_status not null default 'pending',
  payout_preference public.payout_preference not null default 'weekly',
  working_radius_km integer not null default 10 check (working_radius_km > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cleaner_services (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  service_type public.service_type not null,
  is_active boolean not null default true,
  unique (cleaner_id, service_type)
);

create table public.cleaner_availability (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  check (end_time > start_time),
  unique (cleaner_id, day_of_week, start_time, end_time)
);

create table public.cleaner_working_areas (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  postcode_prefix text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  check (
    postcode_prefix is not null
    or (latitude is not null and longitude is not null)
  )
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  cleaner_id uuid references public.profiles(id) on delete set null,
  address_id uuid not null,
  service_type public.service_type not null,
  status public.booking_status not null default 'pending_match',
  scheduled_date date not null,
  scheduled_start_time time not null,
  estimated_duration_hours numeric(5, 2) check (estimated_duration_hours > 0),
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  checkin_latitude numeric(9, 6) check (checkin_latitude between -90 and 90),
  checkin_longitude numeric(9, 6) check (checkin_longitude between -180 and 180),
  checkout_latitude numeric(9, 6) check (checkout_latitude between -90 and 90),
  checkout_longitude numeric(9, 6) check (checkout_longitude between -180 and 180),
  checkin_verified boolean not null default false,
  checkout_verified boolean not null default false,
  is_recurring boolean not null default false,
  recurrence_pattern public.recurrence_pattern,
  parent_booking_id uuid references public.bookings(id) on delete set null,
  preferred_cleaner_id uuid references public.profiles(id) on delete set null,
  special_instructions text,
  cancellation_reason text,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancelled_at timestamptz,
  stripe_payment_intent_id text unique,
  amount_total numeric(12, 0) check (amount_total >= 0),
  amount_cleaner numeric(12, 0) check (amount_cleaner >= 0),
  amount_platform numeric(12, 0) check (amount_platform >= 0),
  payment_status public.payment_status not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (actual_end_time is null or actual_start_time is null or actual_end_time >= actual_start_time),
  check (
    (is_recurring and recurrence_pattern is not null)
    or (not is_recurring and recurrence_pattern is null)
  ),
  check (
    amount_total is null
    or amount_cleaner is null
    or amount_platform is null
    or amount_total = amount_cleaner + amount_platform
  ),
  foreign key (address_id, customer_id)
    references public.addresses(id, customer_id)
    on delete restrict
);

create table public.booking_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete restrict,
  photo_url text not null,
  area_label text,
  uploaded_at timestamptz not null default now()
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  cleaner_id uuid not null references public.profiles(id) on delete restrict,
  overall_score numeric(3, 2) not null check (overall_score between 1 and 5),
  room_ratings jsonb not null default '{}'::jsonb
    check (jsonb_typeof(room_ratings) = 'object'),
  comment text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  receiver_id uuid not null references public.profiles(id) on delete restrict,
  content text not null check (char_length(trim(content)) > 0),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  raised_by uuid not null references public.profiles(id) on delete restrict,
  type public.dispute_type not null,
  description text not null check (char_length(trim(description)) > 0),
  evidence_urls text[] not null default '{}',
  status public.dispute_status not null default 'open',
  resolution_notes text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.performance_history (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  rating_score numeric(5, 2) check (rating_score between 0 and 100),
  on_time_score numeric(5, 2) check (on_time_score between 0 and 100),
  acceptance_score numeric(5, 2) check (acceptance_score between 0 and 100),
  cancellation_score numeric(5, 2) check (cancellation_score between 0 and 100),
  total_score numeric(5, 2) check (total_score between 0 and 100),
  tier_before public.cleaner_tier,
  tier_after public.cleaner_tier,
  jobs_completed integer check (jobs_completed >= 0),
  created_at timestamptz not null default now(),
  unique (cleaner_id, month)
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.profiles(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  total_jobs integer not null default 0 check (total_jobs >= 0),
  gross_amount numeric(12, 0) not null default 0 check (gross_amount >= 0),
  net_amount numeric(12, 0) not null default 0 check (net_amount >= 0),
  stripe_transfer_id text unique,
  status public.payout_status not null default 'pending',
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (net_amount <= gross_amount)
);

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(trim(code))),
  discount_type public.discount_type not null,
  discount_value numeric(12, 2) not null check (discount_value > 0),
  max_uses integer check (max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (max_uses is null or uses_count <= max_uses),
  check (valid_until is null or valid_from is null or valid_until > valid_from),
  check (discount_type <> 'percentage' or discount_value <= 100)
);

create table public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  postcode_prefixes text[] not null default '{}',
  is_active boolean not null default true,
  launch_date date,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object'),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index bookings_customer_id_idx on public.bookings(customer_id);
create index bookings_cleaner_id_idx on public.bookings(cleaner_id);
create index bookings_status_idx on public.bookings(status);
create index bookings_scheduled_date_idx on public.bookings(scheduled_date);
create index messages_booking_id_idx on public.messages(booking_id);
create index messages_sender_id_idx on public.messages(sender_id);
create index ratings_cleaner_id_idx on public.ratings(cleaner_id);
-- ratings.booking_id is already indexed by its unique constraint.
create index cleaner_profiles_tier_idx on public.cleaner_profiles(tier);
create index cleaner_profiles_status_idx on public.cleaner_profiles(status);

create unique index addresses_one_default_per_customer_idx
  on public.addresses(customer_id)
  where is_default;
create unique index cleaner_working_areas_postcode_idx
  on public.cleaner_working_areas(cleaner_id, upper(postcode_prefix))
  where postcode_prefix is not null;
create index booking_photos_booking_id_idx on public.booking_photos(booking_id);
create index disputes_booking_id_idx on public.disputes(booking_id);
create index notifications_user_id_created_at_idx
  on public.notifications(user_id, created_at desc);
create index payouts_cleaner_id_idx on public.payouts(cleaner_id);

-- ---------------------------------------------------------------------------
-- Shared trigger functions
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger cleaner_profiles_set_updated_at
before update on public.cleaner_profiles
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- Prevent authenticated clients from changing server-controlled booking data.
-- Trusted service-role operations are intentionally unaffected.
create function public.protect_booking_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.role() <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.cleaner_id := null;
    new.status := 'pending_match'::public.booking_status;
    new.actual_start_time := null;
    new.actual_end_time := null;
    new.checkin_latitude := null;
    new.checkin_longitude := null;
    new.checkout_latitude := null;
    new.checkout_longitude := null;
    new.checkin_verified := false;
    new.checkout_verified := false;
    new.cancelled_by := null;
    new.cancelled_at := null;
    new.stripe_payment_intent_id := null;
    new.amount_total := null;
    new.amount_cleaner := null;
    new.amount_platform := null;
    new.payment_status := 'unpaid'::public.payment_status;
    return new;
  end if;

  if old.customer_id = auth.uid() then
    if new.customer_id is distinct from old.customer_id
      or new.cleaner_id is distinct from old.cleaner_id
      or new.actual_start_time is distinct from old.actual_start_time
      or new.actual_end_time is distinct from old.actual_end_time
      or new.checkin_latitude is distinct from old.checkin_latitude
      or new.checkin_longitude is distinct from old.checkin_longitude
      or new.checkout_latitude is distinct from old.checkout_latitude
      or new.checkout_longitude is distinct from old.checkout_longitude
      or new.checkin_verified is distinct from old.checkin_verified
      or new.checkout_verified is distinct from old.checkout_verified
      or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
      or new.amount_total is distinct from old.amount_total
      or new.amount_cleaner is distinct from old.amount_cleaner
      or new.amount_platform is distinct from old.amount_platform
      or new.payment_status is distinct from old.payment_status
      or (
        new.status is not distinct from old.status
        and (
          new.cancelled_by is distinct from old.cancelled_by
          or new.cancelled_at is distinct from old.cancelled_at
        )
      )
    then
      raise exception 'Customers cannot update server-controlled booking fields'
        using errcode = '42501';
    end if;

    if new.status is distinct from old.status then
      if new.status <> 'cancelled'::public.booking_status
        or old.status not in (
          'pending_match'::public.booking_status,
          'matched'::public.booking_status,
          'confirmed'::public.booking_status
        )
      then
        raise exception 'Invalid customer booking status transition'
          using errcode = '42501';
      end if;

      new.cancelled_by := auth.uid();
      new.cancelled_at := coalesce(new.cancelled_at, now());
    end if;

    return new;
  end if;

  if old.cleaner_id = auth.uid() then
    if new.customer_id is distinct from old.customer_id
      or new.cleaner_id is distinct from old.cleaner_id
      or new.address_id is distinct from old.address_id
      or new.service_type is distinct from old.service_type
      or new.scheduled_date is distinct from old.scheduled_date
      or new.scheduled_start_time is distinct from old.scheduled_start_time
      or new.estimated_duration_hours is distinct from old.estimated_duration_hours
      or new.is_recurring is distinct from old.is_recurring
      or new.recurrence_pattern is distinct from old.recurrence_pattern
      or new.parent_booking_id is distinct from old.parent_booking_id
      or new.preferred_cleaner_id is distinct from old.preferred_cleaner_id
      or new.special_instructions is distinct from old.special_instructions
      or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
      or new.amount_total is distinct from old.amount_total
      or new.amount_cleaner is distinct from old.amount_cleaner
      or new.amount_platform is distinct from old.amount_platform
      or new.payment_status is distinct from old.payment_status
      or (
        new.status is not distinct from old.status
        and (
          new.cancelled_by is distinct from old.cancelled_by
          or new.cancelled_at is distinct from old.cancelled_at
        )
      )
    then
      raise exception 'Cleaners cannot update customer or payment booking fields'
        using errcode = '42501';
    end if;

    if new.status is distinct from old.status and not (
      (old.status = 'matched' and new.status = 'confirmed')
      or (old.status = 'confirmed' and new.status = 'cleaner_en_route')
      or (old.status = 'cleaner_en_route' and new.status = 'in_progress')
      or (old.status = 'in_progress' and new.status = 'completed')
      or (
        old.status in ('matched', 'confirmed', 'cleaner_en_route')
        and new.status = 'cancelled'
      )
    ) then
      raise exception 'Invalid cleaner booking status transition'
        using errcode = '42501';
    end if;

    if new.status = 'cancelled' and new.status is distinct from old.status then
      new.cancelled_by := auth.uid();
      new.cancelled_at := coalesce(new.cancelled_at, now());
    end if;

    return new;
  end if;

  raise exception 'User is not a booking participant'
    using errcode = '42501';
end;
$$;

create trigger bookings_protect_authenticated_writes
before insert or update on public.bookings
for each row execute function public.protect_booking_write();

create function public.calculate_rating_score()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.room_ratings <> '{}'::jsonb then
    if exists (
      select 1
      from jsonb_each(new.room_ratings) as room
      where jsonb_typeof(room.value) <> 'number'
        or (room.value #>> '{}')::numeric not between 1 and 5
    ) then
      raise exception 'Every room rating must be a number between 1 and 5'
        using errcode = '22023';
    end if;

    select round(avg((room.value #>> '{}')::numeric), 2)
    into new.overall_score
    from jsonb_each(new.room_ratings) as room;
  end if;

  return new;
end;
$$;

create trigger ratings_calculate_overall_score
before insert or update on public.ratings
for each row execute function public.calculate_rating_score();

create function public.calculate_performance_score()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.total_score := round(
    coalesce(new.rating_score, 0) * 0.50
    + coalesce(new.on_time_score, 0) * 0.20
    + coalesce(new.acceptance_score, 0) * 0.15
    + coalesce(new.cancellation_score, 0) * 0.15,
    2
  );
  return new;
end;
$$;

create trigger performance_history_calculate_total
before insert or update of
  rating_score,
  on_time_score,
  acceptance_score,
  cancellation_score
on public.performance_history
for each row execute function public.calculate_performance_score();

-- Creates a customer profile for ordinary signups. Cleaner/admin roles should
-- be assigned by a trusted server using the service role key.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'CleanScape user'
    ),
    coalesce(new.email, new.id::text || '@pending.local'),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    'customer'::public.user_role,
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.set_updated_at() from public;
revoke all on function public.protect_booking_write() from public;
revoke all on function public.calculate_rating_score() from public;
revoke all on function public.calculate_performance_score() from public;
revoke all on function public.handle_new_user() from public;

-- ---------------------------------------------------------------------------
-- RLS helper functions
-- SECURITY DEFINER prevents policy recursion while each function exposes only
-- a boolean authorization decision.
-- ---------------------------------------------------------------------------

create function public.has_role(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = required_role
  );
$$;

create function public.is_booking_participant(target_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = target_booking_id
      and auth.uid() in (b.customer_id, b.cleaner_id)
  );
$$;

create function public.is_booking_customer(
  target_booking_id uuid,
  target_customer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = target_booking_id
      and b.customer_id = target_customer_id
      and b.customer_id = auth.uid()
  );
$$;

create function public.is_assigned_booking_cleaner(
  target_booking_id uuid,
  target_cleaner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = target_booking_id
      and b.cleaner_id = target_cleaner_id
      and b.cleaner_id = auth.uid()
  );
$$;

create function public.is_matched_cleaner(target_cleaner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    where b.customer_id = auth.uid()
      and b.cleaner_id = target_cleaner_id
      and b.status in (
        'matched'::public.booking_status,
        'confirmed'::public.booking_status,
        'cleaner_en_route'::public.booking_status,
        'in_progress'::public.booking_status,
        'completed'::public.booking_status,
        'disputed'::public.booking_status
      )
  );
$$;

create function public.booking_matches_rating(
  target_booking_id uuid,
  target_customer_id uuid,
  target_cleaner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = target_booking_id
      and b.customer_id = target_customer_id
      and b.cleaner_id = target_cleaner_id
      and b.customer_id = auth.uid()
      and b.status in (
        'completed'::public.booking_status,
        'disputed'::public.booking_status
      )
  );
$$;

revoke all on function public.has_role(public.user_role) from public;
revoke all on function public.is_booking_participant(uuid) from public;
revoke all on function public.is_booking_customer(uuid, uuid) from public;
revoke all on function public.is_assigned_booking_cleaner(uuid, uuid) from public;
revoke all on function public.is_matched_cleaner(uuid) from public;
revoke all on function public.booking_matches_rating(uuid, uuid, uuid) from public;
grant execute on function public.has_role(public.user_role) to authenticated;
grant execute on function public.is_booking_participant(uuid) to authenticated;
grant execute on function public.is_booking_customer(uuid, uuid) to authenticated;
grant execute on function public.is_assigned_booking_cleaner(uuid, uuid) to authenticated;
grant execute on function public.is_matched_cleaner(uuid) to authenticated;
grant execute on function public.booking_matches_rating(uuid, uuid, uuid) to authenticated;

-- RLS cannot hide selected columns from an otherwise-visible row. This view
-- intentionally exposes only a matched cleaner's public profile fields.
create view public.cleaner_public_profiles
with (security_barrier = true)
as
select
  p.id,
  p.full_name,
  p.avatar_url,
  cp.bio,
  cp.tier,
  cp.rating,
  cp.total_jobs,
  cp.years_experience
from public.profiles p
join public.cleaner_profiles cp on cp.id = p.id
where p.role = 'cleaner'
  and public.is_matched_cleaner(p.id);

revoke all on public.cleaner_public_profiles from anon;
grant select on public.cleaner_public_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- The service_role key bypasses RLS and is reserved for trusted admin routes.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.cleaner_profiles enable row level security;
alter table public.cleaner_services enable row level security;
alter table public.cleaner_availability enable row level security;
alter table public.cleaner_working_areas enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_photos enable row level security;
alter table public.ratings enable row level security;
alter table public.messages enable row level security;
alter table public.disputes enable row level security;
alter table public.performance_history enable row level security;
alter table public.payouts enable row level security;
alter table public.promo_codes enable row level security;
alter table public.zones enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Addresses
create policy "Customers can read own addresses"
on public.addresses for select
to authenticated
using (
  customer_id = auth.uid()
  and public.has_role('customer'::public.user_role)
);

create policy "Customers can create own addresses"
on public.addresses for insert
to authenticated
with check (
  customer_id = auth.uid()
  and public.has_role('customer'::public.user_role)
);

create policy "Customers can update own addresses"
on public.addresses for update
to authenticated
using (
  customer_id = auth.uid()
  and public.has_role('customer'::public.user_role)
)
with check (
  customer_id = auth.uid()
  and public.has_role('customer'::public.user_role)
);

create policy "Customers can delete own addresses"
on public.addresses for delete
to authenticated
using (
  customer_id = auth.uid()
  and public.has_role('customer'::public.user_role)
);

-- Cleaner-owned configuration
create policy "Cleaners can read own cleaner profile"
on public.cleaner_profiles for select
to authenticated
using (id = auth.uid());

create policy "Cleaners can create own cleaner profile"
on public.cleaner_profiles for insert
to authenticated
with check (
  id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
);

create policy "Cleaners can update own cleaner profile"
on public.cleaner_profiles for update
to authenticated
using (
  id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
)
with check (
  id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
);

create policy "Cleaners manage own services"
on public.cleaner_services for all
to authenticated
using (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
)
with check (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
);

create policy "Cleaners manage own availability"
on public.cleaner_availability for all
to authenticated
using (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
)
with check (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
);

create policy "Cleaners manage own working areas"
on public.cleaner_working_areas for all
to authenticated
using (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
)
with check (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
);

-- Bookings
create policy "Participants can read bookings"
on public.bookings for select
to authenticated
using (auth.uid() in (customer_id, cleaner_id));

create policy "Customers can create own bookings"
on public.bookings for insert
to authenticated
with check (
  customer_id = auth.uid()
  and public.has_role('customer'::public.user_role)
  and cleaner_id is null
  and status = 'pending_match'
  and payment_status = 'unpaid'
);

create policy "Customers can update own bookings"
on public.bookings for update
to authenticated
using (
  customer_id = auth.uid()
  and public.has_role('customer'::public.user_role)
)
with check (
  customer_id = auth.uid()
  and public.has_role('customer'::public.user_role)
);

create policy "Customers can delete pending own bookings"
on public.bookings for delete
to authenticated
using (
  customer_id = auth.uid()
  and public.has_role('customer'::public.user_role)
  and status = 'pending_match'
);

create policy "Assigned cleaners can update bookings"
on public.bookings for update
to authenticated
using (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
)
with check (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
);

-- Booking photos
create policy "Participants can read booking photos"
on public.booking_photos for select
to authenticated
using (public.is_booking_participant(booking_id));

create policy "Assigned cleaners can upload booking photos"
on public.booking_photos for insert
to authenticated
with check (
  cleaner_id = auth.uid()
  and public.is_assigned_booking_cleaner(booking_id, cleaner_id)
);

create policy "Cleaners can update own booking photos"
on public.booking_photos for update
to authenticated
using (
  cleaner_id = auth.uid()
  and public.is_assigned_booking_cleaner(booking_id, cleaner_id)
)
with check (
  cleaner_id = auth.uid()
  and public.is_assigned_booking_cleaner(booking_id, cleaner_id)
);

create policy "Cleaners can delete own booking photos"
on public.booking_photos for delete
to authenticated
using (
  cleaner_id = auth.uid()
  and public.is_assigned_booking_cleaner(booking_id, cleaner_id)
);

-- Ratings
create policy "Booking participants can read ratings"
on public.ratings for select
to authenticated
using (auth.uid() in (customer_id, cleaner_id));

create policy "Customers can create booking ratings"
on public.ratings for insert
to authenticated
with check (
  customer_id = auth.uid()
  and public.booking_matches_rating(booking_id, customer_id, cleaner_id)
);

create policy "Customers can update own ratings"
on public.ratings for update
to authenticated
using (customer_id = auth.uid())
with check (
  customer_id = auth.uid()
  and public.booking_matches_rating(booking_id, customer_id, cleaner_id)
);

create policy "Customers can delete own ratings"
on public.ratings for delete
to authenticated
using (customer_id = auth.uid());

-- Messages
create policy "Senders and receivers can read messages"
on public.messages for select
to authenticated
using (auth.uid() in (sender_id, receiver_id));

create policy "Booking participants can send messages"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_booking_participant(booking_id)
  and exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and receiver_id in (b.customer_id, b.cleaner_id)
  )
);

create policy "Receivers can mark messages read"
on public.messages for update
to authenticated
using (receiver_id = auth.uid())
with check (receiver_id = auth.uid());

create policy "Senders can delete own messages"
on public.messages for delete
to authenticated
using (sender_id = auth.uid());

-- Disputes
create policy "Booking participants can read disputes"
on public.disputes for select
to authenticated
using (public.is_booking_participant(booking_id));

create policy "Booking participants can raise disputes"
on public.disputes for insert
to authenticated
with check (
  raised_by = auth.uid()
  and public.is_booking_participant(booking_id)
);

create policy "Users can update own open disputes"
on public.disputes for update
to authenticated
using (raised_by = auth.uid() and status = 'open')
with check (raised_by = auth.uid());

-- Performance and payouts are generated by trusted server/admin jobs.
create policy "Cleaners can read own performance history"
on public.performance_history for select
to authenticated
using (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
);

create policy "Cleaners can read own payouts"
on public.payouts for select
to authenticated
using (
  cleaner_id = auth.uid()
  and public.has_role('cleaner'::public.user_role)
);

-- Active marketing/service configuration is readable by signed-in users.
create policy "Authenticated users can read valid promo codes"
on public.promo_codes for select
to authenticated
using (
  is_active
  and (valid_from is null or valid_from <= now())
  and (valid_until is null or valid_until >= now())
  and (max_uses is null or uses_count < max_uses)
);

create policy "Authenticated users can read active zones"
on public.zones for select
to authenticated
using (is_active and (launch_date is null or launch_date <= current_date));

-- Notifications
create policy "Users can read own notifications"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy "Users can update own notifications"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own notifications"
on public.notifications for delete
to authenticated
using (user_id = auth.uid());

-- Explicit privileges. RLS still controls every authenticated operation.
revoke all on all tables in schema public from anon;

grant usage on schema public to authenticated, service_role;
grant usage on type
  public.user_role,
  public.property_type,
  public.cleaner_tier,
  public.cleaner_status,
  public.payout_preference,
  public.service_type,
  public.booking_status,
  public.recurrence_pattern,
  public.payment_status,
  public.dispute_type,
  public.dispute_status,
  public.payout_status,
  public.discount_type
to authenticated, service_role;
grant select on public.profiles to authenticated;
grant update (
  full_name,
  email,
  phone,
  avatar_url,
  onesignal_player_id
) on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.cleaner_profiles to authenticated;
grant insert (
  id,
  bio,
  years_experience,
  payout_preference,
  working_radius_km
) on public.cleaner_profiles to authenticated;
grant update (
  bio,
  years_experience,
  payout_preference,
  working_radius_km
) on public.cleaner_profiles to authenticated;
grant select, insert, update, delete on public.cleaner_services to authenticated;
grant select, insert, update, delete on public.cleaner_availability to authenticated;
grant select, insert, update, delete on public.cleaner_working_areas to authenticated;
grant select, insert, update, delete on public.bookings to authenticated;
grant select, insert, update, delete on public.booking_photos to authenticated;
grant select, insert, update, delete on public.ratings to authenticated;
grant select, insert, delete on public.messages to authenticated;
grant update (is_read) on public.messages to authenticated;
grant select, insert on public.disputes to authenticated;
grant update (description, evidence_urls) on public.disputes to authenticated;
grant select on public.performance_history to authenticated;
grant select on public.payouts to authenticated;
grant select on public.promo_codes to authenticated;
grant select on public.zones to authenticated;
grant select, delete on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

grant all on all tables in schema public to service_role;
grant all on all functions in schema public to service_role;

commit;
