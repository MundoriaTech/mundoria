-- Lead automation: one record per prospect, consent per channel, follow-up
-- journeys, every message and AI call, and weekly reports.
-- Written and read only by the server (service role); no public access.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  first_name text,
  last_name text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'engaged', 'booked', 'lost', 'unsubscribed')),
  source text not null default 'unknown',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  profile_id uuid references public.profiles(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  automation_paused boolean not null default false,
  do_not_contact boolean not null default false,
  needs_human boolean not null default false,
  needs_human_reason text,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  callback_requested_at timestamptz,
  last_outbound_at timestamptz,
  last_inbound_at timestamptz,
  booked_at timestamptz,
  booking_id uuid references public.bookings(id) on delete set null,
  attributed_message_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_contact_present check (email is not null or phone is not null)
);

create unique index if not exists leads_email_uidx on public.leads (lower(email)) where email is not null;
create index if not exists leads_phone_idx on public.leads (phone) where phone is not null;
create index if not exists leads_status_idx on public.leads (status, created_at desc);
create index if not exists leads_needs_human_idx on public.leads (needs_human) where needs_human;

-- Latest row per (lead, channel) is the current state. Rows are never edited,
-- so the history doubles as the consent audit trail.
create table if not exists public.lead_consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms', 'call')),
  granted boolean not null,
  basis text not null
    check (basis in ('opt_in', 'request', 'soft_opt_in', 'withdrawn', 'admin')),
  wording text,
  source_page text,
  captured_at timestamptz not null default now()
);

create index if not exists lead_consents_lead_idx on public.lead_consents (lead_id, channel, captured_at desc);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lead_events_lead_idx on public.lead_events (lead_id, created_at desc);
create index if not exists lead_events_type_idx on public.lead_events (type, created_at desc);

create table if not exists public.outreach_enrollments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  journey text not null,
  step_index integer not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'stopped')),
  stop_reason text,
  next_run_at timestamptz not null default now(),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists outreach_enrollments_active_uidx
  on public.outreach_enrollments (lead_id, journey) where status = 'active';
create index if not exists outreach_enrollments_due_idx
  on public.outreach_enrollments (next_run_at) where status = 'active';

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  enrollment_id uuid references public.outreach_enrollments(id) on delete set null,
  channel text not null check (channel in ('email', 'sms')),
  direction text not null check (direction in ('outbound', 'inbound')),
  status text not null check (status in ('sent', 'failed', 'skipped', 'received')),
  subject text,
  body text not null,
  provider_id text,
  ai_generated boolean not null default false,
  ai_intent text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists outreach_messages_lead_idx on public.outreach_messages (lead_id, created_at desc);
create index if not exists outreach_messages_created_idx on public.outreach_messages (created_at desc);

create table if not exists public.outreach_calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  provider text not null default 'vapi',
  provider_call_id text unique,
  purpose text not null,
  status text not null default 'queued',
  ended_reason text,
  outcome text,
  summary text,
  transcript text,
  recording_url text,
  duration_seconds integer,
  error text,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists outreach_calls_lead_idx on public.outreach_calls (lead_id, created_at desc);
create index if not exists outreach_calls_created_idx on public.outreach_calls (created_at desc);

create table if not exists public.outreach_reports (
  id uuid primary key default gen_random_uuid(),
  period_start timestamptz not null,
  period_end timestamptz not null,
  metrics jsonb not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists outreach_reports_period_uidx on public.outreach_reports (period_start);

alter table public.leads enable row level security;
alter table public.lead_consents enable row level security;
alter table public.lead_events enable row level security;
alter table public.outreach_enrollments enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.outreach_calls enable row level security;
alter table public.outreach_reports enable row level security;

revoke all on table public.leads, public.lead_consents, public.lead_events,
  public.outreach_enrollments, public.outreach_messages, public.outreach_calls,
  public.outreach_reports from public, anon, authenticated;

grant select, insert, update, delete on table public.leads, public.lead_consents,
  public.lead_events, public.outreach_enrollments, public.outreach_messages,
  public.outreach_calls, public.outreach_reports to service_role;

comment on table public.leads is 'One record per prospect for lead automation (lib/outreach).';
