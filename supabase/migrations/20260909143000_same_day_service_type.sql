-- Same-day residential cleaning as a bookable service type.
alter type public.service_type add value if not exists 'same_day';
