-- How the cleaner gets in for this visit (key safe, concierge, parking),
-- added or changed by the customer from Manage booking.
alter table public.bookings
  add column if not exists access_instructions text
  check (access_instructions is null or char_length(access_instructions) <= 1000);
