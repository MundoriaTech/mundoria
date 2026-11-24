-- Durable website -> Calendar handoff. Applying this migration sends no emails.
-- Existing appointments are intentionally NOT backfilled without a reviewed list.
create table public.zoho_cleaner_calendar (
  cleaner_id uuid primary key references public.cleaner_profiles(id) on delete cascade,
  desired_start timestamptz,
  source_version bigint not null default 1,
  applied_version bigint not null default 0,
  state text not null default 'queued'
    check (state in ('queued', 'sending', 'synced', 'cancelled', 'needs_attention')),
  calendar_uid text,
  event_uid text,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  claim_token uuid,
  claimed_at timestamptz,
  synced_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
alter table public.zoho_cleaner_calendar enable row level security;
revoke all on public.zoho_cleaner_calendar from public, anon, authenticated;
grant select, insert, update on public.zoho_cleaner_calendar to service_role;
create index zoho_cleaner_calendar_due on public.zoho_cleaner_calendar(next_attempt_at)
  where state = 'queued';

create function public.queue_cleaner_calendar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target_start timestamptz;
begin
  -- Completing/failing the call records its outcome; it must not erase history
  -- or send a cancellation after the call. Explicitly clearing the slot, or
  -- resetting a booked call to not_started, is the cancellation instruction.
  if tg_op = 'UPDATE' and new.interview_scheduled_at is not distinct from old.interview_scheduled_at
     and not (new.interview_status = 'not_started' and old.interview_status = 'awaiting') then
    return new;
  end if;
  target_start := case when new.interview_status = 'not_started' then null else new.interview_scheduled_at end;
  if target_start is null and not exists (
    select 1 from public.zoho_cleaner_calendar where cleaner_id = new.id
  ) then return new; end if;
  insert into public.zoho_cleaner_calendar(cleaner_id, desired_start)
  values(new.id, target_start)
  on conflict(cleaner_id) do update set
    desired_start = excluded.desired_start,
    source_version = public.zoho_cleaner_calendar.source_version + 1,
    -- Keep a running lease and uncertain outcomes intact. Neither may be retried
    -- as a fresh POST merely because the website has changed again.
    state = case when public.zoho_cleaner_calendar.state in ('sending', 'needs_attention')
      then public.zoho_cleaner_calendar.state else 'queued' end,
    next_attempt_at = now(), updated_at = now();
  return new;
end $$;
revoke all on function public.queue_cleaner_calendar() from public, anon, authenticated;
create trigger queue_cleaner_calendar_after_save
  after insert or update of interview_scheduled_at, interview_status on public.cleaner_profiles
  for each row execute function public.queue_cleaner_calendar();

create function public.claim_cleaner_calendar(p_cleaner_id uuid default null)
returns setof public.zoho_cleaner_calendar
language plpgsql security definer set search_path = '' as $$
begin
  -- A worker could have crashed after Zoho sent an invitation. Never auto-retry
  -- an expired write lease: Operations must reconcile it with the calendar.
  update public.zoho_cleaner_calendar set state = 'needs_attention',
    last_error = 'PREVIOUS_ATTEMPT_UNCONFIRMED', updated_at = now()
  where state = 'sending' and claimed_at < now() - interval '5 minutes';
  return query
  with due as (
    select q.cleaner_id from public.zoho_cleaner_calendar q
    where q.state = 'queued' and q.next_attempt_at <= now()
      and (p_cleaner_id is null or q.cleaner_id = p_cleaner_id)
    order by q.next_attempt_at limit 1 for update skip locked
  )
  update public.zoho_cleaner_calendar q set state = 'sending', claim_token = gen_random_uuid(),
    claimed_at = now(), attempts = q.attempts + 1, updated_at = now()
  from due where q.cleaner_id = due.cleaner_id returning q.*;
end $$;

create function public.finish_cleaner_calendar(
  p_cleaner_id uuid, p_claim_token uuid, p_version bigint, p_state text,
  p_calendar_uid text, p_event_uid text, p_error text default null
) returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  if p_state not in ('queued', 'synced', 'cancelled', 'needs_attention') then
    raise exception 'Invalid calendar result';
  end if;
  update public.zoho_cleaner_calendar q set
    state = case when p_state in ('synced','cancelled') and q.source_version <> p_version
      then 'queued' else p_state end,
    applied_version = case when p_state in ('synced','cancelled') then p_version else q.applied_version end,
    calendar_uid = coalesce(p_calendar_uid, q.calendar_uid), event_uid = p_event_uid,
    claim_token = null, claimed_at = null, last_error = p_error,
    synced_at = case when p_state in ('synced','cancelled') then now() else q.synced_at end,
    next_attempt_at = case when p_state = 'queued' then now() + interval '15 minutes' else now() end,
    updated_at = now()
  where q.cleaner_id = p_cleaner_id and q.claim_token = p_claim_token;
  get diagnostics changed = row_count;
  return changed = 1;
end $$;
revoke all on function public.claim_cleaner_calendar(uuid) from public, anon, authenticated;
revoke all on function public.finish_cleaner_calendar(uuid,uuid,bigint,text,text,text,text) from public, anon, authenticated;
grant execute on function public.claim_cleaner_calendar(uuid) to service_role;
grant execute on function public.finish_cleaner_calendar(uuid,uuid,bigint,text,text,text,text) to service_role;
