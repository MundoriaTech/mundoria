-- New service_type enum values must commit before they can be referenced.
-- Keep this migration separate from schema/seed changes (PostgreSQL 55P04).

alter type public.service_type add value if not exists 'move_in';
alter type public.service_type add value if not exists 'move_out';
alter type public.service_type add value if not exists 'office';
alter type public.service_type add value if not exists 'retail_hospitality';
alter type public.service_type add value if not exists 'educational_facility';
alter type public.service_type add value if not exists 'communal_area';
alter type public.service_type add value if not exists 'holiday_let';
alter type public.service_type add value if not exists 'serviced_accommodation';
alter type public.service_type add value if not exists 'window_cleaning';
alter type public.service_type add value if not exists 'pregnancy_support';
alter type public.service_type add value if not exists 'postpartum';
alter type public.service_type add value if not exists 'illness_recovery';
alter type public.service_type add value if not exists 'post_injury';
alter type public.service_type add value if not exists 'hospital_discharge';
alter type public.service_type add value if not exists 'bereavement_support';
