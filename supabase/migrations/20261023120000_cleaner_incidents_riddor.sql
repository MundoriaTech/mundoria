-- RIDDOR tracking for cleaner incidents (admin triage).
alter table public.cleaner_incidents
  add column if not exists riddor_required boolean not null default false,
  add column if not exists riddor_recorded_at timestamptz;

comment on column public.cleaner_incidents.riddor_required is
  'Admin flag: incident may need RIDDOR reporting to the HSE.';
comment on column public.cleaner_incidents.riddor_recorded_at is
  'When ops recorded/submitted the RIDDOR report.';
