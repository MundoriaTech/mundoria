-- CleanScape Smart Service recommendation engine support.

begin;

-- Expanded service taxonomy from the Smart Service specification.
alter type public.service_type add value if not exists 'move_in';
alter type public.service_type add value if not exists 'move_out';
alter type public.service_type add value if not exists 'office';
alter type public.service_type add value if not exists 'retail_hospitality';
alter type public.service_type add value if not exists 'educational_facility';
alter type public.service_type add value if not exists 'communal_area';
alter type public.service_type add value if not exists 'holiday_let';
alter type public.service_type add value if not exists 'serviced_accommodation';
alter type public.service_type add value if not exists 'window_cleaning';
alter type public.service_type add value if not exists 'pregnancy_support';
alter type public.service_type add value if not exists 'postpartum';
alter type public.service_type add value if not exists 'illness_recovery';
alter type public.service_type add value if not exists 'post_injury';
alter type public.service_type add value if not exists 'hospital_discharge';
alter type public.service_type add value if not exists 'bereavement_support';

do $$
begin
  create type public.cleaning_standard as enum (
    'essential',
    'enhanced',
    'comprehensive'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.bookings
  add column if not exists service_category text,
  add column if not exists cleaning_standard public.cleaning_standard not null default 'enhanced',
  add column if not exists recommended_service_type public.service_type,
  add column if not exists recommended_cleaning_standard public.cleaning_standard,
  add column if not exists recommendation_outcome text not null default 'not_shown'
    check (recommendation_outcome in ('not_shown', 'accepted', 'overridden', 'auto_applied')),
  add column if not exists property_condition text
    check (property_condition is null or property_condition in ('maintained', 'extra_attention', 'neglected')),
  add column if not exists recently_moved boolean,
  add column if not exists special_attention_areas text[] not null default '{}';

create table if not exists public.service_add_ons (
  id text primary key,
  label text not null,
  description text,
  amount numeric(12, 0) not null check (amount >= 0),
  service_categories text[] not null default '{}',
  service_types public.service_type[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_add_ons (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  add_on_id text not null references public.service_add_ons(id) on delete restrict,
  label text not null,
  amount numeric(12, 0) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (booking_id, add_on_id)
);

alter table public.service_add_ons enable row level security;
alter table public.booking_add_ons enable row level security;

drop policy if exists "Anyone signed in can read active service add-ons" on public.service_add_ons;
create policy "Anyone signed in can read active service add-ons"
on public.service_add_ons for select
to authenticated
using (is_active);

drop policy if exists "Booking participants can read booking add-ons" on public.booking_add_ons;
create policy "Booking participants can read booking add-ons"
on public.booking_add_ons for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (b.customer_id = auth.uid() or b.cleaner_id = auth.uid())
  )
);

grant usage on type public.cleaning_standard to authenticated, service_role;
grant select on public.service_add_ons to authenticated;
grant select on public.booking_add_ons to authenticated;
grant all on public.service_add_ons to service_role;
grant all on public.booking_add_ons to service_role;

insert into public.service_add_ons
  (id, label, description, amount, service_categories, service_types, sort_order)
values
  ('inside_fridge', 'Inside fridge', 'Interior fridge clean and wipe-down.', 1200, array['residential', 'short_term_rental'], '{}', 10),
  ('inside_oven', 'Inside oven', 'Oven interior clean for grease and residue.', 1800, array['residential', 'short_term_rental'], '{}', 20),
  ('inside_cabinets', 'Inside cabinets', 'Interior cupboard/cabinet wipe-down.', 1500, array['residential', 'short_term_rental'], '{}', 30),
  ('interior_windows', 'Interior windows', 'Interior window glass and sill clean.', 1400, array['residential', 'commercial', 'short_term_rental'], '{}', 40),
  ('balcony_patio', 'Balcony or patio', 'Light clean of balcony or patio area.', 2000, array['residential', 'short_term_rental'], '{}', 50),
  ('extra_bathroom_detail', 'Extra bathroom detail', 'Additional limescale and bathroom-detail time.', 1600, array['residential', 'short_term_rental', 'recovery'], '{}', 60),
  ('linen_change', 'Linen change', 'Change bed linen supplied by customer or host.', 1000, array['short_term_rental'], array['airbnb_turnover', 'holiday_let', 'serviced_accommodation']::public.service_type[], 70),
  ('recovery_priority', 'Recovery priority care', 'Extra care time for sensitive recovery-support bookings.', 2200, array['recovery'], '{}', 80)
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  amount = excluded.amount,
  service_categories = excluded.service_categories,
  service_types = excluded.service_types,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

commit;
