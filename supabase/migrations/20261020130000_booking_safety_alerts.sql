-- In-session Safety alerts (ops cases) + booking hold.

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'safety_alert_reason'
  ) then
    create type public.safety_alert_reason as enum (
      'unsafe_behaviour',
      'unwell_or_accident',
      'access_or_property',
      'other'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'safety_alert_status'
  ) then
    create type public.safety_alert_status as enum (
      'open',
      'acknowledged',
      'in_progress',
      'resolved',
      'withdrawn'
    );
  end if;
end $$;

alter table public.bookings
  add column if not exists safety_hold_at timestamptz;

comment on column public.bookings.safety_hold_at is
  'When set, check-in/start/check-out are blocked until ops clear the safety hold.';

create table if not exists public.booking_safety_alerts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  raised_by uuid not null references public.profiles(id) on delete cascade,
  raised_by_role text not null check (raised_by_role in ('customer', 'cleaner')),
  reason public.safety_alert_reason not null,
  note text,
  status public.safety_alert_status not null default 'open',
  severity text not null default 'urgent',
  booking_status_snapshot text,
  scheduled_date date,
  scheduled_start_time time,
  address_line text,
  address_latitude double precision,
  address_longitude double precision,
  customer_id uuid references public.profiles(id) on delete set null,
  cleaner_id uuid references public.profiles(id) on delete set null,
  client_user_agent text,
  client_latitude double precision,
  client_longitude double precision,
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  outcome_notes text,
  withdrawn_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists booking_safety_alerts_booking_idx
  on public.booking_safety_alerts (booking_id, created_at desc);

create index if not exists booking_safety_alerts_status_idx
  on public.booking_safety_alerts (status, created_at desc);

-- At most one open/active case per booking (not resolved/withdrawn).
create unique index if not exists booking_safety_alerts_one_open_idx
  on public.booking_safety_alerts (booking_id)
  where status in ('open', 'acknowledged', 'in_progress');

alter table public.booking_safety_alerts enable row level security;

create policy booking_safety_alerts_select_own
  on public.booking_safety_alerts
  for select
  to authenticated
  using (
    raised_by = auth.uid()
    or customer_id = auth.uid()
    or cleaner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Inserts/updates go through service-role APIs.
revoke insert, update, delete on public.booking_safety_alerts from authenticated, anon;
