-- Settings slice 1 (screen inventory #53) — the staff-members editor.
-- 20260803210100_work_definition_rls.sql granted SELECT only, noting that
-- write policies land "alongside that editor slice". This is that slice.
--
-- INSERT and UPDATE only, never DELETE. Removing a staff member is
-- deactivation (`is_active = false`): `staff_members.id` is referenced by
-- runtime_tasks.assigned_staff_member_id / approver_staff_member_id,
-- missing_items.responsible_staff_member_id and
-- task_types.default_staff_member_id, all `on delete set null` — a hard
-- delete would silently erase who did the work on already-completed tasks,
-- contradicting the snapshot principle (architecture §5.1) and the audit
-- trail (ADR 0004). Withholding the grant makes that structural rather than
-- a convention a future Server Action could quietly break.
--
-- As everywhere since Slice 4, RLS enforces tenant isolation only; *who* may
-- edit staff is enforced in the app layer (`manageStaff` in src/lib/roles.ts).

grant insert, update on public.staff_members to authenticated;

create policy "staff_members_insert_members"
  on public.staff_members
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "staff_members_update_members"
  on public.staff_members
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
