-- Offer and team rows need to be in the realtime publication so a cleaner
-- dashboard can update as soon as a job is offered or a team slot opens.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cleaner_job_responses'
  ) then
    alter publication supabase_realtime add table public.cleaner_job_responses;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'booking_team_members'
  ) then
    alter publication supabase_realtime add table public.booking_team_members;
  end if;
end;
$$;
