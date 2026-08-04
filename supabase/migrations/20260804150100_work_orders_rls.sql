-- Slice 4 — RLS + grants for work_orders, runtime_tasks, work_order_counters.
--
-- Only SELECT + INSERT are granted for now: Slice 4 only creates orders
-- (confirm-and-generate). UPDATE (status transitions, task assignment/
-- status changes, order lifecycle actions) is added by the slices that
-- actually need it (board task actions in Slice 5, hub/approvals in
-- Slice 6) -- least privilege until the feature exists, same approach as
-- the work-definition catalog in Slice 2.
--
-- RLS enforces tenant isolation only; *who* may create orders
-- (secretary/manager/admin, not worker) is enforced in the app layer
-- (createOrders permission, checked in src/lib/work-orders/actions.ts).

alter table public.work_orders enable row level security;
alter table public.runtime_tasks enable row level security;
alter table public.work_order_counters enable row level security;

grant select, insert on public.work_orders to authenticated;
grant select, insert on public.runtime_tasks to authenticated;
grant select, insert, update on public.work_order_counters to authenticated;

grant all on public.work_orders to service_role;
grant all on public.runtime_tasks to service_role;
grant all on public.work_order_counters to service_role;

create policy "work_orders_select_members"
  on public.work_orders
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "work_orders_insert_members"
  on public.work_orders
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "runtime_tasks_select_members"
  on public.runtime_tasks
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "runtime_tasks_insert_members"
  on public.runtime_tasks
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

-- work_order_counters carries nothing sensitive (just a per-tenant
-- integer), so members get select/insert/update -- upserting the next
-- number is a single atomic statement (src/lib/work-orders/actions.ts).
create policy "work_order_counters_select_members"
  on public.work_order_counters
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "work_order_counters_insert_members"
  on public.work_order_counters
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "work_order_counters_update_members"
  on public.work_order_counters
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- security invoker: runs as the calling member, so this just lets them
-- call the function at all -- the policies above still gate the row.
grant execute on function public.next_work_order_number(uuid) to authenticated;
