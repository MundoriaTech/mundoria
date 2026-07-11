-- Allow self-registration as customer or cleaner while never permitting
-- self-registration as admin. Profile creation remains atomic with auth signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.user_role;
begin
  requested_role := case new.raw_user_meta_data ->> 'role'
    when 'cleaner' then 'cleaner'::public.user_role
    else 'customer'::public.user_role
  end;

  insert into public.profiles (id, full_name, email, phone, role, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'CleanScape user'
    ),
    coalesce(new.email, new.id::text || '@pending.local'),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    requested_role,
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role,
    avatar_url = excluded.avatar_url;

  if requested_role = 'cleaner'::public.user_role then
    insert into public.cleaner_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to service_role;
