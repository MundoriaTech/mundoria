-- Some environments created insurance_cover_amount as integer; onboarding stores
-- bands like "1m" / free-text like "1.5m". Force text so submit does not fail with
-- invalid input syntax for type integer.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cleaner_profiles'
      and column_name = 'insurance_cover_amount'
      and udt_name <> 'text'
  ) then
    alter table public.cleaner_profiles
      alter column insurance_cover_amount type text
      using insurance_cover_amount::text;
  end if;
end $$;

comment on column public.cleaner_profiles.insurance_cover_amount is
  'Cover band e.g. 1m | 2m | 5m, or whole pounds as digits. Minimum for domestic is £1m.';
