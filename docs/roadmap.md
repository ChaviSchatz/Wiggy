# WigFlow — Roadmap & Module Plan

> Living document. Sequencing and scope of modules. Individual modules get their own
> brainstorming session + ADRs/domain docs before implementation.

## Vision
WigFlow **absorbs the salon's external "mini-CRM + scheduling + billing + time-clock" tool** into
one product. The unifying principle: **production status is the spine** — worker calendars, client
appointments, billing, and attendance all key off task/order state.

## Repository
Single monolith (see `docs/architecture.md` §1.3). Peripheral/non-core capabilities may later be
extracted into satellite services when they hit the extraction triggers documented there.

## Sessions & phasing

| Area | Status | Notes |
|------|--------|-------|
| Core model: Work Definition + Runtime | **Designed** | `docs/architecture.md`, ADRs 0001–0006. |
| UI/UX usability & look-and-feel | **Own session (pending)** | Consumes this architecture as constraints. |
| Scheduling & Calendar | **Next dedicated session (this phase)** | Worker production calendar + client appointments + coupling. See below. |
| Billing | **Reserve room now, detail later** | Invoices keyed off order completion. |
| Time-clock / attendance (שעון נוכחות) | **Reserve room now, detail later** | Feeds worker availability/capacity + future payroll. |
| Planning / dependency engine | **Deferred** (`architecture.md` §8) | Due-date auto-computation, capacity, auto-rollover, `available`/`blocked`. |

## Scheduling & Calendar session — scope
**In scope (buildable with manual/simple dates):**
- **Worker production calendar** — per-worker view over `runtime_tasks` (assignee + scheduled/due
  date); unfinished work surfaced on *today* (display carried-over; do not silently move dates).
- **Client appointments** — an `appointments` entity (customer, staff, datetime, status:
  scheduled/arrived/cancelled/…, linked to a work order).
- **Unified calendar** — production tasks *and* client appointments for the same worker on one
  calendar (a view over both sources).
- **Production ↔ appointment coupling** — appointment booking **gated by production status** (e.g.
  a pickup/fitting can only be booked when the order/stage reaches the right state).

**Deferred to the planning-engine session:** automatic scheduling, worker capacity/buffers,
estimated completion, automatic date rollover.

## Coupling decisions (reserved now, detailed in their sessions)
- **Production gates appointments** — appointment types can require a work-order/stage status
  before booking.
- **Completion triggers billing** — `work_orders.status = completed` makes an order billable
  (future `invoices` / `invoice_lines`).
- **Attendance feeds capacity** — future `time_entries` (staff clock in/out) feed worker
  availability and, later, payroll.

## Reserve-room data hooks (not built yet)
- Worker calendar: `runtime_tasks.assigned_staff_member_id` + `due_at` (add `scheduled_date` in the
  scheduling session).
- `appointments` → `customers`, `staff_members`, `work_orders`.
- `invoices` / `invoice_lines` → `work_orders`.
- `time_entries` → `staff_members`.
