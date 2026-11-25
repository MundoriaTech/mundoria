-- Seed / load-test accounts (*@seed.mundoria.local, scripts/seed-e2e.mjs)
-- share the live database. They must never be offered, reserved for, or
-- assigned to a real customer's booking, and real cleaners must never be
-- put on a seed customer's booking.
--
-- App code already filters (lib/matching/seed-accounts.ts). These triggers
-- make it impossible at the database level, whatever writes the row.
-- Only checked when the cleaner on a row is set or changed, so existing
-- history rows can still be updated (expired, closed, etc.).

create or replace function public.is_seed_account(account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.email ilike '%@seed.mundoria.local' from public.profiles p where p.id = account_id),
    false
  );
$$;

revoke all on function public.is_seed_account(uuid) from public, anon, authenticated;

create or replace function public.enforce_seed_isolation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_customer_id uuid;
  v_cleaner_ids uuid[];
  v_cleaner uuid;
begin
  if tg_table_name = 'bookings' then
    v_booking_id := new.id;
    v_customer_id := new.customer_id;
    v_cleaner_ids := array[]::uuid[];
    if new.cleaner_id is not null
       and (tg_op = 'INSERT' or new.cleaner_id is distinct from old.cleaner_id) then
      v_cleaner_ids := v_cleaner_ids || new.cleaner_id;
    end if;
    if new.preferred_cleaner_id is not null
       and (tg_op = 'INSERT' or new.preferred_cleaner_id is distinct from old.preferred_cleaner_id) then
      v_cleaner_ids := v_cleaner_ids || new.preferred_cleaner_id;
    end if;
  else
    if new.cleaner_id is null
       or (tg_op = 'UPDATE' and new.cleaner_id is not distinct from old.cleaner_id) then
      return new;
    end if;
    v_booking_id := new.booking_id;
    v_cleaner_ids := array[new.cleaner_id];
    select b.customer_id into v_customer_id from public.bookings b where b.id = v_booking_id;
  end if;

  if v_customer_id is null then
    return new;
  end if;

  foreach v_cleaner in array v_cleaner_ids loop
    if public.is_seed_account(v_cleaner) <> public.is_seed_account(v_customer_id) then
      raise exception
        'Seed isolation: cleaner % cannot be linked to booking % (test and real accounts must not mix)',
        v_cleaner, v_booking_id
        using errcode = 'check_violation';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists enforce_seed_isolation on public.bookings;
create trigger enforce_seed_isolation
  before insert or update of cleaner_id, preferred_cleaner_id, customer_id on public.bookings
  for each row execute function public.enforce_seed_isolation();

drop trigger if exists enforce_seed_isolation on public.cleaner_job_responses;
create trigger enforce_seed_isolation
  before insert or update of cleaner_id, booking_id on public.cleaner_job_responses
  for each row execute function public.enforce_seed_isolation();

drop trigger if exists enforce_seed_isolation on public.booking_emergency_list;
create trigger enforce_seed_isolation
  before insert or update of cleaner_id, booking_id on public.booking_emergency_list
  for each row execute function public.enforce_seed_isolation();

drop trigger if exists enforce_seed_isolation on public.booking_team_members;
create trigger enforce_seed_isolation
  before insert or update of cleaner_id, booking_id on public.booking_team_members
  for each row execute function public.enforce_seed_isolation();

-- Clean up real bookings that already have seed cleaners waiting in reserve,
-- so the expiry job can't offer them the next wave.
update public.booking_emergency_list el
set status = 'removed', updated_at = now()
from public.bookings b
where el.booking_id = b.id
  and el.status in ('reserve', 'notified')
  and public.is_seed_account(el.cleaner_id) <> public.is_seed_account(b.customer_id);
