-- Call desk fields so ads callbacks can be worked without a spreadsheet.

alter table public.callback_leads
  add column if not exists call_status text not null default 'to_call',
  add column if not exists outcome text,
  add column if not exists area text not null default 'unknown',
  add column if not exists town text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.callback_leads
  drop constraint if exists callback_leads_call_status_check,
  drop constraint if exists callback_leads_outcome_check,
  drop constraint if exists callback_leads_area_check,
  drop constraint if exists callback_leads_town_check,
  drop constraint if exists callback_leads_notes_check;

alter table public.callback_leads
  add constraint callback_leads_call_status_check
    check (call_status in ('to_call', 'no_answer', 'spoke')),
  add constraint callback_leads_outcome_check
    check (outcome is null or outcome in (
      'pending_booking',
      'future_booking',
      'customer',
      'out_of_area',
      'closed'
    )),
  add constraint callback_leads_area_check
    check (area in ('unknown', 'in_area', 'out_of_area')),
  add constraint callback_leads_town_check
    check (town is null or char_length(town) between 1 and 80),
  add constraint callback_leads_notes_check
    check (notes is null or char_length(notes) <= 500);

create index if not exists callback_leads_call_status_idx
  on public.callback_leads (call_status, created_at desc);
create index if not exists callback_leads_area_idx
  on public.callback_leads (area, created_at desc);

grant update on table public.callback_leads to service_role;
