-- Slice 7 — Sprint & personal queue (ADR 0008/0009,
-- docs/domains/sprint-and-task-queue.md). An operational layer over the
-- existing runtime_tasks -- no new task system.

-- ---------------------------------------------------------------------------
-- business_settings -- tenant-wide settings that aren't identity/branding
-- (those stay on `businesses`, whose RLS restricts UPDATE to admins only --
-- Slice 1a, 20260803120100_rls_policies.sql). Sprint cadence is a manager-
-- level operational setting (docs/ui/information-architecture.md: Sprint
-- Planning nav = manager+admin), so it gets its own row + the same
-- "RLS = tenant isolation, app layer = permission" pattern every table
-- since Slice 4 uses, rather than widening who may update `businesses`
-- itself.
-- ---------------------------------------------------------------------------
create table public.business_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  sprint_cadence_days integer not null default 7 check (sprint_cadence_days > 0),
  updated_at timestamptz not null default now()
);

create trigger business_settings_set_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sprints -- a tenant-configurable time-box the manager pulls open tasks
-- into (domain: sprint-and-task-queue.md). `status` is descriptive, not a
-- gate for v1: a sprint is created directly as 'active' (no separate
-- "start" step) and only ever transitions to 'closed'. `planning` is kept
-- in the enum for a future scheduled-ahead flow.
-- ---------------------------------------------------------------------------
create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'active' check (status in ('planning', 'active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sprints_business_id_idx on public.sprints (business_id);
create index sprints_business_status_idx on public.sprints (business_id, status);

create trigger sprints_set_updated_at
  before update on public.sprints
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- runtime_tasks additions (ADR 0008): the sprint/queue overlay fields the
-- board schema comment (20260804180000_board_schema.sql) flagged as
-- "Slice 7's additions -- not added here". `queue_rank` is a fractional
-- rank (src/lib/queue/rank.ts) scoped per assignee -- reordering one
-- worker's queue never renumbers another's rows. `priority` is an optional
-- highlight flag on the *task*, distinct from the existing
-- `work_orders.priority` (normal/urgent) enum on the order itself.
-- ---------------------------------------------------------------------------
alter table public.runtime_tasks
  add column sprint_id uuid references public.sprints (id) on delete set null,
  add column queue_rank double precision,
  add column priority boolean not null default false;

create index runtime_tasks_sprint_id_idx on public.runtime_tasks (sprint_id);
create index runtime_tasks_assignee_queue_rank_idx
  on public.runtime_tasks (assigned_staff_member_id, queue_rank);
