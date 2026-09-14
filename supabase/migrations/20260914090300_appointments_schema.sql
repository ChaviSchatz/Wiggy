-- appointments — a staff-booked client meeting (screen #67). Design spec
-- "Data model": customer_id is required (unlike work_orders.customer_id)
-- because every appointment must have a customer; on delete restrict, so
-- deleting a customer with appointment history is blocked rather than
-- silently orphaning the link -- the one FK here that behaves differently
-- from its nearest sibling table, called out deliberately. staff_member_id
-- stays nullable + on delete set null even though always set by the app,
-- matching every other staff_member_id reference in this schema.
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_member_id uuid references public.staff_members (id) on delete set null,
  customer_id uuid not null references public.customers (id) on delete restrict,
  work_order_id uuid references public.work_orders (id) on delete set null,
  appointment_type_id uuid not null references public.appointment_types (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete set null,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index appointments_business_id_idx on public.appointments (business_id);
create index appointments_staff_member_id_idx on public.appointments (staff_member_id);
create index appointments_customer_id_idx on public.appointments (customer_id);
create index appointments_work_order_id_idx on public.appointments (work_order_id);

-- Serves the reminder sweep (find scheduled appointments starting soon,
-- per business). The board/hub "nearest upcoming for this order" lookup
-- is served by appointments_work_order_id_idx instead, not this one.
create index appointments_business_starts_idx
  on public.appointments (business_id, starts_at)
  where status = 'scheduled';

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();
