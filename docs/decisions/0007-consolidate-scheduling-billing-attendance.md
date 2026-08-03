# 0007 — Consolidate scheduling, appointments, billing & attendance into Wiggy

**Status:** Accepted (scope/intent) — individual modules designed in their own later sessions.

## Context
The salon currently runs a **separate program** for worker calendars/scheduling, client
appointments, billing, and daily time-clock (attendance). That tool is disconnected from
production, so appointments, billing, and worker day-plans don't reflect the real state of the
work.

## Decision
Wiggy will **absorb these capabilities** so they live on top of the production model, with
**production status as the spine**:
- **Worker production calendar** — assigned runtime tasks viewable per worker/day; unfinished work
  carries to today.
- **Client appointments** — real appointment entity, on the *same* calendar as production tasks
  for client-facing staff.
- **Production ↔ appointment coupling** — client appointments can only be booked when the relevant
  production tasks/order reach the required status.
- **Billing** — a completed order becomes billable (future module).
- **Attendance** — workers clock in/out; feeds availability/capacity and future payroll.

## Why
- One source of truth: appointments, billing, and day-plans stay correct because they derive from
  actual task/order state.
- Removes a disconnected external tool and its manual reconciliation.

## Alternatives considered
- **Keep the external tool and integrate via API** — rejected as the long-term model; the value is
  in the tight coupling to production, which is awkward across a third-party boundary. (An API
  bridge could be an interim step if needed.)

## Consequences
- Sequencing and scope live in `docs/roadmap.md`. **Scheduling & Calendar** is the next dedicated
  design session; **billing** and **attendance** are reserve-room-now / detail-later.
- The current data model reserves hooks (appointments, invoices, time_entries, task
  `scheduled_date`) so these modules don't force a rewrite (roadmap "reserve-room data hooks").
- Peripheral pieces (e.g. billing integrations, an AI/scheduling optimizer) may become satellite
  services per the extraction triggers in `docs/architecture.md` §1.3.
