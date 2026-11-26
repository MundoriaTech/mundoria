-- What one cleaner is shown as their pay for one booking, when an admin wants
-- it to differ from the booking's real cleaner pay. Display only: payouts
-- still use bookings.amount_cleaner. Server (service role) access only.
create table if not exists public.booking_cleaner_pay_display (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  display_pence integer not null default 0 check (display_pence >= 0),
  note text,
  created_at timestamptz not null default now(),
  primary key (booking_id, cleaner_id)
);

alter table public.booking_cleaner_pay_display enable row level security;

-- One invoice number per booking, issued the first time the invoice is
-- downloaded and never reused. Numbers run in order: MUN-000001, MUN-000002…
create sequence if not exists public.booking_invoice_number_seq;

create table if not exists public.booking_invoices (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  invoice_number bigint not null unique
    default nextval('public.booking_invoice_number_seq'),
  issued_at timestamptz not null default now()
);

alter sequence public.booking_invoice_number_seq
  owned by public.booking_invoices.invoice_number;

alter table public.booking_invoices enable row level security;

-- Lucy is shown £0 for her 27 November 09:00 booking (admin request).
insert into public.booking_cleaner_pay_display (booking_id, cleaner_id, display_pence, note)
select '9125f5ce-baae-4f31-885f-e3d6b9c6d85e', 'c3983b4a-80c8-4d9a-bf73-14876c4b56b3', 0,
       'Admin asked for £0 to be shown on this booking'
 where exists (select 1 from public.bookings where id = '9125f5ce-baae-4f31-885f-e3d6b9c6d85e')
   and exists (select 1 from public.profiles where id = 'c3983b4a-80c8-4d9a-bf73-14876c4b56b3')
on conflict (booking_id, cleaner_id) do nothing;
