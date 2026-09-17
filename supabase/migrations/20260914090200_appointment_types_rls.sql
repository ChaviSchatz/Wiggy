-- appointment_types RLS. INSERT/UPDATE only, never DELETE -- a type in use
-- by past appointments must stay resolvable, same reasoning as
-- staff_members (20260830120000_staff_settings_rls.sql). *Who* may edit is
-- app-layer only (`editWorkDefinition`, same gate as intake templates).
alter table public.appointment_types enable row level security;

grant select, insert, update on public.appointment_types to authenticated;
grant all on public.appointment_types to service_role;

create policy "appointment_types_select_members"
  on public.appointment_types
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "appointment_types_insert_members"
  on public.appointment_types
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "appointment_types_update_members"
  on public.appointment_types
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
