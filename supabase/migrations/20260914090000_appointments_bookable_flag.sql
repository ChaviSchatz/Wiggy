-- Client appointments (screen #67): who can be scheduled for a client
-- meeting. Mirrors `is_assignable` (20260910120000_people_is_assignable.sql)
-- exactly, including the rationale: bookability cannot be derived from role
-- or invite state, so it is an explicit per-person flag, set on the People
-- screen. Unlike `is_assignable` (default true, to preserve existing
-- behavior for a migration that had to backfill it), this is a brand-new
-- concept with no prior behavior to preserve -- default false, so nobody is
-- bookable until an admin opts them in
-- (docs/superpowers/specs/2026-09-14-client-appointments-design.md).
alter table public.staff_members
  add column is_bookable boolean not null default false;

create index staff_members_bookable_idx
  on public.staff_members (business_id, is_bookable)
  where is_bookable;
