-- Curate which seed cleaners can appear on public marketing directory pages.
-- Load-test accounts stay hidden unless show_on_directory is set (seed scripts
-- mark a shortlist of ~24). Live non-seed cleaners remain listed as before.

alter table public.cleaner_profiles
  add column if not exists show_on_directory boolean not null default false;

comment on column public.cleaner_profiles.show_on_directory is
  'When true, this cleaner may appear on public marketing directory surfaces even if the account is a seed identity.';

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
  and (
    p.email not ilike '%@seed.mundoria.local'
    or cp.show_on_directory
  )
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
join public.cleaner_profiles cleaner_profile on cleaner_profile.id = cleaner.id
join public.bookings b on b.id = r.booking_id
join public.cleaner_working_areas wa
  on wa.cleaner_id = cleaner.id
 and wa.postcode_prefix in ('B1', 'B3', 'B13', 'B14', 'B15', 'B16', 'B17', 'B29')
where r.application_status = 'applied'
  and r.comment is not null
  and btrim(r.comment) <> ''
  and r.comment <> 'Seeded review for load testing.'
  and (
    (
      customer.email not ilike '%@seed.mundoria.local'
      and cleaner.email not ilike '%@seed.mundoria.local'
    )
    or cleaner_profile.show_on_directory
  );

revoke all on public.marketing_cleaners from public;
revoke all on public.marketing_reviews from public;
grant select on public.marketing_cleaners to anon, authenticated;
grant select on public.marketing_reviews to anon, authenticated;
