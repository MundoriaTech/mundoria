-- Checklist templates for same-day residential cleans.
insert into public.service_checklist_templates (service_type, item_key, label, description, sort_order)
values
  ('same_day', 'same_day_surfaces', 'Surfaces cleaned', 'Agreed visible surfaces cleaned on a same-day visit.', 10),
  ('same_day', 'same_day_floors', 'Floors cleaned', 'Agreed floors vacuumed and/or mopped.', 20),
  ('same_day', 'same_day_bathrooms', 'Bathrooms refreshed', 'Bathroom surfaces, sinks, toilets and mirrors cleaned.', 30),
  ('same_day', 'same_day_kitchen', 'Kitchen surfaces wiped', 'Worktops, sink and visible appliance fronts wiped.', 40)
on conflict (service_type, item_key) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;
