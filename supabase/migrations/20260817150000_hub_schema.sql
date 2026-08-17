-- Slice 6 — Work-order hub + task actions + approvals: schema for the
-- entities the hub needs beyond what Slices 4-5 already created.
-- See docs/architecture.md §4.4-§4.5, docs/domains/work-orders-and-runtime.md,
-- docs/domains/cross-cutting.md, ADR 0004 (unified activity), ADR 0009
-- (approvals as a separate managerial surface).

-- ---------------------------------------------------------------------------
-- runtime_tasks additions: defer (screen inventory #38) needs a reason +
-- resume date the architecture doc's field list didn't spell out (it only
-- names the `deferred` *status*, §7.1). Both are cleared on resume.
-- ---------------------------------------------------------------------------
alter table public.runtime_tasks
  add column deferred_reason text,
  add column deferred_until date;

-- ---------------------------------------------------------------------------
-- task_approvals — approval events (§4.4). One row per approve/return
-- decision; `runtime_tasks.status` itself is the current state, this table
-- is the audit trail of who decided what and why (return needs a reason).
-- ---------------------------------------------------------------------------
create table public.task_approvals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  runtime_task_id uuid not null references public.runtime_tasks (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('approve', 'return')),
  reason text,
  created_at timestamptz not null default now()
);

create index task_approvals_business_id_idx on public.task_approvals (business_id);
create index task_approvals_runtime_task_id_idx on public.task_approvals (runtime_task_id);

-- ---------------------------------------------------------------------------
-- task_comments — internal comments on a runtime task (§4.4).
-- ---------------------------------------------------------------------------
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  runtime_task_id uuid not null references public.runtime_tasks (id) on delete cascade,
  author_user_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index task_comments_business_id_idx on public.task_comments (business_id);
create index task_comments_runtime_task_id_idx on public.task_comments (runtime_task_id);

-- ---------------------------------------------------------------------------
-- attachments — one polymorphic table for all files (§4.5). No FK on
-- (parent_type, parent_id): it spans three different parent tables, so the
-- app layer is responsible for pointing at a real row (same trade-off
-- `intake_template_items` already makes with its own item_kind polymorphism).
-- Backed by Supabase Storage; `storage_path` is the object key, always
-- prefixed `${business_id}/...` so storage RLS can scope by tenant.
-- ---------------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null check (kind in ('file', 'photo', 'voice')),
  parent_type text not null check (parent_type in ('work_order', 'runtime_task', 'customer')),
  parent_id uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index attachments_business_id_idx on public.attachments (business_id);
create index attachments_parent_idx on public.attachments (parent_type, parent_id);

-- ---------------------------------------------------------------------------
-- activity — append-only unified stream (§4.5, ADR 0004). Powers audit log,
-- work-order history, and the future customer timeline from one write path.
-- No `updated_at` / update or delete grants below: entries are immutable.
-- ---------------------------------------------------------------------------
create table public.activity (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  verb text not null,
  subject_type text not null check (subject_type in ('work_order', 'runtime_task')),
  subject_id uuid not null,
  work_order_id uuid references public.work_orders (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_business_id_idx on public.activity (business_id);
create index activity_work_order_id_idx on public.activity (work_order_id);
create index activity_subject_idx on public.activity (subject_type, subject_id);

-- ---------------------------------------------------------------------------
-- missing_items (v1, §4.4) — schema only this slice; the list/handle/create
-- UI and intake auto-creation are Slice 8. Reserved now because the hub's
-- "warnings/missing" section (docs/ui/work-order-hub.md) links to it.
-- ---------------------------------------------------------------------------
create table public.missing_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  work_order_id uuid not null references public.work_orders (id) on delete cascade,
  kind text not null check (kind in ('top', 'skin', 'material')),
  description text,
  status text not null default 'open' check (status in ('open', 'found', 'ordered', 'handled')),
  responsible_staff_member_id uuid references public.staff_members (id) on delete set null,
  handled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index missing_items_business_id_idx on public.missing_items (business_id);
create index missing_items_work_order_id_idx on public.missing_items (work_order_id);

create trigger missing_items_set_updated_at
  before update on public.missing_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket for attachments. Private (not `public`): every read goes
-- through a signed URL issued after the storage.objects RLS check below.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;
