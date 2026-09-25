-- Cleaner onboarding: headshot, UTR, phone interview, skills exam

create type public.interview_status as enum (
  'not_started',
  'awaiting',
  'completed',
  'failed'
);

alter table public.cleaner_profiles
  add column if not exists headshot_url text,
  add column if not exists headshot_status public.document_review_status not null default 'missing',
  add column if not exists utr_number text,
  add column if not exists utr_verified boolean not null default false,
  add column if not exists interview_status public.interview_status not null default 'not_started',
  add column if not exists interview_notes text,
  add column if not exists interview_completed_at timestamptz,
  add column if not exists interview_completed_by uuid references public.profiles(id),
  add column if not exists skills_exam_passed boolean not null default false,
  add column if not exists skills_exam_score integer,
  add column if not exists skills_exam_completed_at timestamptz;

comment on column public.cleaner_profiles.utr_number is
  'HMRC Unique Taxpayer Reference (10 digits) for UK self-employed verification.';
comment on column public.cleaner_profiles.interview_status is
  'Phone interview gate before certification.';
comment on column public.cleaner_profiles.skills_exam_passed is
  'In-app skills quiz passed during onboarding.';
