alter table public.addresses
  add column if not exists num_other_rooms integer check (num_other_rooms >= 0);
