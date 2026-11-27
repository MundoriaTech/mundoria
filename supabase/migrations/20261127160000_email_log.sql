-- One row per email sent (or not sent) to one recipient, so admins can see
-- what someone was told and whether it arrived. No email bodies are kept:
-- the template and booking are enough to know what was said. Rows older
-- than 12 months are deleted by the capture-payments cron.
-- Server (service role) access only.
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  subject text,
  user_id uuid references public.profiles(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  -- Only when the recipient has no account (e.g. the ops inbox).
  recipient_email text,
  provider_message_id text,
  status text not null
    check (status in ('sent', 'failed', 'skipped', 'delivered', 'delivery_delayed', 'bounced', 'complained')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_log_booking_idx on public.email_log (booking_id, created_at desc);
create index if not exists email_log_user_idx on public.email_log (user_id, created_at desc);
create index if not exists email_log_provider_idx on public.email_log (provider_message_id);
create index if not exists email_log_created_idx on public.email_log (created_at);

alter table public.email_log enable row level security;

-- When the "please confirm your clean" reminder went to the customer.
alter table public.bookings
  add column if not exists confirmation_reminder_sent_at timestamptz;
