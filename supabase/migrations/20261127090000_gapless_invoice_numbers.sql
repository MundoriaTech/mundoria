-- Gapless invoice numbers. The sequence default handed out a number on every
-- insert attempt, including repeat downloads that were then discarded, which
-- left holes in the series. A locked counter row is only advanced when an
-- invoice is actually issued.
create table if not exists public.booking_invoice_counter (
  id boolean primary key default true check (id),
  last_number bigint not null
);

insert into public.booking_invoice_counter (id, last_number)
select true, coalesce(max(invoice_number), 0) from public.booking_invoices
on conflict (id) do nothing;

alter table public.booking_invoice_counter enable row level security;

alter table public.booking_invoices alter column invoice_number drop default;

-- Returns the booking's invoice number, issuing the next one only if it has none.
create or replace function public.issue_booking_invoice(p_booking_id uuid)
returns table (invoice_number bigint, issued_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last bigint;
begin
  -- Lock first, so two simultaneous calls can't both issue a number.
  select c.last_number into v_last
    from public.booking_invoice_counter c
   where c.id
   for update;

  return query
    select bi.invoice_number, bi.issued_at
      from public.booking_invoices bi
     where bi.booking_id = p_booking_id;
  if found then
    return;
  end if;

  update public.booking_invoice_counter set last_number = v_last + 1 where id;
  return query
    insert into public.booking_invoices (booking_id, invoice_number)
    values (p_booking_id, v_last + 1)
    returning booking_invoices.invoice_number, booking_invoices.issued_at;
end;
$$;

revoke all on function public.issue_booking_invoice(uuid) from public, anon, authenticated;
grant execute on function public.issue_booking_invoice(uuid) to service_role;
