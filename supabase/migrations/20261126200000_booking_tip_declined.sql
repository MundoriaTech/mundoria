-- When the customer chose not to tip, so the tip prompt stays hidden on
-- every device.
alter table public.bookings add column if not exists tip_declined_at timestamptz;
