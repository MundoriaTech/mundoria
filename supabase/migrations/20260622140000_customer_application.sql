-- Customer application fields, realtime tables, storage, and rating rollups.

alter table public.profiles
  add column notification_preferences jsonb not null default
    '{"email": true, "sms": true, "push": true}'::jsonb,
  add column referral_code text;

update public.profiles
set referral_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where referral_code is null;

alter table public.profiles
  alter column referral_code set not null,
  alter column referral_code set default
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

create unique index profiles_referral_code_idx
  on public.profiles(referral_code);

alter table public.bookings
  add column promo_code_id uuid references public.promo_codes(id) on delete set null,
  add column prefer_same_cleaner boolean not null default false,
  add column cleaner_live_latitude numeric(9, 6)
    check (cleaner_live_latitude between -90 and 90),
  add column cleaner_live_longitude numeric(9, 6)
    check (cleaner_live_longitude between -180 and 180),
  add column cleaner_location_updated_at timestamptz;

create index bookings_promo_code_id_idx on public.bookings(promo_code_id);

grant update (notification_preferences) on public.profiles to authenticated;

create or replace function public.refresh_cleaner_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_cleaner_id uuid;
begin
  target_cleaner_id := coalesce(new.cleaner_id, old.cleaner_id);

  update public.cleaner_profiles cp
  set
    rating = coalesce((
      select round(avg(r.overall_score), 2)
      from public.ratings r
      where r.cleaner_id = target_cleaner_id
    ), 0),
    performance_score = least(
      100,
      greatest(
        0,
        coalesce((
          select avg(r.overall_score) * 20
          from public.ratings r
          where r.cleaner_id = target_cleaner_id
        ), 0) * 0.50
        + cp.on_time_rate * 0.20
        + cp.acceptance_rate * 0.15
        + greatest(0, 100 - (cp.cancellation_count * 10)) * 0.15
      )
    ),
    updated_at = now()
  where cp.id = target_cleaner_id;

  return coalesce(new, old);
end;
$$;

create trigger ratings_refresh_cleaner_score
after insert or update or delete on public.ratings
for each row execute function public.refresh_cleaner_rating();

revoke all on function public.refresh_cleaner_rating() from public;
grant execute on function public.refresh_cleaner_rating() to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end;
$$;
