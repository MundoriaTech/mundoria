-- CleanScape platform mechanics:
-- certification-led cleaner visibility, medallion score ratings,
-- rating dispute holds, GPS consent, guided disputes, and service checklists.

do $$
begin
  create type public.rating_mood as enum (
    'excellent',
    'good',
    'fair',
    'bad',
    'awful'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.rating_application_status as enum (
    'pending_hold',
    'disputed',
    'applied',
    'voided'
  );
exception
  when duplicate_object then null;
end;
$$;

alter table public.cleaner_profiles
  add column if not exists certification_score integer check (
    certification_score is null or certification_score between 0 and 100
  ),
  add column if not exists certification_notes text,
  add column if not exists certification_passed boolean not null default false,
  add column if not exists certification_assessed_by uuid references public.profiles(id) on delete set null,
  add column if not exists certification_assessed_at timestamptz,
  add column if not exists location_tracking_consent_at timestamptz,
  add column if not exists location_tracking_consent_version text,
  add column if not exists medallion_score integer not null default 0,
  add column if not exists medallion_under_review_at timestamptz;

update public.cleaner_profiles
set status = 'certified'::public.cleaner_status,
    tier = case
      when tier = 'elite'::public.cleaner_tier then 'rose_gold'::public.cleaner_tier
      when tier = 'bronze'::public.cleaner_tier and total_jobs = 0 then 'silver'::public.cleaner_tier
      else tier
    end,
    certification_passed = true,
    certification_assessed_at = coalesce(certification_assessed_at, updated_at, now())
where status = 'active'::public.cleaner_status;

alter table public.ratings
  add column if not exists mood public.rating_mood,
  add column if not exists internal_score integer check (
    internal_score is null or internal_score between -2 and 2
  ),
  add column if not exists application_status public.rating_application_status not null default 'applied',
  add column if not exists dispute_deadline timestamptz,
  add column if not exists applied_at timestamptz,
  add column if not exists voided_at timestamptz,
  add column if not exists admin_resolution_notes text;

update public.ratings
set applied_at = coalesce(applied_at, created_at)
where application_status = 'applied'
  and applied_at is null;

alter table public.disputes
  add column if not exists rating_id uuid references public.ratings(id) on delete set null,
  add column if not exists category_path text[] not null default '{}',
  add column if not exists selected_option_key text,
  add column if not exists structured_metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(structured_metadata) = 'object');

alter table public.bookings
  add column if not exists cleaner_marked_complete_at timestamptz,
  add column if not exists customer_confirmed_complete_at timestamptz;

create table if not exists public.cleaner_medallion_events (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  rating_id uuid references public.ratings(id) on delete set null,
  changed_by uuid references public.profiles(id) on delete set null,
  event_type text not null check (
    event_type in (
      'rating_applied',
      'rating_voided',
      'tier_changed',
      'manual_adjustment',
      'certification_passed',
      'certification_failed',
      'under_review'
    )
  ),
  score_delta integer not null default 0,
  score_before integer,
  score_after integer,
  tier_before public.cleaner_tier,
  tier_after public.cleaner_tier,
  notes text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists public.service_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  service_type public.service_type not null,
  item_key text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (service_type, item_key)
);

create table if not exists public.booking_checklist_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  template_item_id uuid references public.service_checklist_templates(id) on delete set null,
  item_key text not null,
  label text not null,
  description text,
  is_required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (booking_id, item_key)
);

create table if not exists public.booking_completion_confirmations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  all_confirmed boolean not null default true,
  unchecked_items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(unchecked_items) = 'array'),
  notes text,
  confirmed_at timestamptz not null default now(),
  check (
    all_confirmed = true
    or jsonb_array_length(unchecked_items) > 0
  )
);

create table if not exists public.booking_location_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('checkin', 'checkout')),
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  distance_meters numeric,
  is_verified boolean not null default false,
  consent_version text,
  created_at timestamptz not null default now()
);

create index if not exists cleaner_medallion_events_cleaner_idx
  on public.cleaner_medallion_events(cleaner_id, created_at desc);

create index if not exists disputes_rating_id_idx
  on public.disputes(rating_id);

create index if not exists ratings_hold_deadline_idx
  on public.ratings(application_status, dispute_deadline)
  where application_status in ('pending_hold', 'disputed');

create index if not exists booking_checklist_items_booking_idx
  on public.booking_checklist_items(booking_id, sort_order);

create index if not exists booking_location_events_booking_idx
  on public.booking_location_events(booking_id, created_at);

create or replace function public.medallion_tier_for_score(score integer)
returns public.cleaner_tier
language sql
immutable
set search_path = ''
as $$
  select case
    when score >= 150 then 'rose_gold'::public.cleaner_tier
    when score >= 50 then 'gold'::public.cleaner_tier
    when score >= 0 then 'silver'::public.cleaner_tier
    else 'bronze'::public.cleaner_tier
  end
