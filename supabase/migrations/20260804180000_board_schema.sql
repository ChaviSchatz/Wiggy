-- Slice 5 — Task-centric production board (ADR 0010, ADR 0008, architecture §7.3).
--
-- `availability_override`: a manager's manual unlock of a blocked task (the
-- rare top/base parallel case). `sprint_id`/`queue_rank`/`priority` are
-- Slice 7's additions (docs/plan/v1-implementation-plan.md) -- not added here.
alter table public.runtime_tasks
  add column availability_override boolean not null default false;
