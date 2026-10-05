-- Ordinary names for numbered demo accounts, plus Birmingham district
-- coverage, bios, photos and reviews so public location pages have real rows.

create or replace function public.demo_person_name(n integer)
returns text
language sql
immutable
as $$
  select first_names[1 + ((greatest(n, 1) - 1) % cardinality(first_names))]
    || ' '
    || last_names[
      1 + (
        ((greatest(n, 1) - 1) / cardinality(first_names))
        % cardinality(last_names)
      )
    ]
  from (
    select
      array[
        'Amara','James','Priya','Daniel','Olivia','Noah','Fatima','Marcus',
        'Elena','Owen','Hannah','Hassan','Sophie','Callum','Aisha','Leo',
        'Grace','Samuel','Mei','Yusuf','Nia','Ben','Chloe','Arjun',
        'Freya','Elliot','Yasmin','Jack','Lucy','Omar','Hana','Felix',
        'Ruth','Harry','Zara','Kwame','Imogen','Nathan','Leila','Oscar',
        'Maya','Rohan','Nora','Theo','Isla','William','Keisha','Adam'
      ]::text[] as first_names,
      array[
        'Adeyemi','Bennett','Chowdhury','Davies','Edwards','Farooq','Gallagher',
        'Hussain','Iqbal','Jones','Khan','Lawson','Mensah','Nkosi','Okonkwo',
        'Patel','Quinn','Rahman','Singh','Thompson','Uddin','Vaughan','Walker',
        'Yusuf','Zhang','Brooks','Carter','Doyle','Ellis','Foster'
      ]::text[] as last_names
  ) lists;
$$;

create or replace function public.demo_person_gender(n integer)
returns text
language sql
immutable
as $$
  select case
    when ((greatest(n, 1) - 1) % 48) % 2 = 0 then 'woman'
    else 'man'
  end;
$$;

revoke all on function public.demo_person_name(integer) from public;
revoke all on function public.demo_person_gender(integer) from public;

-- Numbered seed users: customer0007 / cleaner0040 style display names.
update public.profiles p
set full_name = public.demo_person_name(
  case
    when p.email like 'cleaner%' then substring(p.email from '[0-9]+')::integer + 240
    else substring(p.email from '[0-9]+')::integer
  end
)
where p.email ~ '^(customer|cleaner)[0-9]+@seed\.mundoria\.local$';

update auth.users u
set raw_user_meta_data = jsonb_set(
  coalesce(u.raw_user_meta_data, '{}'::jsonb),
  '{full_name}',
  to_jsonb(
    public.demo_person_name(
      case
        when u.email like 'cleaner%' then substring(u.email from '[0-9]+')::integer + 240
        else substring(u.email from '[0-9]+')::integer
      end
    )
  ),
  true
)
where u.email ~ '^(customer|cleaner)[0-9]+@seed\.mundoria\.local$';

update public.profiles
set full_name = 'Sophie Bennett'
where email = 'demo.customer@seed.mundoria.local'
  and full_name in ('Demo Customer', 'Customer');

update public.profiles
set full_name = 'Hannah Adeyemi'
where email = 'demo.cleaner@seed.mundoria.local'
  and full_name in ('Demo Cleaner', 'Cleaner');

update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{full_name}',
  to_jsonb('Sophie Bennett'::text),
  true
)
where email = 'demo.customer@seed.mundoria.local';

update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{full_name}',
  to_jsonb('Hannah Adeyemi'::text),
  true
)
where email = 'demo.cleaner@seed.mundoria.local';

update public.cleaner_profiles cp
set gender = public.demo_person_gender(substring(p.email from '[0-9]+')::integer + 240)
from public.profiles p
where p.id = cp.id
  and p.email ~ '^cleaner[0-9]+@seed\.mundoria\.local$';

update public.cleaner_profiles cp
set gender = 'woman'
from public.profiles p
where p.id = cp.id
  and p.email = 'demo.cleaner@seed.mundoria.local'
  and cp.gender is null;

update public.profiles p
set avatar_url = case cp.gender
  when 'man' then '/images/avatars/mundoria-man-profile.png'
  else '/images/avatars/mundoria-woman-profile.png'
end
from public.cleaner_profiles cp
where cp.id = p.id
  and (
    p.email ~ '^cleaner[0-9]+@seed\.mundoria\.local$'
    or p.email = 'demo.cleaner@seed.mundoria.local'
  )
  and (
    p.avatar_url is null
    or btrim(p.avatar_url) = ''
    or p.avatar_url like '/images/avatars/%'
  );

-- One real Birmingham district each, kept alongside the broad "B" prefix
-- so demo matching still accepts any B postcode.
insert into public.cleaner_working_areas (
  cleaner_id, postcode_prefix, latitude, longitude
)
select
  cp.id,
  (array['B1','B3','B13','B14','B15','B16','B17','B29'])[
    1 + (abs(hashtext(cp.id::text)) % 8)
  ],
  52.470000 + ((abs(hashtext(cp.id::text || 'lat')) % 200) / 10000.0),
  -1.920000 - ((abs(hashtext(cp.id::text || 'lng')) % 200) / 10000.0)