$$;

create or replace function public.rating_score_for_mood(mood public.rating_mood)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case mood
    when 'excellent'::public.rating_mood then 2
    when 'good'::public.rating_mood then 1
    when 'fair'::public.rating_mood then 0
    when 'bad'::public.rating_mood then -1
    when 'awful'::public.rating_mood then -2
  end
$$;

create or replace function public.apply_rating_to_medallion(
  target_rating_id uuid,
  actor_id uuid default null,
  resolution_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_rating public.ratings%rowtype;
  cleaner public.cleaner_profiles%rowtype;
  before_score integer;
  after_score integer;
  before_tier public.cleaner_tier;
  after_tier public.cleaner_tier;
begin
  select *
  into target_rating
  from public.ratings
  where id = target_rating_id
  for update;

  if not found then
    raise exception 'Rating not found';
  end if;

  if target_rating.application_status = 'applied'::public.rating_application_status then
    return;
  end if;

  if target_rating.application_status = 'voided'::public.rating_application_status then
    raise exception 'Voided ratings cannot be applied';
  end if;

  select *
  into cleaner
  from public.cleaner_profiles
  where id = target_rating.cleaner_id
  for update;

  if not found then
    raise exception 'Cleaner profile not found';
  end if;

  before_score := cleaner.medallion_score;
  before_tier := cleaner.tier;
  after_score := before_score + coalesce(target_rating.internal_score, 0);
  after_tier := public.medallion_tier_for_score(after_score);

  update public.cleaner_profiles
  set medallion_score = after_score,
      tier = after_tier,
      medallion_under_review_at = case
        when after_score < -20 then coalesce(medallion_under_review_at, now())
        else null
      end
  where id = target_rating.cleaner_id;

  update public.ratings
  set application_status = 'applied'::public.rating_application_status,
      applied_at = now(),
      admin_resolution_notes = coalesce(resolution_notes, admin_resolution_notes)
  where id = target_rating_id;

  insert into public.cleaner_medallion_events (
    cleaner_id,
    rating_id,
    changed_by,
    event_type,
    score_delta,
    score_before,
    score_after,
    tier_before,
    tier_after,
    notes
  )
  values (
    target_rating.cleaner_id,
    target_rating.id,
    actor_id,
    case when before_tier <> after_tier then 'tier_changed' else 'rating_applied' end,
    coalesce(target_rating.internal_score, 0),
    before_score,
    after_score,
    before_tier,
    after_tier,
    resolution_notes
  );

  if after_score < -20 then
    insert into public.cleaner_medallion_events (
      cleaner_id,
      rating_id,
      changed_by,
      event_type,
      score_delta,
      score_before,
      score_after,
      tier_before,
      tier_after,
      notes
    )
    values (
      target_rating.cleaner_id,
      target_rating.id,
      actor_id,
      'under_review',
      0,
      after_score,
      after_score,
      after_tier,
      after_tier,
      'Cleaner cumulative score is below -20 and needs admin review.'
    );
  end if;
end;
$$;

create or replace function public.void_rating_from_medallion(
  target_rating_id uuid,
  actor_id uuid default null,
  resolution_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_rating public.ratings%rowtype;
begin
  select *
  into target_rating
  from public.ratings
  where id = target_rating_id
  for update;

  if not found then
    raise exception 'Rating not found';
  end if;

  if target_rating.application_status = 'applied'::public.rating_application_status then
    raise exception 'Applied ratings cannot be voided without a manual score adjustment';
  end if;

  update public.ratings
  set application_status = 'voided'::public.rating_application_status,
      voided_at = now(),
      admin_resolution_notes = coalesce(resolution_notes, admin_resolution_notes)
  where id = target_rating_id;

  insert into public.cleaner_medallion_events (
    cleaner_id,
    rating_id,
    changed_by,
    event_type,
    notes
  )
  values (
    target_rating.cleaner_id,
    target_rating.id,
    actor_id,
    'rating_voided',
    resolution_notes
  );
end;
$$;

create or replace function public.create_booking_checklist_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.booking_checklist_items (
    booking_id,
    template_item_id,
    item_key,
    label,
    description,
    sort_order
  )
  select
    new.id,
    template.id,
    template.item_key,
    template.label,
    template.description,
    template.sort_order
  from public.service_checklist_templates template
  where template.service_type = new.service_type
    and template.is_active = true
  on conflict (booking_id, item_key) do nothing;

  return new;
end;
$$;

drop trigger if exists bookings_create_checklist_snapshot on public.bookings;
create trigger bookings_create_checklist_snapshot
after insert on public.bookings
for each row execute function public.create_booking_checklist_snapshot();

insert into public.service_checklist_templates (service_type, item_key, label, description, sort_order)
values
  ('regular', 'general_dusting', 'General dusting completed', 'Visible surfaces dusted in agreed rooms.', 10),
  ('regular', 'floors_cleaned', 'Floors cleaned', 'Floors vacuumed and/or mopped as appropriate.', 20),
  ('regular', 'bathrooms_cleaned', 'Bathrooms cleaned', 'Bathroom surfaces, sinks, toilets, and mirrors cleaned.', 30),
  ('regular', 'kitchen_surfaces', 'Kitchen surfaces cleaned', 'Worktops, sink, and visible appliance fronts wiped.', 40),
  ('deep_clean', 'deep_dusting', 'Deep dusting completed', 'High-touch and harder-to-reach visible surfaces cleaned.', 10),
  ('deep_clean', 'bathroom_detail', 'Bathroom detail clean completed', 'Limescale-prone and high-touch bathroom areas cleaned.', 20),
  ('deep_clean', 'kitchen_detail', 'Kitchen detail clean completed', 'Kitchen surfaces and visible appliance fronts cleaned in detail.', 30),
  ('deep_clean', 'floors_detail', 'Floors cleaned in detail', 'Floors vacuumed/mopped with extra attention to edges and corners.', 40),
  ('end_of_tenancy', 'rooms_reset', 'Rooms cleaned for handover', 'Bedrooms/living spaces cleaned for tenancy handover.', 10),
  ('end_of_tenancy', 'bathrooms_reset', 'Bathrooms cleaned for handover', 'Bathrooms cleaned to end-of-tenancy standard.', 20),
  ('end_of_tenancy', 'kitchen_reset', 'Kitchen cleaned for handover', 'Kitchen cleaned to end-of-tenancy standard excluding add-ons not booked.', 30),
  ('end_of_tenancy', 'floors_reset', 'Floors cleaned for handover', 'Floors vacuumed/mopped for tenancy handover.', 40),
  ('one_off', 'one_off_surfaces', 'Surfaces cleaned', 'Agreed visible surfaces cleaned.', 10),
  ('one_off', 'one_off_floors', 'Floors cleaned', 'Agreed floors cleaned.', 20),
  ('airbnb_turnover', 'linen_reset', 'Guest-ready reset completed', 'Turnover areas reset for incoming guests where applicable.', 10),
  ('airbnb_turnover', 'guest_surfaces', 'Guest surfaces cleaned', 'Visible guest-facing surfaces cleaned.', 20),
  ('post_construction', 'dust_removed', 'Post-construction dust reduced', 'Accessible visible dust removed from agreed areas.', 10),
  ('post_construction', 'debris_cleared', 'Light debris cleared', 'Light non-hazardous debris cleared from agreed areas.', 20)
on conflict (service_type, item_key) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

alter table public.cleaner_medallion_events enable row level security;
alter table public.service_checklist_templates enable row level security;
alter table public.booking_checklist_items enable row level security;
alter table public.booking_completion_confirmations enable row level security;
alter table public.booking_location_events enable row level security;

create policy "Admins read medallion events"
on public.cleaner_medallion_events for select
to authenticated
using (public.has_role('admin'::public.user_role));

create policy "Booking participants read checklist items"
on public.booking_checklist_items for select
to authenticated
using (public.is_booking_participant(booking_id));

create policy "Authenticated users read active checklist templates"
on public.service_checklist_templates for select
to authenticated
using (is_active = true);

create policy "Booking participants read completion confirmations"
on public.booking_completion_confirmations for select
to authenticated
using (public.is_booking_participant(booking_id));

create policy "Customers confirm own booking completion"
on public.booking_completion_confirmations for insert
to authenticated
with check (
  customer_id = auth.uid()
  and public.is_booking_customer(booking_id, customer_id)
);

create policy "Admins read booking location events"
on public.booking_location_events for select
to authenticated
using (public.has_role('admin'::public.user_role));

grant select on public.service_checklist_templates to authenticated;
grant select on public.booking_checklist_items to authenticated;
grant select, insert on public.booking_completion_confirmations to authenticated;
grant all on public.cleaner_medallion_events to service_role;
grant all on public.service_checklist_templates to service_role;
grant all on public.booking_checklist_items to service_role;
grant all on public.booking_completion_confirmations to service_role;
grant all on public.booking_location_events to service_role;

revoke all on function public.medallion_tier_for_score(integer) from public;
revoke all on function public.rating_score_for_mood(public.rating_mood) from public;
revoke all on function public.apply_rating_to_medallion(uuid, uuid, text) from public;
revoke all on function public.void_rating_from_medallion(uuid, uuid, text) from public;
revoke all on function public.create_booking_checklist_snapshot() from public;

grant execute on function public.medallion_tier_for_score(integer) to authenticated, service_role;
grant execute on function public.rating_score_for_mood(public.rating_mood) to authenticated, service_role;
grant execute on function public.apply_rating_to_medallion(uuid, uuid, text) to service_role;
grant execute on function public.void_rating_from_medallion(uuid, uuid, text) to service_role;
grant execute on function public.create_booking_checklist_snapshot() to service_role;
