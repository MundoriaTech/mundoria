-- A cleaner whose phone can't share its location can still ask an admin to
-- accept their arrival or finish, so the location is optional on a request.
alter table public.location_override_requests alter column latitude drop not null;
alter table public.location_override_requests alter column longitude drop not null;
alter table public.location_override_requests alter column distance_meters drop not null;
