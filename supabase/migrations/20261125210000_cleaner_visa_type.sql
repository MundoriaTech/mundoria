-- Immigration status / visa type for cleaners who prove right to work with
-- a GOV.UK share code. Some visas don't allow self-employment.
alter table public.cleaner_profiles
  add column if not exists right_to_work_visa_type text;
