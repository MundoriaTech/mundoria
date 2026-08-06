-- Address ownership is enough for RLS. Requiring has_role('customer') blocked
-- valid sessions (e.g. cleaners booking for themselves, or role bootstrap races).

drop policy if exists "Customers can read own addresses" on public.addresses;
drop policy if exists "Customers can create own addresses" on public.addresses;
drop policy if exists "Customers can update own addresses" on public.addresses;
drop policy if exists "Customers can delete own addresses" on public.addresses;

create policy "Users can read own addresses"
on public.addresses for select
to authenticated
using (customer_id = auth.uid());

create policy "Users can create own addresses"
on public.addresses for insert
to authenticated
with check (customer_id = auth.uid());

create policy "Users can update own addresses"
on public.addresses for update
to authenticated
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

create policy "Users can delete own addresses"
on public.addresses for delete
to authenticated
using (customer_id = auth.uid());
