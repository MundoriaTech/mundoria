-- notify_admins runs on disputes, payouts, and bookings. PL/pgSQL does not
-- short-circuit AND, so a payout insert was reading bookings.scheduled_date
-- and checkout failed after the card had already been captured.

create or replace function public.notify_admins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  alert_title text;
  alert_body text;
  alert_type text;
  entity_id uuid;
begin
  if tg_table_name = 'disputes' then
    if tg_op = 'INSERT' then
      alert_title := 'New dispute raised';
      alert_body := left(new.description, 180);
      alert_type := 'new_dispute';
      entity_id := new.booking_id;
    else
      return new;
    end if;
  elsif tg_table_name = 'payouts' then
    if new.status::text = 'failed' then
      alert_title := 'Payout failed';
      alert_body := 'A cleaner payout requires attention.';
      alert_type := 'payout_failed';
      entity_id := new.id;
    else
      return new;
    end if;
  elsif tg_table_name = 'bookings' then
    if new.status::text = 'cancelled'
      and old.status is distinct from new.status
      and (new.scheduled_date + new.scheduled_start_time) <=
        (now() + interval '6 hours')
    then
      alert_title := 'Late cancellation';
      alert_body := 'A booking was cancelled within six hours of its scheduled start.';
      alert_type := 'late_cancellation';
      entity_id := new.id;
    else
      return new;
    end if;
  else
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  select
    p.id,
    alert_type,
    alert_title,
    alert_body,
    jsonb_build_object('entity_id', entity_id)
  from public.profiles p
  where p.role = 'admin';

  insert into public.admin_alert_queue (type, title, body, data)
  values (
    alert_type,
    alert_title,
    alert_body,
    jsonb_build_object('entity_id', entity_id)
  );

  return new;
end;
$$;

revoke all on function public.notify_admins() from public;
