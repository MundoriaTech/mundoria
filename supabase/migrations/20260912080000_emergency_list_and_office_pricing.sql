-- Dynamic Emergency List + commercial office booking fields
-- Spec: booking engine reserve pool; office cleaner-hours pricing

alter table public.bookings
  add column if not exists cleaner_hours numeric,
  add column if not exists allocated_cleaners integer default 1,
  add column if not exists commercial_spaces jsonb,
  add column if not exists booking_protected boolean not null default false,
  add column if not exists confirmation_gate text not null default 'none',
  add column if not exists confirmation_due_at timestamptz,
  add column if not exists confirmation_responded_at timestamptz,
  add column if not exists previous_cleaner_id uuid references public.profiles (id);

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'emergency_list_member_status'
  ) then
    create type public.emergency_list_member_status as enum (
      'reserve',
      'notified',
      'promoted',
      'removed',
      'closed'
    );
  end if;
end $$;

create table if not exists public.booking_emergency_list (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  cleaner_id uuid not null references public.profiles (id) on delete cascade,
  rank integer not null default 0,
  status public.emergency_list_member_status not null default 'reserve',
  notified_at timestamptz,
  removed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, cleaner_id)
);

create index if not exists booking_emergency_list_booking_status_idx
  on public.booking_emergency_list (booking_id, status);

create index if not exists booking_emergency_list_cleaner_idx
  on public.booking_emergency_list (cleaner_id, status);

create table if not exists public.marketplace_demand_signals (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete set null,
  cleaner_id uuid references public.profiles (id) on delete set null,
  service_type text,
  postcode_area text,
  scheduled_date date,
  scheduled_start_time time,
  amount_total integer,
  role text not null,
  created_at timestamptz not null default now()
);

create index if not exists marketplace_demand_signals_lookup_idx
  on public.marketplace_demand_signals (service_type, postcode_area, scheduled_date);

alter table public.booking_emergency_list enable row level security;
alter table public.marketplace_demand_signals enable row level security;

-- Service-role / admin client only for now (no public policies)
