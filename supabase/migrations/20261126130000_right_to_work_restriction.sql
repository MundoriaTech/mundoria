-- Admin records what the GOV.UK share-code check showed: restricted or not.
alter table public.cleaner_profiles
  add column if not exists right_to_work_restriction text;

alter table public.cleaner_profiles
  drop constraint if exists cleaner_profiles_right_to_work_restriction_check;

alter table public.cleaner_profiles
  add constraint cleaner_profiles_right_to_work_restriction_check
  check (
    right_to_work_restriction is null
    or right_to_work_restriction in ('unrestricted', 'restricted')
  );

comment on column public.cleaner_profiles.right_to_work_restriction is
  'Set by an admin after checking a share code on GOV.UK: unrestricted (non-restricted work) or restricted.';
