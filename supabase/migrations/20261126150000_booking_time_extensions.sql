-- Extra time on the day: the cleaner asks, the customer approves (or an
-- admin records an agreement), and approved time is charged as its own
-- payment after the main capture.
create table if not exists public.booking_time_extensions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid references public.profiles(id) on delete set null,
  minutes integer not null check (minutes > 0 and minutes <= 240),
  amount_pence integer not null check (amount_pence >= 0),
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'charged', 'failed', 'cancelled')),
  requested_by uuid references public.profiles(id) on delete set null,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  admin_note text,
  stripe_payment_intent_id text,
  charged_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists booking_time_extensions_booking_idx
  on public.booking_time_extensions (booking_id, created_at desc);

alter table public.booking_time_extensions enable row level security;

create policy "Booking participants read time extensions"
on public.booking_time_extensions for select
to authenticated
using (public.is_booking_participant(booking_id));

grant select on public.booking_time_extensions to authenticated;
grant all on public.booking_time_extensions to service_role;

-- Payout items can now carry approved extra time.
alter table public.payout_items drop constraint if exists payout_items_kind_check;
alter table public.payout_items
  add constraint payout_items_kind_check
  check (kind in ('visit', 'waiting_charge', 'extra_time'));
