-- Cleaner signup email OTP challenges (account is created only after verify).

create table if not exists public.email_signup_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null,
  ip_hash text not null,
  code_hash text not null,
  payload_ciphertext text not null,
  payload_iv text not null,
  payload_tag text not null,
  attempts integer not null default 0,
  send_count integer not null default 1,
  expires_at timestamptz not null,
  last_sent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint email_signup_challenges_email_normalized_key unique (email_normalized)
);

create index if not exists email_signup_challenges_ip_created_idx
  on public.email_signup_challenges (ip_hash, created_at desc);

create index if not exists email_signup_challenges_expires_idx
  on public.email_signup_challenges (expires_at);

alter table public.email_signup_challenges enable row level security;

revoke all on public.email_signup_challenges from anon, authenticated;

comment on table public.email_signup_challenges is
  'Pending cleaner email/password signups awaiting email OTP. Service role only.';
