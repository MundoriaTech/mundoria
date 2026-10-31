-- Cleaner accepts → provisional awaiting_payment → card hold → confirmed.
-- Up to 5 smart auth attempts between the auth-open window and the T−24h deadline.

alter table public.platform_settings
  add column if not exists payment_auth_open_hours_before integer not null default 48
    check (payment_auth_open_hours_before between 2 and 168);

comment on column public.platform_settings.payment_auth_open_hours_before is
  'Hours before the visit when full-value card holds may begin (default 48).';
comment on column public.platform_settings.payment_preauth_hours_before is
  'Legacy/compat: free-cancel payment deadline hours before the visit (default 24).';

alter table public.bookings
  add column if not exists payment_auth_attempt_count integer not null default 0
    check (payment_auth_attempt_count >= 0),
  add column if not exists payment_auth_max_attempts integer not null default 5
    check (payment_auth_max_attempts between 1 and 10),
  add column if not exists payment_auth_next_attempt_at timestamptz,
  add column if not exists payment_auth_window_opens_at timestamptz,
  add column if not exists payment_auth_deadline_at timestamptz,
  add column if not exists payment_auth_last_notified_at timestamptz,
  add column if not exists payment_auth_stop_retries boolean not null default false;

create table if not exists public.booking_payment_auth_attempts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  attempt_number integer not null check (attempt_number >= 1),
  outcome text not null check (
    outcome in ('succeeded', 'failed', 'skipped', 'scheduled', 'cancelled')
  ),
  retryable boolean,
  stripe_payment_intent_id text,
  stripe_decline_code text,
  error_message text,
  scheduled_for timestamptz,
  attempted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (booking_id, attempt_number)
);

create index if not exists booking_payment_auth_attempts_booking_idx
  on public.booking_payment_auth_attempts (booking_id, attempt_number);

create index if not exists bookings_payment_auth_next_attempt_idx
  on public.bookings (payment_auth_next_attempt_at)
  where payment_status = 'unpaid'
    and status = 'awaiting_payment'
    and payment_auth_next_attempt_at is not null
    and payment_auth_stop_retries = false;

create index if not exists bookings_payment_auth_deadline_idx
  on public.bookings (payment_auth_deadline_at)
  where payment_status = 'unpaid'
    and status = 'awaiting_payment'
    and payment_auth_deadline_at is not null;

-- Service-role / admin writes only (no customer/cleaner direct access).
alter table public.booking_payment_auth_attempts enable row level security;

-- Customer cancel + cleaner visibility while payment is being secured.
create or replace function public.protect_booking_write()
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
          'awaiting_payment'::public.booking_status,
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
      or (old.status = 'matched' and new.status = 'awaiting_payment')
      or (old.status = 'awaiting_payment' and new.status = 'confirmed')
      or (old.status = 'confirmed' and new.status = 'cleaner_en_route')
      or (old.status = 'cleaner_en_route' and new.status = 'in_progress')
      or (old.status = 'in_progress' and new.status = 'completed')
      or (
        old.status in ('matched', 'awaiting_payment', 'confirmed', 'cleaner_en_route')
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

create or replace function public.is_matched_cleaner(target_cleaner_id uuid)
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
        'awaiting_payment'::public.booking_status,
        'confirmed'::public.booking_status,
        'cleaner_en_route'::public.booking_status,
        'in_progress'::public.booking_status,
        'completed'::public.booking_status,
        'disputed'::public.booking_status
      )
  );
$$;
