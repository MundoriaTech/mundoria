-- Ads callback leads from /book-2-get-1-free (and future sources).
-- Inserts go through the service-role API only.

create table public.callback_leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  available_in_10_min boolean not null,
  source text not null default 'book-2-get-1-free',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint callback_leads_first_name_check check (char_length(first_name) between 1 and 80),
  constraint callback_leads_last_name_check check (char_length(last_name) between 1 and 80),
  constraint callback_leads_phone_check check (char_length(phone) between 7 and 40),
  constraint callback_leads_email_check check (char_length(email) between 3 and 254),
  constraint callback_leads_source_check check (char_length(source) between 1 and 80)
);

create index callback_leads_created_at_idx on public.callback_leads (created_at desc);

alter table public.callback_leads enable row level security;

revoke all on table public.callback_leads from public;
revoke all on table public.callback_leads from anon, authenticated;
grant select, insert on table public.callback_leads to service_role;
