-- Per-admin access to admin sections, keyed by email so a rule also applies
-- to an admin who is invited later. `grants` opens restricted sections
-- (e.g. meta_leads); `blocks` hides sections every admin normally sees
-- (e.g. leads, callback_leads). Service role only.
create table if not exists public.admin_access_rules (
  email text primary key check (email = lower(email)),
  grants text[] not null default '{}',
  blocks text[] not null default '{}',
  note text,
  updated_at timestamptz not null default now()
);
alter table public.admin_access_rules enable row level security;
revoke all on public.admin_access_rules from anon, authenticated;
grant all on public.admin_access_rules to service_role;

-- What was taken off this booking's price (promo code or an offer such as
-- 20% off the first clean). Repeat visits are priced without it.
alter table public.bookings
  add column if not exists discount_pence integer not null default 0 check (discount_pence >= 0),
  add column if not exists offer_kind text;
