-- Slice 8 — RLS + grants for feedback_items. As with every table since
-- Slice 4, RLS enforces tenant isolation only; *who* may do what is enforced
-- in the app layer (src/lib/roles.ts, checked in src/lib/feedback/actions.ts).
-- Submitting feedback is open to every authenticated member of the tenant
-- (docs/ui/information-architecture.md: "Feedback (all)").
--
-- No update/delete grant: v1 has no triage UI (screen inventory #57 is
-- [config]), so nothing may edit a submission after the fact.

alter table public.feedback_items enable row level security;

grant select, insert on public.feedback_items to authenticated;
grant all on public.feedback_items to service_role;

create policy "feedback_items_select_members"
  on public.feedback_items
  for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "feedback_items_insert_members"
  on public.feedback_items
  for insert
  to authenticated
  with check (public.is_business_member(business_id));
