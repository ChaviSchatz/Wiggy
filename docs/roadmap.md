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
| Employee task management (sprint & queue) | **Designed (this phase)** | Manual sprint + automatic sequence availability. ADRs 0008/0009; `docs/domains/sprint-and-task-queue.md`. |
| Production calendar (day view) | **Parked** | Added complexity not needed now; may revisit. |
| Client appointments + production coupling | **After planning engine** | Appointment entities/types + booking gated by production. |
| Billing | **Reserve room now, detail later** | Invoices keyed off order completion. |
| Time-clock / attendance (שעון נוכחות) | **Reserve room now, detail later** | Feeds worker availability/capacity + future payroll. |
| Planning / dependency engine | **Deferred** (`architecture.md` §8) | Due-date auto-computation, capacity, auto-rollover, `available`/`blocked`. |

## Employee task management (this phase) — designed
Replaces the calendar-first approach with a **manually-managed sprint** over existing
`runtime_tasks` (no new task system). Designed in `docs/domains/sprint-and-task-queue.md`; decisions
in ADR 0008 (sprint + sequence availability) and ADR 0009 (approvals as a separate managerial
queue). Highlights:
- Tenant-configurable **sprint** time-box; manager pulls open tasks, assigns, and sets each
  employee's exact order (`queue_rank`).
- **Automatic availability** (linear per-order sequence): blocked tasks show in the future queue
  but aren't startable until predecessors are done — pulled forward from the planning engine.
- Employee personal queue (current → next → queue → future/blocked → completed); approvals live in
  a separate approver view.

**Deferred to the planning-engine session:** branching/parallel dependencies, capacity/workload,
auto-assignment, dynamic reprioritization, estimated completion, automatic rollover, sequence
skipping.

## Client appointments (after planning engine)
Appointment entities/types and the **production ↔ appointment coupling** (booking gated by
production status; unified worker view) were **resequenced to after the planning engine**, since
they lean on planning concepts. Reserve-room hooks below still apply. The day-grid **calendar view
is parked**.

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
