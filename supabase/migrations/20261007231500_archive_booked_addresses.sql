-- A saved address cannot be deleted while a booking points at it.
-- Removing it from the customer's list archives the row instead, so past
-- and upcoming cleans keep the address they were booked against.

alter table public.addresses
  add column if not exists archived_at timestamptz;

create or replace function public.archive_address_when_booked()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.bookings
    where address_id = old.id
  ) then
    update public.addresses
    set
      archived_at = coalesce(archived_at, now()),
      is_default = false
    where id = old.id;
    return null;
  end if;

  return old;
end;
$$;

drop trigger if exists addresses_archive_when_booked on public.addresses;

create trigger addresses_archive_when_booked
before delete on public.addresses
for each row execute function public.archive_address_when_booked();
