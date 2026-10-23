-- Cleaner onboarding redesign: branched UTR/DBS, insurance, equipment,
-- emergency contact, agreements, and richer experience/matching prefs.

alter table public.cleaner_profiles
  add column if not exists utr_path text
    check (utr_path is null or utr_path in ('have', 'none', 'unsure', 'waiting')),
  add column if not exists utr_document_url text,
  add column if not exists utr_document_status public.document_review_status
    not null default 'missing',
  add column if not exists dbs_path text
    check (dbs_path is null or dbs_path in ('have', 'apply', 'waiting')),
  add column if not exists dbs_certificate_number text,
  add column if not exists dbs_issued_on date,
  add column if not exists insurance_path text
    check (
      insurance_path is null
      or insurance_path in ('have', 'none', 'unsure')
    ),
  add column if not exists insurance_provider text,
  add column if not exists insurance_policy_number text,
  add column if not exists insurance_cover_amount text,
  add column if not exists insurance_expiry_date date,
  add column if not exists insurance_certificate_url text,
  add column if not exists insurance_status public.document_review_status
    not null default 'missing',
  add column if not exists experience_band text,
  add column if not exists cleaning_skills text[] not null default '{}',
  add column if not exists prior_work_type text,
  add column if not exists prior_work_employer text,
  add column if not exists prior_work_duration text,
  add column if not exists prior_work_summary text,
  add column if not exists training_completed text[] not null default '{}',
  add column if not exists training_certificate_url text,
  add column if not exists reference_name text,
  add column if not exists reference_company text,
  add column if not exists reference_relationship text,
  add column if not exists reference_email text,
  add column if not exists reference_phone text,
  add column if not exists reference_contact_ok boolean,
  add column if not exists transport_mode text,
  add column if not exists can_transport_equipment text,
  add column if not exists booking_preferences text[] not null default '{}',
  add column if not exists preferred_hours_band text,
  add column if not exists equipment_ownership text,
  add column if not exists equipment_owned text[] not null default '{}',
  add column if not exists equipment_condition text,
  add column if not exists products_ownership text,
  add column if not exists products_owned text[] not null default '{}',
  add column if not exists ppe_owned text[] not null default '{}',
  add column if not exists equipment_transport text,
  add column if not exists specialised_equipment text[] not null default '{}',
  add column if not exists specialised_training text,
  add column if not exists emergency_contact jsonb,
  add column if not exists safety_acknowledged_at timestamptz,
  add column if not exists agreement_acceptances jsonb not null default '[]'::jsonb;

comment on column public.cleaner_profiles.utr_path is
  'Onboarding branch: have | none | unsure | waiting.';
comment on column public.cleaner_profiles.dbs_path is
  'Onboarding branch: have | apply | waiting.';
comment on column public.cleaner_profiles.insurance_path is
  'Onboarding branch: have | none | unsure.';
comment on column public.cleaner_profiles.insurance_cover_amount is
  'Cover band e.g. 1m | 2m | 5m | other. Minimum for domestic is £1m.';
comment on column public.cleaner_profiles.agreement_acceptances is
  'Array of { key, version, accepted_at } for cleaner agreements.';
