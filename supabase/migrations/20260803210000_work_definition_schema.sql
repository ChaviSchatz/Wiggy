-- Slice 2 — Work-definition catalog: work_stages, staff_members, task_types,
-- task_groups (+ task_group_items), intake_templates (+ intake_template_items).
-- See docs/architecture.md §4.2-§4.3, docs/domains/work-stages-and-staff.md,
-- docs/domains/work-definition.md, ADR 0002/0003/0006.
--
-- These are tenant-configurable *catalog* tables (ADR 0002): tenant data, not
-- code. `work_orders`/`runtime_tasks` (a later slice) snapshot values off of
-- them at generation time and never read them again (architecture §5).

-- ---------------------------------------------------------------------------
-- work_stages — ordered production phases / board columns (§4.2).
-- ---------------------------------------------------------------------------
create table public.work_stages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  key text not null,
  name text not null,
  sort_order integer not null default 0,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, key)
);

create index work_stages_business_id_idx on public.work_stages (business_id);

create trigger work_stages_set_updated_at
  before update on public.work_stages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- staff_members — people who perform work; a login (`user_id`) is optional.
-- ---------------------------------------------------------------------------
create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name text not null,
  title text,
  default_work_stage_id uuid references public.work_stages (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index staff_members_business_id_idx on public.staff_members (business_id);
create index staff_members_user_id_idx on public.staff_members (user_id);

create trigger staff_members_set_updated_at
  before update on public.staff_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- task_types — reusable catalog item (a *kind* of work). Holds only its own
-- defaults; no intake-specific metadata (docs/domains/work-definition.md).
-- ---------------------------------------------------------------------------
create table public.task_types (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  default_work_stage_id uuid not null references public.work_stages (id) on delete restrict,
  default_staff_member_id uuid references public.staff_members (id) on delete set null,
  default_duration_minutes integer,
  requires_approval_default boolean not null default false,
  instructions text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_types_business_id_idx on public.task_types (business_id);
create index task_types_default_work_stage_id_idx on public.task_types (default_work_stage_id);

create trigger task_types_set_updated_at
  before update on public.task_types
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- task_groups — a configurable grouping of task types (e.g. "Color").
-- ---------------------------------------------------------------------------
create table public.task_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_groups_business_id_idx on public.task_groups (business_id);

create trigger task_groups_set_updated_at
  before update on public.task_groups
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- task_group_items — many-to-many join; a task type may belong to several
-- groups. Tenant derives from the parent `task_groups.business_id` (no
-- separate `business_id` column — see the RLS migration).
-- ---------------------------------------------------------------------------
create table public.task_group_items (
  id uuid primary key default gen_random_uuid(),
  task_group_id uuid not null references public.task_groups (id) on delete cascade,
  task_type_id uuid not null references public.task_types (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_group_id, task_type_id)
);

create index task_group_items_task_group_id_idx on public.task_group_items (task_group_id);
create index task_group_items_task_type_id_idx on public.task_group_items (task_type_id);

create trigger task_group_items_set_updated_at
  before update on public.task_group_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- intake_templates — a configurable form/process definition (ADR 0003).
-- Not necessarily customer-facing; `work_order_kind` covers internal
-- production, display wigs, missing-item, and repair flows too (§10).
-- ---------------------------------------------------------------------------
create table public.intake_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  work_order_kind text not null check (
    work_order_kind in ('customer', 'display_wig', 'internal', 'missing_item', 'repair')
  ),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index intake_templates_business_id_idx on public.intake_templates (business_id);

create trigger intake_templates_set_updated_at
  before update on public.intake_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- intake_template_items — the single ordered list that *is* the form
-- (ADR 0003). Every item is exactly one `item_kind`; the check constraint
-- below enforces which reference columns apply for each kind. `field_type`
-- has no DB-level enum here on purpose: architecture.md notes the fixed set
-- is code-defined, to be validated in the app layer once the work-definition
-- domain module (and its [config] editors) is built.
--
-- Tenant derives from the parent `intake_templates.business_id` (no separate
-- `business_id` column — see the RLS migration), matching `task_group_items`.
-- ---------------------------------------------------------------------------
create table public.intake_template_items (
  id uuid primary key default gen_random_uuid(),
  intake_template_id uuid not null references public.intake_templates (id) on delete cascade,
  sort_order integer not null default 0,
  item_kind text not null check (item_kind in ('task_type', 'task_group', 'field', 'section')),
  task_type_id uuid references public.task_types (id) on delete cascade,
  task_group_id uuid references public.task_groups (id) on delete cascade,
  field_key text,
  field_label text,
  field_type text,
  options jsonb,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intake_template_items_kind_refs check (
    (item_kind = 'task_type' and task_type_id is not null and task_group_id is null)
    or (item_kind = 'task_group' and task_group_id is not null and task_type_id is null)
    or (item_kind in ('field', 'section') and task_type_id is null and task_group_id is null)
  )
);

create index intake_template_items_intake_template_id_idx
  on public.intake_template_items (intake_template_id);
create index intake_template_items_task_type_id_idx on public.intake_template_items (task_type_id);
create index intake_template_items_task_group_id_idx on public.intake_template_items (task_group_id);

create trigger intake_template_items_set_updated_at
  before update on public.intake_template_items
  for each row execute function public.set_updated_at();
