create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status public.booking_status,
  to_status public.booking_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table public.matching_decisions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  cleaner_id uuid references public.profiles(id) on delete set null,
  decision text not null,
  score numeric,
  reasons jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  id boolean primary key default true check (id),
  platform_commission_percent numeric(5, 2) not null default 20
    check (platform_commission_percent between 0 and 100),
  geofence_radius_meters integer not null default 200 check (geofence_radius_meters > 0),
  cancellation_window_hours integer not null default 6 check (cancellation_window_hours >= 0),
  support_email text,
  updated_at timestamptz not null default now()
);

create table public.admin_alert_queue (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (true)
on conflict (id) do nothing;

create index booking_status_history_booking_idx
  on public.booking_status_history(booking_id, created_at);
create index matching_decisions_booking_idx
  on public.matching_decisions(booking_id, created_at);
create index admin_action_logs_entity_idx
  on public.admin_action_logs(entity_type, entity_id, created_at);

create function public.record_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.booking_status_history (
      booking_id,
      from_status,
      to_status,
      changed_by
    )
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger bookings_record_status_change
after update of status on public.bookings
for each row execute function public.record_booking_status_change();

create function public.notify_admins()
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
  if tg_table_name = 'disputes' and tg_op = 'INSERT' then
    alert_title := 'New dispute raised';
    alert_body := left(new.description, 180);
    alert_type := 'new_dispute';
    entity_id := new.booking_id;
  elsif tg_table_name = 'payouts' and new.status::text = 'failed' then
    alert_title := 'Payout failed';
    alert_body := 'A cleaner payout requires attention.';
    alert_type := 'payout_failed';
    entity_id := new.id;
  elsif tg_table_name = 'bookings'
    and new.status::text = 'cancelled'
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

create trigger disputes_notify_admins
after insert on public.disputes
for each row execute function public.notify_admins();

create trigger failed_payouts_notify_admins
after insert or update of status on public.payouts
for each row execute function public.notify_admins();

create trigger late_cancellations_notify_admins
after update of status on public.bookings
for each row execute function public.notify_admins();

revoke all on function public.record_booking_status_change() from public;
revoke all on function public.notify_admins() from public;

alter table public.booking_status_history enable row level security;
alter table public.matching_decisions enable row level security;
alter table public.admin_action_logs enable row level security;
alter table public.platform_settings enable row level security;
alter table public.admin_alert_queue enable row level security;

grant all on public.booking_status_history to service_role;
grant all on public.matching_decisions to service_role;
grant all on public.admin_action_logs to service_role;
grant all on public.platform_settings to service_role;
grant all on public.admin_alert_queue to service_role;
