-- Slice 3 — Customers (docs/architecture.md §4.5, docs/domains/customers.md).
-- Fields are intentionally simple for now: full CRM (tags, follow-ups,
-- communication log, merge duplicates) is future scope. No uniqueness
-- constraint on phone/email -- "merge duplicate customers" is [future],
-- implying duplicates are expected and reconciled later, not rejected now.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_business_id_idx on public.customers (business_id);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();
