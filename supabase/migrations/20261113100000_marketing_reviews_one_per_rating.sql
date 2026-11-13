-- marketing_reviews previously joined cleaner_working_areas without limiting
-- rows, so a cleaner covering B1 + B3 (both Jewellery Quarter) made every
-- review appear twice with the same author, comment, and place label.
-- Locality now comes from the booking address (one row per rating).

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
  coalesce(
    upper(split_part(trim(addr.postcode), ' ', 1)),
    area.postcode_prefix
  ) as postcode_prefix
from public.ratings r
join public.profiles customer on customer.id = r.customer_id
join public.profiles cleaner on cleaner.id = r.cleaner_id
join public.cleaner_profiles cleaner_profile on cleaner_profile.id = cleaner.id
join public.bookings b on b.id = r.booking_id
left join public.addresses addr on addr.id = b.address_id
left join lateral (
  select wa.postcode_prefix
  from public.cleaner_working_areas wa
  where wa.cleaner_id = cleaner.id
    and wa.postcode_prefix in ('B1', 'B3', 'B13', 'B14', 'B15', 'B16', 'B17', 'B29')
  order by wa.postcode_prefix
  limit 1
) area on true
where r.application_status = 'applied'
  and r.comment is not null
  and btrim(r.comment) <> ''
  and r.comment <> 'Seeded review for load testing.'
  and coalesce(
    upper(split_part(trim(addr.postcode), ' ', 1)),
    area.postcode_prefix
  ) in ('B1', 'B3', 'B13', 'B14', 'B15', 'B16', 'B17', 'B29')
  and (
    (
      customer.email not ilike '%@seed.mundoria.local'
      and cleaner.email not ilike '%@seed.mundoria.local'
    )
    or cleaner_profile.show_on_directory
  );

revoke all on public.marketing_reviews from public;
grant select on public.marketing_reviews to anon, authenticated;
