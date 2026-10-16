-- Hourly Mundoria product/equipment supply add-ons (amounts are computed at booking time).
insert into public.service_add_ons
  (id, label, description, amount, service_categories, service_types, sort_order)
values
  (
    'cleaning_products',
    'Cleaning products',
    'Cleaner brings the Mundoria product kit (£2/h home, £3/h commercial).',
    0,
    array['residential', 'moving_home', 'short_term_rental', 'recovery', 'commercial'],
    '{}',
    6
  ),
  (
    'cleaning_equipment',
    'Cleaning equipment',
    'Cleaner brings the Mundoria equipment kit (£3/h, or £5/h for deep cleaning).',
    0,
    array['residential', 'moving_home', 'short_term_rental', 'recovery', 'commercial'],
    '{}',
    7
  )
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  amount = excluded.amount,
  service_categories = excluded.service_categories,
  service_types = excluded.service_types,
  is_active = true,
  sort_order = excluded.sort_order;
