-- Slice 2 — RLS + grants for the work-definition catalog tables.
--
-- Only SELECT is granted to `authenticated` for now: there is no editor yet
-- (`docs/ui/screen-inventory.md` tags Task Types/Groups/Work Stages/Intake
-- Templates/Staff as `[config]`, built in a later slice). The seed script
-- (service-role, bypasses RLS) is the only writer today. Mutation
-- policies/grants get added alongside that editor slice — least privilege
-- until the feature that needs it exists.

alter table public.work_stages enable row level security;
alter table public.staff_members enable row level security;
alter table public.task_types enable row level security;
alter table public.task_groups enable row level security;
alter table public.task_group_items enable row level security;
alter table public.intake_templates enable row level security;
alter table public.intake_template_items enable row level security;

grant select on public.work_stages to authenticated;
grant select on public.staff_members to authenticated;
grant select on public.task_types to authenticated;
grant select on public.task_groups to authenticated;
grant select on public.task_group_items to authenticated;
grant select on public.intake_templates to authenticated;
grant select on public.intake_template_items to authenticated;

grant all on public.work_stages to service_role;
grant all on public.staff_members to service_role;
grant all on public.task_types to service_role;
grant all on public.task_groups to service_role;
grant all on public.task_group_items to service_role;
grant all on public.intake_templates to service_role;
grant all on public.intake_template_items to service_role;

-- ---------------------------------------------------------------------------
-- Tables with their own `business_id`: straightforward membership check.
-- ---------------------------------------------------------------------------
create policy "work_stages_select_members"
  on public.work_stages
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "staff_members_select_members"
  on public.staff_members
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "task_types_select_members"
  on public.task_types
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "task_groups_select_members"
  on public.task_groups
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "intake_templates_select_members"
  on public.intake_templates
  for select
  to authenticated
  using (public.is_business_member(business_id));

-- ---------------------------------------------------------------------------
-- Child tables with no `business_id` of their own: derive tenant from the
-- parent row (`task_groups`/`intake_templates`), same as `shares_business_with`
-- does for cross-table checks in the identity/tenancy migration.
-- ---------------------------------------------------------------------------
create policy "task_group_items_select_members"
  on public.task_group_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.task_groups tg
      where tg.id = task_group_items.task_group_id
        and public.is_business_member(tg.business_id)
    )
  );

create policy "intake_template_items_select_members"
  on public.intake_template_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.intake_templates it
      where it.id = intake_template_items.intake_template_id
        and public.is_business_member(it.business_id)
    )
  );
