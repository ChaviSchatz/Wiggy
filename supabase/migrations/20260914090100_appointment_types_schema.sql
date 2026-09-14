-- appointment_types — tenant-defined catalog of client-meeting kinds
-- (consultation, fitting, pickup, ...). Same shape as `task_types`
-- (20260803210000_work_definition_schema.sql): name, default duration,
-- color, sort order, active flag. Never hard-deleted -- see RLS file.
create table public.appointment_types (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  default_duration_minutes integer,
  color text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointment_types_business_id_idx on public.appointment_types (business_id);

create trigger appointment_types_set_updated_at
  before update on public.appointment_types
  for each row execute function public.set_updated_at();
