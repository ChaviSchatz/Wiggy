-- Slice 8 — Missing items + dashboard + feedback: schema for the in-app
-- feedback box (screen inventory #58, docs/domains/cross-cutting.md
-- "Platform"). `missing_items` itself already landed in Slice 6
-- (20260817150000_hub_schema.sql); this slice only adds its UI, so the one
-- new table here is feedback.
--
-- No management/triage UI in v1 (screen inventory #57 is [config]), so the
-- table is deliberately append-only in shape: submissions carry no status or
-- assignee column that nothing would ever update.

-- ---------------------------------------------------------------------------
-- feedback_items — one in-app feedback submission, per tenant.
-- `page_path` records where the submitter was when they opened the dialog,
-- which is the single most useful piece of triage context to capture for
-- free. `submitted_by` is nullable only so a deleted user doesn't take their
-- feedback with them.
-- ---------------------------------------------------------------------------
create table public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  submitted_by uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('bug', 'feature', 'question')),
  message text not null,
  page_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feedback_items_business_id_idx on public.feedback_items (business_id);

create trigger feedback_items_set_updated_at
  before update on public.feedback_items
  for each row execute function public.set_updated_at();
