-- Slice 7 — RLS + grants for sprints/business_settings. As with every table
-- since Slice 4, RLS enforces tenant isolation only; *who* may plan a
-- sprint is enforced in the app layer (src/lib/roles.ts `planSprint`,
-- checked in src/lib/sprints/actions.ts).

alter table public.sprints enable row level security;
alter table public.business_settings enable row level security;

grant select, insert, update on public.sprints to authenticated;
grant select, insert, update on public.business_settings to authenticated;

grant all on public.sprints to service_role;
grant all on public.business_settings to service_role;

create policy "sprints_select_members"
  on public.sprints
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "sprints_insert_members"
  on public.sprints
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "sprints_update_members"
  on public.sprints
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "business_settings_select_members"
  on public.business_settings
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "business_settings_insert_members"
  on public.business_settings
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "business_settings_update_members"
  on public.business_settings
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
