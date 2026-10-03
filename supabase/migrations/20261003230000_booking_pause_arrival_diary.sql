-- Holiday pause, arrival handshake, tips, cleaner diary and absences.

alter table public.bookings
  add column if not exists arrived_at timestamptz,
  add column if not exists cleaner_start_confirmed_at timestamptz,
  add column if not exists customer_start_confirmed_at timestamptz,
  add column if not exists access_grace_ends_at timestamptz,
  add column if not exists access_penalty_pence integer not null default 0,
  add column if not exists tip_pence integer not null default 0,
  add column if not exists pause_starts_on date,
  add column if not exists pause_ends_on date;

create table if not exists public.cleaner_calendar_events (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists cleaner_calendar_events_cleaner_idx
  on public.cleaner_calendar_events (cleaner_id, starts_at);

alter table public.cleaner_calendar_events enable row level security;

create policy "Cleaners manage their own diary"
on public.cleaner_calendar_events
for all
using (cleaner_id = auth.uid())
with check (cleaner_id = auth.uid());

create table if not exists public.cleaner_absences (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.profiles (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  cancel_existing boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index if not exists cleaner_absences_cleaner_idx
  on public.cleaner_absences (cleaner_id, starts_on);

alter table public.cleaner_absences enable row level security;

create policy "Cleaners manage their own absences"
on public.cleaner_absences
for all
using (cleaner_id = auth.uid())
with check (cleaner_id = auth.uid());
