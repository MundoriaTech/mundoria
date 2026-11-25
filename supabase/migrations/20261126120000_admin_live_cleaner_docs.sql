-- Cleaner document uploads must refresh the admin portal as they land.
-- Cleaners already SELECT their own row; admins need SELECT for Realtime.

create policy "Admins can read cleaner profiles for live ops"
on public.cleaner_profiles for select
to authenticated
using (public.has_role('admin'::public.user_role));

create policy "Admins can read profiles for live ops"
on public.profiles for select
to authenticated
using (public.has_role('admin'::public.user_role));

do $$
declare
  t text;
begin
  foreach t in array array['cleaner_profiles', 'profiles']
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
