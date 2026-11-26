-- Tips are paid to the cleaner in full as their own payout line.
alter table public.payout_items drop constraint if exists payout_items_kind_check;
alter table public.payout_items
  add constraint payout_items_kind_check
  check (kind = any (array['visit'::text, 'waiting_charge'::text, 'extra_time'::text, 'tip'::text]));
