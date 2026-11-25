-- Standard UK right-to-work check for cleaners.
-- British/Irish citizens prove it with a UK/Irish passport (or birth
-- certificate + NI number); everyone else gives a GOV.UK share code, which
-- an admin checks at gov.uk/view-right-to-work with the date of birth.
alter table public.cleaner_profiles
  add column if not exists date_of_birth date,
  add column if not exists right_to_work_route text
    check (right_to_work_route in ('british_irish', 'share_code')),
  add column if not exists right_to_work_share_code text,
  add column if not exists right_to_work_expires_on date,
  add column if not exists right_to_work_status public.document_review_status
    not null default 'missing';
