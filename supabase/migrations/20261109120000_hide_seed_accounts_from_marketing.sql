-- Keep demo / load-test seed accounts off the public website.
-- The hosted database is shared by the live site and the e2e seed data
-- (scripts/seed-e2e.mjs, *@seed.mundoria.local). Public marketing pages
-- read only these two views, so excluding seed accounts here removes demo
-- cleaners (for example "Isla F.") and seeded reviews from every public page
-- and from the public cleaner profile URLs, without touching the seed data
-- itself or any signed-in screens.
--
-- Same columns and order as 20261015120000_marketing_cleaner_radius.sql and
-- 20261005180000_seed_demo_names.sql, so CREATE OR REPLACE is safe.

create or replace view public.marketing_cleaners
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
  and p.email not ilike '%@seed.mundoria.local'
  and exists (
    select 1
    from public.cleaner_working_areas wa
    where wa.cleaner_id = p.id
      and wa.postcode_prefix ~* '^B'
  );

create or replace view public.marketing_reviews
with (security_barrier = true, security_invoker = false) as
select
  r.id,
  r.comment,
  r.overall_score,
  r.created_at,
  split_part(customer.full_name, ' ', 1) as author_first_name,
  cleaner.full_name as cleaner_name,
  cleaner.id as cleaner_id,
  b.service_type::text as service_type,
  wa.postcode_prefix
from public.ratings r
join public.profiles customer on customer.id = r.customer_id
join public.profiles cleaner on cleaner.id = r.cleaner_id
join public.bookings b on b.id = r.booking_id
join public.cleaner_working_areas wa
  on wa.cleaner_id = cleaner.id
 and wa.postcode_prefix in ('B1', 'B3', 'B13', 'B14', 'B15', 'B16', 'B17', 'B29')
where r.application_status = 'applied'
  and r.comment is not null
  and btrim(r.comment) <> ''
  and r.comment <> 'Seeded review for load testing.'
  and customer.email not ilike '%@seed.mundoria.local'
  and cleaner.email not ilike '%@seed.mundoria.local';

revoke all on public.marketing_cleaners from public;
revoke all on public.marketing_reviews from public;
grant select on public.marketing_cleaners to anon, authenticated;
grant select on public.marketing_reviews to anon, authenticated;
