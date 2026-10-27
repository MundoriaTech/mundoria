-- Delayed pre-auth / next-day capture payment model.
-- Book: save card (SetupIntent). Pre-auth ~T−24h once cleaner confirmed.
-- Capture: next UK calendar day after checkout at a configurable local time.

alter table public.platform_settings
  add column if not exists payment_preauth_hours_before integer not null default 24
    check (payment_preauth_hours_before between 1 and 168),
  add column if not exists payment_capture_hour_uk integer not null default 10
    check (payment_capture_hour_uk between 0 and 23),
  add column if not exists payment_capture_minute_uk integer not null default 0
    check (payment_capture_minute_uk between 0 and 59);

alter table public.bookings
  add column if not exists stripe_setup_intent_id text,
  add column if not exists stripe_payment_method_id text,
  add column if not exists payment_authorized_at timestamptz,
  add column if not exists payment_capture_scheduled_for timestamptz,
  add column if not exists payment_captured_at timestamptz,
  add column if not exists payment_preauth_failed_at timestamptz,
  add column if not exists payment_preauth_failure_reason text;

create unique index if not exists bookings_stripe_setup_intent_id_uidx
  on public.bookings (stripe_setup_intent_id)
  where stripe_setup_intent_id is not null;

create index if not exists bookings_payment_preauth_due_idx
  on public.bookings (scheduled_date, scheduled_start_time)
  where payment_status = 'unpaid'
    and stripe_payment_method_id is not null
    and status in ('confirmed', 'cleaner_en_route', 'in_progress');

create index if not exists bookings_payment_capture_due_idx
  on public.bookings (payment_capture_scheduled_for)
  where payment_status = 'held'
    and payment_capture_scheduled_for is not null;
