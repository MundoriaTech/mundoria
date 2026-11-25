-- Record who last saved a callback lead's notes, and when.
alter table public.callback_leads
  add column if not exists notes_updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists notes_updated_at timestamptz;
