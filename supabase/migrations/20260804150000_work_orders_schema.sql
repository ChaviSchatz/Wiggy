-- Slice 4 — Work orders & runtime tasks (the core intake -> generation loop).
-- See docs/architecture.md §4.4-§7, docs/domains/work-orders-and-runtime.md,
-- ADR 0003, ADR 0006.

-- ---------------------------------------------------------------------------
-- Per-tenant sequential order numbering, in its own narrow table rather than
-- a column on `businesses` -- that table's RLS restricts UPDATE to admins
-- only, but any `createOrders` member needs to bump this counter. A single
-- atomic `update ... set next_number = next_number + 1 returning ...` is
-- race-safe without a dedicated Postgres function/trigger (Postgres
-- serializes concurrent updates to the same row).
-- ---------------------------------------------------------------------------
create table public.work_order_counters (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  next_number integer not null default 1
);

-- PostgREST's update endpoint only sets literal values -- it cannot express
-- `next_number = next_number + 1`, so a single atomic UPDATE isn't reachable
-- from the app layer at all here. This is architecture.md §1.1's named
-- exception ("a transaction that must be atomic at the DB level"): one
-- narrow, non-business-logic SQL function that does exactly the
-- insert-or-increment, nothing else. `security invoker` (the default) so it
-- runs as the calling user, subject to the RLS policies below like any
-- other statement they could otherwise run themselves.
create or replace function public.next_work_order_number(p_business_id uuid)
returns integer
language sql
volatile
set search_path = public
as $$
  insert into public.work_order_counters (business_id, next_number)
  values (p_business_id, 2)
  on conflict (business_id)
  do update set next_number = work_order_counters.next_number + 1
  returning next_number - 1;
$$;

-- ---------------------------------------------------------------------------
-- work_orders — a concrete unit of work created from an intake (§4.4).
-- `intake_responses` and `work_order_kind` are snapshots taken at generation
-- time (§5.1) -- later template edits never change an existing order.
-- ---------------------------------------------------------------------------
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  intake_template_id uuid not null references public.intake_templates (id) on delete restrict,
  work_order_kind text not null check (
    work_order_kind in ('customer', 'display_wig', 'internal', 'missing_item', 'repair')
  ),
  number integer not null,
  status text not null default 'confirmed' check (
    status in (
      'draft', 'confirmed', 'active', 'ready_for_handoff', 'completed', 'on_hold', 'cancelled'
    )
  ),
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  due_at timestamptz,
  order_received_date date not null default current_date,
  intake_responses jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, number)
);

create index work_orders_business_id_idx on public.work_orders (business_id);
create index work_orders_customer_id_idx on public.work_orders (customer_id);
create index work_orders_status_idx on public.work_orders (business_id, status);

create trigger work_orders_set_updated_at
  before update on public.work_orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- runtime_tasks — the actual, snapshotted board tasks generated from an
-- intake (§4.4, §5.2, §6). Self-contained: title/description/work_stage_id/
-- requires_approval are frozen copies, never re-read from the catalog.
-- ---------------------------------------------------------------------------
create table public.runtime_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  task_type_id uuid references public.task_types (id) on delete set null,
  title text not null,
  description text,
  work_stage_id uuid not null references public.work_stages (id) on delete restrict,
  sequence_order integer not null default 0,
  status text not null default 'pending' check (
    status in (
      'pending', 'in_progress', 'awaiting_approval', 'returned_for_rework',
      'done', 'deferred', 'skipped', 'cancelled'
    )
  ),
  assigned_staff_member_id uuid references public.staff_members (id) on delete set null,
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  requires_approval boolean not null default false,
  approver_staff_member_id uuid references public.staff_members (id) on delete set null,
  production_notes text,
  source text not null check (source in ('template', 'manual', 'other')),
  origin_item_id uuid references public.intake_template_items (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index runtime_tasks_business_id_idx on public.runtime_tasks (business_id);
create index runtime_tasks_work_order_id_idx on public.runtime_tasks (work_order_id);
create index runtime_tasks_work_stage_id_idx on public.runtime_tasks (work_stage_id);

create trigger runtime_tasks_set_updated_at
  before update on public.runtime_tasks
  for each row execute function public.set_updated_at();
