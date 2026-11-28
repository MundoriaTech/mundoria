-- When the visit's date or time last changed (customer reschedule or an
-- edit). The no-cleaner cutoff treats a visit moved to less than 24 hours
-- away like a short-notice booking, so it keeps looking until 2 hours before.
alter table public.bookings
  add column if not exists schedule_changed_at timestamptz;
