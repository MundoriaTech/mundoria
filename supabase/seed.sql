-- Mundoria large E2E seed for local/staging load testing.
-- Creates thousands of customers, cleaners, addresses, bookings and related rows.
-- Default password for all seeded users: SeedPass123!
--
-- Applied automatically by `supabase db reset` (see config.toml [db.seed]).
-- For hosted projects, prefer: npm run seed

begin;

create extension if not exists pgcrypto;

-- Wipe previous seed identities (safe for local/dev seed emails only).
delete from auth.users
where email like '%@seed.mundoria.local'
   or email in (
     'admin@seed.mundoria.local',
     'demo.customer@seed.mundoria.local',
     'demo.cleaner@seed.mundoria.local'
   );

-- ---------------------------------------------------------------------------
-- Auth users (trigger creates profiles + cleaner_profiles)
-- ---------------------------------------------------------------------------

-- Demo accounts (easy to log in during QA)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
(
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'authenticated', 'authenticated',
  'admin@seed.mundoria.local',
  crypt('SeedPass123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Seed Admin","role":"customer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  'authenticated', 'authenticated',
  'demo.customer@seed.mundoria.local',
  crypt('SeedPass123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Demo Customer","role":"customer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  'authenticated', 'authenticated',
  'demo.cleaner@seed.mundoria.local',
  crypt('SeedPass123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Demo Cleaner","role":"cleaner"}'::jsonb,
  now(), now(), '', '', '', ''
);

-- 2,500 customers
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  format('customer%s@seed.mundoria.local', lpad(i::text, 4, '0')),
  crypt('SeedPass123!', gen_salt('bf')),
  now() - ((i % 120) || ' days')::interval,
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'full_name', format('Customer %s', i),
    'role', 'customer',
    'phone', format('+4477009%s', lpad(i::text, 5, '0'))
  ),
  now() - ((i % 120) || ' days')::interval,
  now(),
  '', '', '', ''
from generate_series(1, 2500) as i;

-- 1,500 cleaners
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  format('cleaner%s@seed.mundoria.local', lpad(i::text, 4, '0')),
  crypt('SeedPass123!', gen_salt('bf')),
  now() - ((i % 90) || ' days')::interval,
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'full_name', format('Cleaner %s', i),
    'role', 'cleaner',
    'phone', format('+4477119%s', lpad(i::text, 5, '0'))
  ),
  now() - ((i % 90) || ' days')::interval,
  now(),
  '', '', '', ''
from generate_series(1, 1500) as i;

-- Auth identities (required for email login)
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  u.id::text,
  now(),
  u.created_at,
  now()
from auth.users u
where u.email like '%@seed.mundoria.local'
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  );

-- Promote seed admin
update public.profiles
set role = 'admin', full_name = 'Seed Admin'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

-- ---------------------------------------------------------------------------
-- Cleaner profiles: activate most for matching tests
-- ---------------------------------------------------------------------------

update public.cleaner_profiles cp
set
  bio = 'Seeded Birmingham-area cleaner for end-to-end testing.',
  years_experience = 1 + (abs(hashtext(cp.id::text)) % 12),
  tier = (array['bronze','silver','gold','elite'])[1 + (abs(hashtext(cp.id::text)) % 4)]::public.cleaner_tier,
  performance_score = 55 + (abs(hashtext(cp.id::text)) % 45),
  rating = round((3.2 + (abs(hashtext(cp.id::text || 'r')) % 18) / 10.0)::numeric, 2),
  total_jobs = abs(hashtext(cp.id::text || 'j')) % 180,
  acceptance_rate = 70 + (abs(hashtext(cp.id::text || 'a')) % 30),
  on_time_rate = 75 + (abs(hashtext(cp.id::text || 'o')) % 25),
  dbs_verified = true,
  id_verified = true,
  references_verified = (abs(hashtext(cp.id::text)) % 3) <> 0,
  onboarding_complete = true,
  status = case
    when abs(hashtext(cp.id::text)) % 20 = 0 then 'pending'::public.cleaner_status
    when abs(hashtext(cp.id::text)) % 25 = 0 then 'suspended'::public.cleaner_status
    else 'active'::public.cleaner_status
  end,
  working_radius_km = 5 + (abs(hashtext(cp.id::text)) % 16)
