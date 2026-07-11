create type public.document_review_status as enum ('missing', 'pending', 'verified', 'rejected');
create type public.job_response_type as enum ('accepted', 'declined', 'expired');
create type public.override_status as enum ('pending', 'approved', 'rejected');

alter table public.cleaner_profiles
  add column dbs_document_status public.document_review_status not null default 'missing',
  add column id_document_status public.document_review_status not null default 'missing',
  add column stripe_onboarding_complete boolean not null default false;

alter table public.bookings
  add column checkin_override_requested boolean not null default false,
  add column checkout_override_requested boolean not null default false;

create table public.cleaner_job_responses (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  response public.job_response_type not null,
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (booking_id, cleaner_id)
);

create table public.location_override_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('checkin', 'checkout')),
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  distance_meters numeric not null,
  reason text,
  status public.override_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index cleaner_job_responses_cleaner_idx
  on public.cleaner_job_responses(cleaner_id, response);
create index location_override_requests_booking_idx
  on public.location_override_requests(booking_id);

alter table public.cleaner_job_responses enable row level security;
alter table public.location_override_requests enable row level security;

create policy "Cleaners read own job responses"
on public.cleaner_job_responses for select to authenticated
using (cleaner_id = auth.uid());

create policy "Cleaners read own override requests"
on public.location_override_requests for select to authenticated
using (cleaner_id = auth.uid());

grant select on public.cleaner_job_responses to authenticated;
grant select on public.location_override_requests to authenticated;
grant all on public.cleaner_job_responses to service_role;
grant all on public.location_override_requests to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cleaner-documents', 'cleaner-documents', false, 10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('booking-photos', 'booking-photos', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Cleaners upload own documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'cleaner-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Cleaners read own documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'cleaner-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Cleaners replace own documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'cleaner-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'cleaner-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Assigned cleaners upload job photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'booking-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Booking participants read job photos"
on storage.objects for select to authenticated
using (bucket_id = 'booking-photos');