from public.cleaner_profiles cp
join public.profiles p on p.id = cp.id
where cp.status = 'active'
  and p.email like '%@seed.mundoria.local'
  and not exists (
    select 1
    from public.cleaner_working_areas wa
    where wa.cleaner_id = cp.id
      and wa.postcode_prefix ~ '^B[0-9]'
  );

insert into public.cleaner_working_areas (
  cleaner_id, postcode_prefix, latitude, longitude
)
select cp.id, 'B', 52.4862, -1.8904
from public.cleaner_profiles cp
join public.profiles p on p.id = cp.id
where cp.status = 'active'
  and p.email like '%@seed.mundoria.local'
  and not exists (
    select 1
    from public.cleaner_working_areas wa
    where wa.cleaner_id = cp.id
      and upper(wa.postcode_prefix) = 'B'
  );

update public.cleaner_profiles cp
set
  bio = format(
    'Independent cleaner covering %s. Regular, deep and one-off cleans, with a checklist you can follow in the app.',
    case district.prefix
      when 'B1' then 'the Jewellery Quarter'
      when 'B3' then 'the Jewellery Quarter'
      when 'B13' then 'Moseley'
      when 'B14' then 'Kings Heath'
      when 'B15' then 'Edgbaston'
      when 'B16' then 'Edgbaston'
      when 'B17' then 'Harborne'
      when 'B29' then 'Selly Oak'
      else 'Birmingham'
    end
  ),
  years_experience = case
    when coalesce(cp.years_experience, 0) = 0
      then 1 + (abs(hashtext(cp.id::text)) % 8)
    else cp.years_experience
  end,
  total_jobs = case
    when coalesce(cp.total_jobs, 0) = 0
      then 18 + (abs(hashtext(cp.id::text)) % 90)
    else cp.total_jobs
  end
from public.profiles p
join lateral (
  select wa.postcode_prefix as prefix
  from public.cleaner_working_areas wa
  where wa.cleaner_id = p.id
    and wa.postcode_prefix ~ '^B[0-9]'
  order by wa.postcode_prefix
  limit 1
) district on true
where p.id = cp.id
  and p.email like '%@seed.mundoria.local'
  and (
    cp.bio is null
    or btrim(cp.bio) = ''
    or cp.bio like 'Seeded Birmingham cleaner%'
  );

-- Replace the load-test sentence, then add a few reviews on each district
-- where completed bookings exist and do not already have one.
update public.ratings
set comment = (
  array[
    'Kitchen and bathrooms looked genuinely finished — not a rushed wipe.',
    'Clear updates throughout and the checklist matched what we asked for.',
    'Punctual, careful and professional. Would book again.',
    'End-of-tenancy photos made the agent handover much easier.',
    'Guest-ready every time for our short-let. Status stayed in the app.',
    'Prefer same cleaner worked for us. Communication stayed clear.',
    'Empty-property clean left it ready for the new keys.',
    'Special-attention notes were actually followed. Thorough finish.'
  ]
)[1 + (abs(hashtext(id::text)) % 8)]
where comment = 'Seeded review for load testing.';

insert into public.ratings (
  booking_id,
  customer_id,
  cleaner_id,
  overall_score,
  room_ratings,
  comment,
  application_status,
  applied_at
)
select
  ranked.booking_id,
  ranked.customer_id,
  ranked.cleaner_id,
  4.8,
  '{"kitchen":5,"bathroom":5}'::jsonb,
  (
    array[
      'Kitchen and bathrooms looked genuinely finished — not a rushed wipe.',
      'Clear updates throughout and the checklist matched what we asked for.',
      'Punctual, careful and professional. Would book again.',
      'End-of-tenancy photos made the agent handover much easier.',
      'Guest-ready every time for our short-let. Status stayed in the app.',
      'Prefer same cleaner worked for us. Communication stayed clear.',
      'Empty-property clean left it ready for the new keys.',
      'Special-attention notes were actually followed. Thorough finish.'
    ]
  )[1 + ((ranked.rn - 1) % 8)],
  'applied',
  now()
from (
  select
    b.id as booking_id,
    b.customer_id,
    b.cleaner_id,
    wa.postcode_prefix,
    row_number() over (
      partition by wa.postcode_prefix
      order by b.scheduled_date desc, b.id
    ) as rn
  from public.bookings b
  join public.cleaner_working_areas wa on wa.cleaner_id = b.cleaner_id
  where b.status = 'completed'
    and b.cleaner_id is not null
    and wa.postcode_prefix in ('B1', 'B3', 'B13', 'B14', 'B15', 'B16', 'B17', 'B29')
    and not exists (
      select 1 from public.ratings r where r.booking_id = b.id
    )
) ranked
where ranked.rn <= 6;

update public.cleaner_profiles cp
set rating = 4.6 + ((abs(hashtext(cp.id::text)) % 4) * 0.1)
from public.profiles p
where p.id = cp.id
  and p.email like '%@seed.mundoria.local'
  and coalesce(cp.rating, 0) = 0;

-- Public cards for marketing pages. No email, phone or street address.
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
  coalesce(services.service_types, '{}'::text[]) as service_types
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
  and r.comment <> 'Seeded review for load testing.';

revoke all on public.marketing_cleaners from public;
revoke all on public.marketing_reviews from public;
grant select on public.marketing_cleaners to anon, authenticated;
grant select on public.marketing_reviews to anon, authenticated;