where exists (
  select 1 from public.profiles p
  where p.id = cp.id and p.email like '%@seed.mundoria.local'
);

-- Demo cleaner always active / elite
update public.cleaner_profiles
set
  status = 'active',
  tier = 'elite',
  onboarding_complete = true,
  dbs_verified = true,
  id_verified = true,
  rating = 4.9,
  performance_score = 96,
  total_jobs = 240
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';

-- Cleaner services (common catalogue)
insert into public.cleaner_services (cleaner_id, service_type, is_active)
select cp.id, s.service_type, true
from public.cleaner_profiles cp
cross join (
  values
    ('regular'::public.service_type),
    ('one_off'::public.service_type),
    ('deep_clean'::public.service_type),
    ('same_day'::public.service_type),
    ('end_of_tenancy'::public.service_type),
    ('airbnb_turnover'::public.service_type),
    ('office'::public.service_type)
) as s(service_type)
where cp.status = 'active'
  and exists (
    select 1 from public.profiles p
    where p.id = cp.id and p.email like '%@seed.mundoria.local'
  )
on conflict (cleaner_id, service_type) do nothing;

-- Availability Mon–Sat mornings/afternoons
insert into public.cleaner_availability (
  cleaner_id, day_of_week, start_time, end_time, is_available
)
select cp.id, d.dow, t.start_time::time, t.end_time::time, true
from public.cleaner_profiles cp
cross join generate_series(1, 6) as d(dow)
cross join (
  values ('08:00','12:00'), ('12:00','17:00'), ('17:00','20:00')
) as t(start_time, end_time)
where cp.status = 'active'
  and exists (
    select 1 from public.profiles p
    where p.id = cp.id and p.email like '%@seed.mundoria.local'
  )
on conflict do nothing;

-- Birmingham working areas
insert into public.cleaner_working_areas (
  cleaner_id, postcode_prefix, latitude, longitude
)
select
  cp.id,
  (array['B1','B2','B3','B4','B5','B12','B13','B15','B16','B29','B30'])[
    1 + (abs(hashtext(cp.id::text)) % 11)
  ],
  52.470000 + ((abs(hashtext(cp.id::text || 'lat')) % 200) / 10000.0),
  -1.920000 - ((abs(hashtext(cp.id::text || 'lng')) % 200) / 10000.0)
from public.cleaner_profiles cp
where cp.status = 'active'
  and exists (
    select 1 from public.profiles p
    where p.id = cp.id and p.email like '%@seed.mundoria.local'
  );

-- ---------------------------------------------------------------------------
-- Customer addresses (~2 per customer ≈ 5k)
-- ---------------------------------------------------------------------------

insert into public.addresses (
  customer_id, label, address_line_1, city, postcode,
  latitude, longitude, is_default, property_type, num_bedrooms, num_bathrooms
)
select
  p.id,
  case when n = 1 then 'Home' else 'Second property' end,
  format('%s Seed Street', 10 + (abs(hashtext(p.id::text || n::text)) % 240)),
  'Birmingham',
  format(
    '%s %s%s',
    (array['B1','B2','B3','B5','B12','B13','B15','B16','B29'])[
      1 + (abs(hashtext(p.id::text || 'pc')) % 9)
    ],
    (array['1','2','3','4','5','6','7','8','9'])[1 + (abs(hashtext(p.id::text || n::text)) % 9)],
    (array['AA','AB','BA','BB','CA','DA','EA'])[1 + (abs(hashtext(p.id::text || 'suf')) % 7)]
  ),
  52.470000 + ((abs(hashtext(p.id::text || 'alat' || n::text)) % 250) / 10000.0),
  -1.920000 - ((abs(hashtext(p.id::text || 'alng' || n::text)) % 250) / 10000.0),
  n = 1,
  (array['house','flat','flat','house','office'])[
    1 + (abs(hashtext(p.id::text || n::text)) % 5)
  ]::public.property_type,
  1 + (abs(hashtext(p.id::text || 'bed' || n::text)) % 4),
  1 + (abs(hashtext(p.id::text || 'bath' || n::text)) % 2)
