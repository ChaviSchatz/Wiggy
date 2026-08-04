-- Slice 3 — RLS + grants for `customers`.
--
-- Unlike the work-definition catalog (read-only for now, no editor yet),
-- customers is an active CRUD feature this slice, so `authenticated` gets
-- full DML. RLS's job here is tenant isolation only (architecture.md §2);
-- *who* may create/edit customers (secretary/manager/admin, not worker) is
-- enforced in the app layer (`editCustomers` in src/lib/roles.ts, checked in
-- src/lib/customers/actions.ts) -- the authoritative check, per architecture.

alter table public.customers enable row level security;

grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;

create policy "customers_select_members"
  on public.customers
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "customers_insert_members"
  on public.customers
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "customers_update_members"
  on public.customers
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "customers_delete_members"
  on public.customers
  for delete
  to authenticated
  using (public.is_business_member(business_id));
