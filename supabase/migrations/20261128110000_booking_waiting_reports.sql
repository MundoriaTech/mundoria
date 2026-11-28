-- A cleaner at the door tapping "Customer not answering". Each tap tells the
-- customer and alerts admins. Waiting charges are switched off, so this is a
-- record of the wait, not a charge. Server (service role) access only.
create table if not exists public.booking_waiting_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists booking_waiting_reports_booking_idx
  on public.booking_waiting_reports (booking_id, created_at desc);

alter table public.booking_waiting_reports enable row level security;
