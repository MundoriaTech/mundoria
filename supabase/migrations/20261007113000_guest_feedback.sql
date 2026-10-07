-- Feedback from clients whose clean was arranged outside the app.
-- The public link is a signed token. This table stores the reply only.

create table public.guest_feedback (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  client_name text not null,
  service_label text not null,
  service_date date not null,
  invoice_number text,
  mood text not null check (mood in ('excellent', 'good', 'fair', 'bad', 'awful')),
  comment text check (comment is null or char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.guest_feedback enable row level security;

revoke all on table public.guest_feedback from public;
revoke all on table public.guest_feedback from anon, authenticated;
grant select, insert on table public.guest_feedback to service_role;
