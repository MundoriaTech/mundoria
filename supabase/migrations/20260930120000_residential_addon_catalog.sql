-- The booking form sells these residential add-ons. booking_add_ons.add_on_id
-- references this table, so a missing row cancels the payment and drops the booking.
insert into public.service_add_ons
  (id, label, description, amount, service_categories, service_types, sort_order)
values
  (
    'ironing',
    'Ironing',
    'Extra time for pressing and folding during the visit.',
    1800,
    array['residential'],
    '{}',
    5
  ),
  (
    'cleaning_products',
    'Cleaning products',
    'Cleaner brings standard cleaning products for the session.',
    800,
    array['residential'],
    '{}',
    6
  )
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  amount = excluded.amount,
  service_categories = excluded.service_categories,
  service_types = excluded.service_types,
  is_active = true,
  sort_order = excluded.sort_order;
