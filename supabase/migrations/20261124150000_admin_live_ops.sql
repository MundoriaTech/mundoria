-- Admin browser sessions need SELECT (RLS) so Realtime can push ops-table
-- changes. Writes stay on the service-role APIs.

create policy "Admins can read bookings for live ops"
on public.bookings for select
to authenticated
using (public.has_role('admin'::public.user_role));

create policy "Admins can read booking add-ons for live ops"
on public.booking_add_ons for select
to authenticated
using (public.has_role('admin'::public.user_role));

create policy "Admins can read matching decisions for live ops"
on public.matching_decisions for select
to authenticated
using (public.has_role('admin'::public.user_role));

create policy "Admins can read booking status history for live ops"
on public.booking_status_history for select
to authenticated
using (public.has_role('admin'::public.user_role));

create policy "Admins can read job responses for live ops"
on public.cleaner_job_responses for select
to authenticated
using (public.has_role('admin'::public.user_role));

create policy "Admins can read team members for live ops"
on public.booking_team_members for select
to authenticated
using (public.has_role('admin'::public.user_role));

create policy "Admins can read messages for live ops"
on public.messages for select
to authenticated
using (public.has_role('admin'::public.user_role));

create policy "Admins can read disputes for live ops"
on public.disputes for select
to authenticated
using (public.has_role('admin'::public.user_role));

grant select on public.matching_decisions to authenticated;
grant select on public.booking_status_history to authenticated;

grant select on public.callback_leads to authenticated;
create policy "Admins can read callback leads for live ops"
on public.callback_leads for select
to authenticated
using (public.has_role('admin'::public.user_role));

grant select on public.leads to authenticated;
create policy "Admins can read leads for live ops"
on public.leads for select
to authenticated
using (public.has_role('admin'::public.user_role));

grant select on public.booking_drafts to authenticated;
create policy "Admins can read booking drafts for live ops"
on public.booking_drafts for select
to authenticated
using (public.has_role('admin'::public.user_role));

grant select on public.support_conversations to authenticated;
grant select on public.support_messages to authenticated;
create policy "Admins can read support conversations for live ops"
on public.support_conversations for select
to authenticated
using (public.has_role('admin'::public.user_role));
create policy "Admins can read support messages for live ops"
on public.support_messages for select
to authenticated
using (public.has_role('admin'::public.user_role));

do $$
declare
  t text;
begin
  foreach t in array array[
    'matching_decisions',
    'booking_status_history',
    'booking_add_ons',
    'callback_leads',
    'leads',
    'booking_drafts',
    'disputes',
    'support_conversations',
    'support_messages'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
    end if;
  end loop;
end;
$$;
