-- The website keeps accepting callbacks if CRM is temporarily unavailable.
-- Keep source references only; the original callback row holds the contact data.
create table public.zoho_sales_intake (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  callback_id uuid not null references public.callback_leads(id) on delete cascade,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  completed_at timestamptz,
  zoho_lead_id text,
  last_error text
);

create index zoho_sales_intake_due_idx on public.zoho_sales_intake (next_attempt_at)
  where completed_at is null;

alter table public.zoho_sales_intake enable row level security;
revoke all on public.zoho_sales_intake from public, anon, authenticated;
grant select, insert, update on public.zoho_sales_intake to service_role;