from public.profiles p
cross join generate_series(1, 2) as n
where p.role = 'customer'
  and p.email like '%@seed.mundoria.local';

-- ---------------------------------------------------------------------------
-- Bookings (~5,000) across statuses for dashboards / matching / admin
-- ---------------------------------------------------------------------------

with customers as (
  select p.id as customer_id, a.id as address_id,
         row_number() over (order by p.created_at) as rn
  from public.profiles p
  join public.addresses a on a.customer_id = p.id and a.is_default
  where p.role = 'customer' and p.email like '%@seed.mundoria.local'
),
cleaners as (
  select cp.id as cleaner_id,
         row_number() over (order by cp.created_at) as rn
  from public.cleaner_profiles cp
  join public.profiles p on p.id = cp.id
  where cp.status = 'active' and p.email like '%@seed.mundoria.local'
),
series as (
  select generate_series(1, 5000) as i
)
insert into public.bookings (
  customer_id, cleaner_id, address_id, service_type, status,
  scheduled_date, scheduled_start_time, estimated_duration_hours,
  is_recurring, recurrence_pattern,
  amount_total, amount_cleaner, amount_platform, payment_status,
  special_instructions, allocated_cleaners
)
select
  c.customer_id,
  case
    when st.status in ('pending_match') then null
    else cl.cleaner_id
  end,
  c.address_id,
  st.service_type,
  st.status,
  (current_date + ((i % 60) - 20))::date,
  (array['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'])[
    1 + (i % 8)
  ]::time,
  2 + (i % 4),
  (i % 11 = 0),
  case when i % 11 = 0 then 'weekly'::public.recurrence_pattern else null end,
  amount.total,
  amount.cleaner,
  amount.platform,
  st.payment_status,
  format('Seed booking #%s for E2E flow testing', i),
  case when st.service_type = 'office' then 1 + (i % 3) else 1 end
from series
join customers c on c.rn = 1 + ((i - 1) % (select count(*) from customers))
join cleaners cl on cl.rn = 1 + ((i - 1) % (select count(*) from cleaners))
cross join lateral (
  select
    (array[
      'regular','one_off','deep_clean','same_day','end_of_tenancy',
      'airbnb_turnover','office','move_in','illness_recovery'
    ])[1 + (i % 9)]::public.service_type as service_type,
    (array[
      'pending_match','matched','confirmed','cleaner_en_route',
      'in_progress','awaiting_customer_confirmation','completed','cancelled'
    ])[1 + (i % 8)]::public.booking_status as status,
    (array['held','held','released','released','unpaid','refunded'])[
      1 + (i % 6)
    ]::public.payment_status as payment_status
) st
cross join lateral (
  select
    t as total,
    (t * 80 / 100) as cleaner,
    t - (t * 80 / 100) as platform
  from (select (4500 + (i % 40) * 250)::numeric as t) q
) amount;

-- Sample ratings on completed bookings
insert into public.ratings (
  booking_id, customer_id, cleaner_id, overall_score, room_ratings, comment
)
select
  b.id,
  b.customer_id,
  b.cleaner_id,
  round((3.5 + (abs(hashtext(b.id::text)) % 15) / 10.0)::numeric, 2),
  '{"kitchen":5,"bathroom":4}'::jsonb,
  'Seeded review for load testing.'
from public.bookings b
join public.profiles p on p.id = b.customer_id
where b.status = 'completed'
  and b.cleaner_id is not null
  and p.email like '%@seed.mundoria.local'
  and abs(hashtext(b.id::text)) % 3 = 0
on conflict (booking_id) do nothing;

-- Sample messages on matched+ bookings
insert into public.messages (
  booking_id, sender_id, receiver_id, content, is_read
)
select
  b.id,
  b.customer_id,
  b.cleaner_id,
  'Hi — seeded message so messaging UI has volume to test.',
  (abs(hashtext(b.id::text)) % 2 = 0)
from public.bookings b
join public.profiles p on p.id = b.customer_id
where b.cleaner_id is not null
  and b.status not in ('pending_match', 'cancelled')
  and p.email like '%@seed.mundoria.local'
  and abs(hashtext(b.id::text)) % 4 = 0;

commit;
