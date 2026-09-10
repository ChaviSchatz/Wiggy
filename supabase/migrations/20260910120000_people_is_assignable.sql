-- People management: `staff_members` becomes the spine for every person in a
-- salon, with `memberships` hanging off it via `user_id` (ADR 0013).

-- Whether this person appears in assignee pickers. Default true so every
-- existing roster row keeps behaving exactly as it does today; the admin sets
-- it explicitly on the People form. Deliberately NOT derived from role or
-- invite state -- an invited person who has not accepted is still fully
-- assignable, which is the whole point of linking `user_id` at invite time
-- (docs/superpowers/specs/2026-09-10-people-management-design.md).
alter table public.staff_members
  add column is_assignable boolean not null default true;

-- Partial index: the pickers only ever ask for assignable people, so the
-- false rows do not need to be in it.
create index staff_members_assignable_idx
  on public.staff_members (business_id, is_assignable)
  where is_assignable;

-- Backfill: every membership without a roster row gets one (today, the admin
-- the platform-admin console created at tenant creation). `is_assignable` is
-- false for these -- they demonstrably do no bench work, or they would
-- already be on the roster. This is the only place it starts off.
--
-- `full_name` falls back through profile name -> email -> a placeholder,
-- because the column is NOT NULL and `profiles.full_name` is nullable.
insert into public.staff_members (business_id, full_name, user_id, is_assignable)
select
  m.business_id,
  coalesce(nullif(trim(p.full_name), ''), p.email, 'Unknown'),
  m.user_id,
  false
from public.memberships m
join public.profiles p on p.id = m.user_id
where not exists (
  select 1
  from public.staff_members s
  where s.business_id = m.business_id
    and s.user_id = m.user_id
);
