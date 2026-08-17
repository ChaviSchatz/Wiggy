-- Slice 6 — RLS + grants for the hub tables, plus the work_orders UPDATE
-- grant/policy that Slices 4-5 deliberately deferred (see
-- 20260804150100_work_orders_rls.sql) -- cancel/deliver/edit-intake are the
-- features that finally need it. As with every prior slice, RLS enforces
-- tenant isolation only; *who* may do *what* is enforced in the app layer
-- (src/lib/roles.ts, checked in the relevant Server Actions).

alter table public.task_approvals enable row level security;
alter table public.task_comments enable row level security;
alter table public.attachments enable row level security;
alter table public.activity enable row level security;
alter table public.missing_items enable row level security;

grant select, insert on public.task_approvals to authenticated;
grant select, insert on public.task_comments to authenticated;
grant select, insert, delete on public.attachments to authenticated;
-- activity is append-only (ADR 0004): no update/delete grant, ever.
grant select, insert on public.activity to authenticated;
grant select, insert, update on public.missing_items to authenticated;

grant all on public.task_approvals to service_role;
grant all on public.task_comments to service_role;
grant all on public.attachments to service_role;
grant all on public.activity to service_role;
grant all on public.missing_items to service_role;

create policy "task_approvals_select_members"
  on public.task_approvals
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "task_approvals_insert_members"
  on public.task_approvals
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "task_comments_select_members"
  on public.task_comments
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "task_comments_insert_members"
  on public.task_comments
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "attachments_select_members"
  on public.attachments
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "attachments_insert_members"
  on public.attachments
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "attachments_delete_members"
  on public.attachments
  for delete
  to authenticated
  using (public.is_business_member(business_id));

create policy "activity_select_members"
  on public.activity
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "activity_insert_members"
  on public.activity
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "missing_items_select_members"
  on public.missing_items
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "missing_items_insert_members"
  on public.missing_items
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "missing_items_update_members"
  on public.missing_items
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ---------------------------------------------------------------------------
-- work_orders UPDATE (cancel, mark delivered, edit-intake, order-status
-- recompute after task changes).
-- ---------------------------------------------------------------------------
grant update on public.work_orders to authenticated;

create policy "work_orders_update_members"
  on public.work_orders
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ---------------------------------------------------------------------------
-- Storage: the `attachments` bucket. Object keys are always written as
-- `${business_id}/${parent_type}/${parent_id}/${filename}` (src/lib/
-- attachments/actions.ts), so the first path segment is the tenant --
-- `storage.foldername` splits the key into its folder parts.
-- ---------------------------------------------------------------------------
create policy "attachments_bucket_select_members"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_business_member(((storage.foldername(name))[1])::uuid)
  );

create policy "attachments_bucket_insert_members"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'attachments'
    and public.is_business_member(((storage.foldername(name))[1])::uuid)
  );

create policy "attachments_bucket_delete_members"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_business_member(((storage.foldername(name))[1])::uuid)
  );
