-- Admin actions, bookings, disputes and AI calls pushed to Zoho CRM / Recruit.
-- Each change is tried straight away; anything Zoho refused or timed out on
-- stays here and the run-outreach cron retries it with backoff.
create table if not exists public.zoho_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  -- cleaner_snapshot | sales_lead | contact_note | candidate_closed
  kind text not null,
  -- A snapshot job only needs the latest state: one open row per entity.
  dedupe_key text,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create unique index if not exists zoho_sync_jobs_open_dedupe_idx
  on public.zoho_sync_jobs (dedupe_key)
  where completed_at is null and failed_at is null and dedupe_key is not null;

create index if not exists zoho_sync_jobs_due_idx
  on public.zoho_sync_jobs (next_attempt_at)
  where completed_at is null and failed_at is null;

alter table public.zoho_sync_jobs enable row level security;
revoke all on public.zoho_sync_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.zoho_sync_jobs to service_role;

-- Leads added by hand in admin (phone call, walk-in, referral) get a Zoho
-- Sales lead too. They have no website callback, so the queue row's
-- callback is optional from now on.
alter table public.zoho_sales_intake alter column callback_id drop not null;
