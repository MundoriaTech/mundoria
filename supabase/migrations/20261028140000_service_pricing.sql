-- Admin-editable customer service rates (hourly, supply, flat add-ons, schedule multipliers).
alter table public.platform_settings
  add column if not exists service_pricing jsonb not null default '{}'::jsonb;

comment on column public.platform_settings.service_pricing is
  'Customer pricing overrides: hourly rates, supply £/h, flat add-ons, schedule multipliers. Empty object uses code defaults.';
