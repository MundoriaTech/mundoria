-- Database-level guarantee for protected bookings: they can only be
-- cancelled by a person (the change must record cancelled_by). Automatic
-- jobs never set cancelled_by, so they fail here whatever app version runs.
create or replace function public.guard_auto_cancel_exempt()
returns trigger
language plpgsql
as $$
begin
  if old.auto_cancel_exempt
     and new.status = 'cancelled'
     and old.status is distinct from 'cancelled'
     and new.cancelled_by is null then
    raise exception 'Booking % is protected from automatic cancellation', old.id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_auto_cancel_exempt on public.bookings;
create trigger guard_auto_cancel_exempt
  before update of status on public.bookings
  for each row execute function public.guard_auto_cancel_exempt();
