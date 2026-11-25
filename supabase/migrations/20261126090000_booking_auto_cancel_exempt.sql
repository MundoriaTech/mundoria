-- Bookings an admin has protected from every automatic cancellation
-- (match cutoff, unanswered offers, failed card holds, no replacement).
-- People can still cancel them by hand.
alter table public.bookings
  add column if not exists auto_cancel_exempt boolean not null default false;
