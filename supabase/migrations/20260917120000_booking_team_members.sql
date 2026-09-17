-- Team members for multi-cleaner commercial jobs (primary remains bookings.cleaner_id)

create table if not exists public.booking_team_members (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  cleaner_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'secondary'
    check (role in ('primary', 'secondary')),
  created_at timestamptz not null default now(),
  unique (booking_id, cleaner_id)
);

create index if not exists booking_team_members_booking_idx
  on public.booking_team_members (booking_id);

create index if not exists booking_team_members_cleaner_idx
  on public.booking_team_members (cleaner_id);

alter table public.booking_team_members enable row level security;

-- Service-role / admin client for writes; customers can read their own booking team
create policy "Customers can read team on own bookings"
on public.booking_team_members for select
using (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.customer_id = auth.uid()
  )
);

create policy "Cleaners can read own team assignments"
on public.booking_team_members for select
using (cleaner_id = auth.uid());
