-- Guest booking leads captured before auth, for incomplete-booking reminders.

create table if not exists public.booking_drafts (
  id uuid primary key default gen_random_uuid(),
  resume_token text not null unique,
  email text not null,
  user_id uuid references public.profiles(id) on delete set null,
  draft jsonb not null default '{}'::jsonb,
  current_step text,
  completed_booking_id uuid references public.bookings(id) on delete set null,
  completed_at timestamptz,
  reminder_count integer not null default 0
    check (reminder_count >= 0 and reminder_count <= 5),
  last_reminded_at timestamptz,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_drafts_email_format check (
    email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  )
);

create index if not exists booking_drafts_email_idx
  on public.booking_drafts (lower(email));

create index if not exists booking_drafts_reminder_idx
  on public.booking_drafts (updated_at)
  where completed_at is null
    and reminder_count < 2;

create index if not exists booking_drafts_user_idx
  on public.booking_drafts (user_id)
  where user_id is not null and completed_at is null;

alter table public.booking_drafts enable row level security;

comment on table public.booking_drafts is
  'Pre-auth booking drafts with email for abandoned-funnel reminders.';
