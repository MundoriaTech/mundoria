-- Platform support inbox (Intercom-style messenger → admin).
-- Separate from booking-scoped public.messages.

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  guest_token text,
  guest_name text,
  guest_email text,
  status text not null default 'open'
    check (status in ('open', 'closed')),
  subject text,
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  unread_admin integer not null default 0,
  unread_user integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_conversations_identity check (
    user_id is not null or guest_token is not null
  )
);

create index if not exists support_conversations_last_message_idx
  on public.support_conversations (last_message_at desc);
create index if not exists support_conversations_user_idx
  on public.support_conversations (user_id)
  where user_id is not null;
create index if not exists support_conversations_guest_idx
  on public.support_conversations (guest_token)
  where guest_token is not null;
create index if not exists support_conversations_status_idx
  on public.support_conversations (status, last_message_at desc);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.support_conversations (id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'admin', 'system')),
  sender_id uuid references public.profiles (id) on delete set null,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists support_messages_conversation_idx
  on public.support_messages (conversation_id, created_at asc);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

revoke all on table public.support_conversations from public;
revoke all on table public.support_conversations from anon, authenticated;
revoke all on table public.support_messages from public;
revoke all on table public.support_messages from anon, authenticated;

grant select, insert, update on table public.support_conversations to service_role;
grant select, insert, update on table public.support_messages to service_role;

comment on table public.support_conversations is
  'Mundoria support messenger threads (guest or signed-in). Admin replies via /admin/inbox.';
comment on table public.support_messages is
  'Messages within a support_conversations thread.';
