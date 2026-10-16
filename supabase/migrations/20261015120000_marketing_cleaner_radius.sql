-- Expose each cleaner's working radius on public marketing cards.
-- DROP + CREATE required: CREATE OR REPLACE cannot insert a column mid-list.
drop view if exists public.marketing_cleaners;

create view public.marketing_cleaners
with (security_barrier = true, security_invoker = false) as
select
  p.id,
  p.full_name,
  p.avatar_url,
  cp.bio,
  cp.rating,
  cp.total_jobs,
  cp.years_experience,
  coalesce(areas.prefixes, '{}'::text[]) as postcode_prefixes,
  coalesce(services.service_types, '{}'::text[]) as service_types,
  cp.working_radius_km
from public.profiles p
join public.cleaner_profiles cp
  on cp.id = p.id
 and cp.status = 'active'
left join lateral (
  select array_agg(distinct wa.postcode_prefix) as prefixes
  from public.cleaner_working_areas wa
  where wa.cleaner_id = p.id
    and wa.postcode_prefix is not null
) areas on true
left join lateral (
  select array_agg(distinct cs.service_type::text) as service_types
  from public.cleaner_services cs
  where cs.cleaner_id = p.id
    and cs.is_active
) services on true
where p.role = 'cleaner'
  and exists (
    select 1
    from public.cleaner_working_areas wa
    where wa.cleaner_id = p.id
      and wa.postcode_prefix ~* '^B'
  );

revoke all on public.marketing_cleaners from public;
grant select on public.marketing_cleaners to anon, authenticated;
