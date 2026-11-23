-- First-visit “book 2 hours, get 1 hour free”: stamp the callback lead and
-- keep the gifted hour on the first booking only (follow-ons drop it).

alter table public.callback_leads
  add column if not exists offer_redeemed_booking_id uuid
    references public.bookings (id) on delete set null,
  add column if not exists offer_redeemed_at timestamptz;

create index if not exists callback_leads_offer_unredeemed_idx
  on public.callback_leads (source, created_at desc)
  where offer_redeemed_booking_id is null;

alter table public.bookings
  add column if not exists offer_free_hours numeric not null default 0;

alter table public.bookings
  drop constraint if exists bookings_offer_free_hours_check;

alter table public.bookings
  add constraint bookings_offer_free_hours_check
    check (offer_free_hours >= 0 and offer_free_hours <= 4);

grant update (offer_redeemed_booking_id, offer_redeemed_at) on table public.callback_leads
  to service_role;
