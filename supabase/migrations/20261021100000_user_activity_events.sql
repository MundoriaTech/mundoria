-- First-party post-signup journey events for admin customer/cleaner timelines.
create table public.user_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_name text not null,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index user_activity_events_user_created_idx
  on public.user_activity_events(user_id, created_at desc);

create index user_activity_events_name_created_idx
  on public.user_activity_events(event_name, created_at desc);

alter table public.user_activity_events enable row level security;

grant all on public.user_activity_events to service_role;
