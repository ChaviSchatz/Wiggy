-- Slice 5 — adds the UPDATE grant/policy for runtime_tasks that Slice 4
-- deliberately deferred ("least privilege until the feature exists" --
-- see 20260804150100_work_orders_rls.sql). The board is that feature:
-- start/complete/undo, reassign, and the manager availability override all
-- update runtime_tasks. RLS still only enforces tenant isolation; *which*
-- role may perform *which* update is enforced in the app layer
-- (workOwnTasks / manageBoard in src/lib/roles.ts, checked in
-- src/lib/board/actions.ts).

grant update on public.runtime_tasks to authenticated;

create policy "runtime_tasks_update_members"
  on public.runtime_tasks
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
