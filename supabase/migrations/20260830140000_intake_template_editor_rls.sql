-- Settings slice 2 (screen inventory #50-52) — the intake-template editor.
-- 20260803210100_work_definition_rls.sql granted SELECT only, noting write
-- policies land "alongside that editor slice". This is that slice, for the
-- two template tables; task_types/task_groups stay read-only until #46-49.
--
-- Note the asymmetry between the two tables:
--
--   intake_templates      INSERT, UPDATE      -- no DELETE
--   intake_template_items INSERT, UPDATE, DELETE
--
-- A template cannot be deleted because `work_orders.intake_template_id` is
-- `on delete restrict` — Postgres refuses outright for any template an order
-- has ever used, so the UI removes templates by deactivating them
-- (`is_active = false`), which also drops them from the New Order wizard.
-- Items *can* be deleted: `runtime_tasks.origin_item_id` is
-- `on delete set null`, that column is written but never read, and runtime
-- tasks snapshot their title/stage/approval at generation (architecture
-- §5.1), so removing an item cannot damage an existing order.
--
-- `intake_template_items` has no `business_id` — tenancy derives from its
-- parent — so its policies join through `intake_templates`, the same shape
-- `task_group_items_select_members` already uses.
--
-- As everywhere since Slice 4, RLS enforces tenant isolation only; *who* may
-- edit is enforced in the app layer (`editWorkDefinition` in src/lib/roles.ts).

grant insert, update on public.intake_templates to authenticated;
grant insert, update, delete on public.intake_template_items to authenticated;

create policy "intake_templates_insert_members"
  on public.intake_templates
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "intake_templates_update_members"
  on public.intake_templates
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "intake_template_items_insert_members"
  on public.intake_template_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.intake_templates t
      where t.id = intake_template_items.intake_template_id
        and public.is_business_member(t.business_id)
    )
  );

create policy "intake_template_items_update_members"
  on public.intake_template_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.intake_templates t
      where t.id = intake_template_items.intake_template_id
        and public.is_business_member(t.business_id)
    )
  )
  with check (
    exists (
      select 1
      from public.intake_templates t
      where t.id = intake_template_items.intake_template_id
        and public.is_business_member(t.business_id)
    )
  );

create policy "intake_template_items_delete_members"
  on public.intake_template_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.intake_templates t
      where t.id = intake_template_items.intake_template_id
        and public.is_business_member(t.business_id)
    )
  );
