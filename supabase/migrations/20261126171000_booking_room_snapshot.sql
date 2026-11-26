-- Rooms and property type as they were when the booking was made. The
-- addresses row is shared and rewritten by later bookings, so admin used to
-- show (and price) old bookings with today's room counts.
alter table public.bookings
  add column if not exists booked_num_bedrooms integer,
  add column if not exists booked_num_bathrooms integer,
  add column if not exists booked_num_other_rooms integer,
  add column if not exists booked_other_room_types text[],
  add column if not exists booked_property_type public.property_type;
