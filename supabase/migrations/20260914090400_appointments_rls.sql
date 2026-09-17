-- appointments RLS. INSERT/UPDATE only, never DELETE -- status transitions
-- to 'cancelled'/'no_show' instead. *Who* may write is app-layer only
-- (`manageAppointments`: admin/manager/secretary); a bookable-only worker's
-- read access to their own schedule is also app-layer (the query itself
-- scopes to their staff_member_id), since RLS's job everywhere in this
-- codebase is tenant isolation, not role-based row filtering.
alter table public.appointments enable row level security;

grant select, insert, update on public.appointments to authenticated;
grant all on public.appointments to service_role;

create policy "appointments_select_members"
  on public.appointments
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "appointments_insert_members"
  on public.appointments
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "appointments_update_members"
  on public.appointments
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
