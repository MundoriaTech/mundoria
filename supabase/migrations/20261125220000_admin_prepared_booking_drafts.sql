-- Bookings an admin prepares for a customer (assisted booking). The customer
-- opens the draft link, checks it and adds their card. Prepared drafts are
-- excluded from "you didn't finish your booking" reminders.
alter table public.booking_drafts
  add column if not exists prepared_by uuid references public.profiles(id) on delete set null,
  add column if not exists prepared_at timestamptz;

-- Who created a customer's account on their behalf, if anyone.
alter table public.profiles
  add column if not exists created_by_admin uuid references public.profiles(id) on delete set null;
