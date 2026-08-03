-- Slice 1a — Row Level Security policies for the identity/tenancy tables.
-- The service role bypasses RLS and is used for seeding/bootstrap.
-- Policies rely on the SECURITY DEFINER helpers from the previous migration to
-- avoid recursive policy evaluation when a policy needs to read memberships.

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;

-- ---------------------------------------------------------------------------
-- Table privileges. RLS decides *which rows*; these GRANTs decide *which verbs*
-- a role may attempt. `authenticated` gets only the verbs that have a matching
-- policy below (defence in depth); `service_role` gets everything and bypasses
-- RLS for seeding/bootstrap.
-- ---------------------------------------------------------------------------
grant select, update on public.businesses to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;

grant all on public.businesses to service_role;
grant all on public.profiles to service_role;
grant all on public.memberships to service_role;

-- ---------------------------------------------------------------------------
-- businesses: members can read; admins can update. No INSERT/DELETE for users.
-- ---------------------------------------------------------------------------
create policy "businesses_select_members"
  on public.businesses
  for select
  to authenticated
  using (public.is_business_member(id));

create policy "businesses_update_admins"
  on public.businesses
  for update
  to authenticated
  using (public.is_business_admin(id))
  with check (public.is_business_admin(id));

-- ---------------------------------------------------------------------------
-- profiles: read own or profiles sharing a business; update own only.
-- ---------------------------------------------------------------------------
create policy "profiles_select_self_or_shared"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.shares_business_with(id));

create policy "profiles_update_self"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- memberships: members can read within their business; admins manage.
-- ---------------------------------------------------------------------------
create policy "memberships_select_members"
  on public.memberships
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "memberships_insert_admins"
  on public.memberships
  for insert
  to authenticated
  with check (public.is_business_admin(business_id));

create policy "memberships_update_admins"
  on public.memberships
  for update
  to authenticated
  using (public.is_business_admin(business_id))
  with check (public.is_business_admin(business_id));

create policy "memberships_delete_admins"
  on public.memberships
  for delete
  to authenticated
  using (public.is_business_admin(business_id));
