-- What one cleaner is actually paid for one booking, when an admin sets it
-- (instead of bookings.amount_cleaner). It is the cleaner's whole pay for
-- the booking: extra time, tips and waiting charges add nothing on top.
-- Server (service role) access only.
create table if not exists public.booking_cleaner_pay_overrides (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  pay_pence integer not null default 0 check (pay_pence >= 0),
  note text,
  created_at timestamptz not null default now(),
  primary key (booking_id, cleaner_id)
);

alter table public.booking_cleaner_pay_overrides enable row level security;

-- Lucy is paid £0 for her 27 November booking (admin request).
insert into public.booking_cleaner_pay_overrides (booking_id, cleaner_id, pay_pence, note)
select '9125f5ce-baae-4f31-885f-e3d6b9c6d85e', 'c3983b4a-80c8-4d9a-bf73-14876c4b56b3', 0,
       'Admin asked for Lucy to be paid £0 for this booking'
 where exists (select 1 from public.bookings where id = '9125f5ce-baae-4f31-885f-e3d6b9c6d85e')
   and exists (select 1 from public.profiles where id = 'c3983b4a-80c8-4d9a-bf73-14876c4b56b3')
on conflict (booking_id, cleaner_id) do update set pay_pence = 0, note = excluded.note;
