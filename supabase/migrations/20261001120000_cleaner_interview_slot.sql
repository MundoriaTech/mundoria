-- Cleaner-chosen 30-minute online onboarding interview.

alter table public.cleaner_profiles
  add column if not exists interview_scheduled_at timestamptz;

comment on column public.cleaner_profiles.interview_scheduled_at is
  'Start of the 30-minute online onboarding interview, chosen by the cleaner.';

create unique index if not exists cleaner_profiles_interview_slot_idx
  on public.cleaner_profiles (interview_scheduled_at)
  where interview_scheduled_at is not null
    and interview_status in ('awaiting', 'completed');
