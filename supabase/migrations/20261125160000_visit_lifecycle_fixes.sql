-- Visit lifecycle fixes (25 Nov 2026).

-- Waiting charge (access penalty) is collected as its own off-session
-- payment after the main capture, instead of being added to amount_total
-- without ever being charged.
alter table public.bookings
  add column if not exists access_penalty_payment_intent_id text,
  add column if not exists access_penalty_charged_at timestamptz;

-- A failed capture is recorded once (no 15-minute retry loop).
alter table public.bookings
  add column if not exists payment_capture_failed_at timestamptz,
  add column if not exists payment_capture_failure_reason text;

-- An open dispute pauses the next-day capture until an admin resolves it.
alter table public.bookings
  add column if not exists payment_capture_paused_at timestamptz;

-- Which booking charge each part of a cleaner payout comes from, so each
-- transfer can name its source charge (Stripe then pays it out when that
-- charge's funds settle instead of failing on available balance).
create table if not exists public.payout_items (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.payouts(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete restrict,
  kind text not null default 'visit' check (kind in ('visit', 'waiting_charge')),
  amount numeric(12, 0) not null check (amount >= 0),
  stripe_charge_id text,
  stripe_transfer_id text,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  unique (payout_id, booking_id, kind)
);

create index if not exists payout_items_payout_id_idx on public.payout_items (payout_id);

alter table public.payout_items enable row level security;

create policy "Cleaners read own payout items"
on public.payout_items for select
to authenticated
using (cleaner_id = auth.uid());

grant select on public.payout_items to authenticated;
grant all on public.payout_items to service_role;
