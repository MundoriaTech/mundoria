create table public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index admin_invitations_email_idx
  on public.admin_invitations (lower(email), status, created_at desc);

create index admin_invitations_pending_idx
  on public.admin_invitations (expires_at)
  where status = 'pending';

alter table public.admin_invitations enable row level security;

grant all on public.admin_invitations to service_role;
