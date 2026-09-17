-- Team members count as booking participants (messages, checklist, etc.)
create or replace function public.is_booking_participant(target_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = target_booking_id
      and auth.uid() in (b.customer_id, b.cleaner_id)
  )
  or exists (
    select 1
    from public.booking_team_members t
    where t.booking_id = target_booking_id
      and t.cleaner_id = auth.uid()
  );
$$;
