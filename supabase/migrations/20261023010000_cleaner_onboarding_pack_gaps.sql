-- Pack gap fields: training/refs already present; add postcode, Other texts,
-- insurance identity checks, application reference, verification flags,
-- expiry status, equipment/skills assessment statuses, incidents.

alter type public.document_review_status add value if not exists 'expired';

alter table public.cleaner_profiles
  add column if not exists starting_postcode text,
  add column if not exists cleaning_skills_other text,
  add column if not exists equipment_other text,
  add column if not exists products_other text,
  add column if not exists ppe_other text,
  add column if not exists specialised_other text,
  add column if not exists insurance_insured_name text,
  add column if not exists insurance_activity_confirmed boolean,
  add column if not exists application_reference text,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists info_accuracy_confirmed_at timestamptz,
  add column if not exists verification_flags jsonb not null default '{}'::jsonb,
  add column if not exists training_path text
    check (training_path is null or training_path in ('yes', 'no')),
  add column if not exists skills_assessment_status text
    check (
      skills_assessment_status is null
      or skills_assessment_status in (
        'not_required',
        'additional_assessment',
        'approved'
      )
    ),
  add column if not exists equipment_status text
    check (
      equipment_status is null
      or equipment_status in (
        'complete',
        'update_required',
        'pending_review'
      )
    ),
  add column if not exists specialist_review_required boolean not null default false;

create unique index if not exists cleaner_profiles_application_reference_key
  on public.cleaner_profiles (application_reference)
  where application_reference is not null;

create index if not exists cleaner_profiles_utr_number_idx
  on public.cleaner_profiles (utr_number)
  where utr_number is not null;

comment on column public.cleaner_profiles.verification_flags is
  'Ops flags e.g. { duplicate_utr, name_mismatch, unreadable_doc }.';
comment on column public.cleaner_profiles.application_reference is
  'Public application id shown after submit, e.g. MDR-20261023-A1B2.';

create table if not exists public.cleaner_incidents (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  category text not null
    check (
      category in (
        'injury',
        'property_damage',
        'unsafe_condition',
        'theft',
        'customer_behaviour',
        'other'
      )
    ),
  severity text not null default 'standard'
    check (severity in ('standard', 'urgent', 'emergency')),
  title text not null,
  description text not null,
  occurred_at timestamptz,
  location_note text,
  emergency_services_contacted boolean not null default false,
  status text not null default 'submitted'
    check (
      status in (
        'submitted',
        'under_review',
        'action_required',
        'resolved',
        'closed'
      )
    ),
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cleaner_incidents_cleaner_id_idx
  on public.cleaner_incidents (cleaner_id, created_at desc);
create index if not exists cleaner_incidents_status_idx
  on public.cleaner_incidents (status);

alter table public.cleaner_incidents enable row level security;

create policy "Cleaners manage own incidents"
  on public.cleaner_incidents for all
  using (auth.uid() = cleaner_id)
  with check (auth.uid() = cleaner_id);

create policy "Admins read all incidents"
  on public.cleaner_incidents for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins update all incidents"
  on public.cleaner_incidents for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

grant select, insert, update on public.cleaner_incidents to authenticated;
