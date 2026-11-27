-- Every change to a booking's details after it was made, by an admin or the
-- customer: what changed, why, and the values before and after so the edit
-- can be shown in the booking's history and undone.
create table if not exists public.booking_edits (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_type text not null check (actor_type in ('admin', 'customer')),
  actor_id uuid references public.profiles(id) on delete set null,
  reason text,
  -- [{ field, from, to }] in words, as shown to people.
  changes jsonb not null default '[]'::jsonb,
  -- Booking columns as they were before, and as the edit set them.
  before_values jsonb not null default '{}'::jsonb,
  after_values jsonb not null default '{}'::jsonb,
  -- Extras rows before and after, when the edit changed them.
  add_ons_before jsonb,
  add_ons_after jsonb,
  previous_payment_intent_id text,
  new_payment_intent_id text,
  cleaner_must_reconfirm boolean not null default false,
  -- Set on the edit an undo reverses, and on the undo itself.
  undone_at timestamptz,
  undone_by uuid references public.profiles(id) on delete set null,
  undo_of uuid references public.booking_edits(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists booking_edits_booking_idx
  on public.booking_edits(booking_id, created_at desc);

-- Read and written by the server only (service role).
alter table public.booking_edits enable row level security;
