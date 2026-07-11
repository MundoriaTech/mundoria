alter type public.booking_status add value if not exists 'no_show' after 'cancelled';

alter table public.bookings
  add column no_show_cleaner_id uuid references public.profiles(id) on delete set null,
  add column no_show_recorded_at timestamptz,
  add column replacement_deadline timestamptz;

create table public.cleaner_locations (
  cleaner_id uuid primary key references public.profiles(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  updated_at timestamptz not null default now()
);

create index cleaner_locations_booking_idx
  on public.cleaner_locations(booking_id);

alter table public.cleaner_locations enable row level security;

create policy "Booking participants read cleaner location"
on public.cleaner_locations for select
to authenticated
using (public.is_booking_participant(booking_id));

grant select on public.cleaner_locations to authenticated;
grant all on public.cleaner_locations to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cleaner_locations'
  ) then
    alter publication supabase_realtime add table public.cleaner_locations;
  end if;
end;
$$;
