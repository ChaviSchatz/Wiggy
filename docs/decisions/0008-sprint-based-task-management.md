# 0008 — Sprint-based task management with automatic sequence availability

**Status:** Accepted

## Context
The production board shows *where* tasks are in the process, but the production manager (Fradi)
needs an **operational layer** to run the shop: assign ~50–60 open tasks per period to specific
employees, set each employee's exact working order, and let each employee know what to do next
without asking. Employees must also see upcoming work that isn't startable yet because earlier
production steps aren't finished.

## Decision
Add a **manually-managed sprint** layer *on top of the existing `runtime_tasks`* — not a separate
task system:
- A **sprint** is a tenant-configurable time-box (length/cadence set per tenant: e.g. 2 days,
  1 week, 2 weeks). The manager pulls open tasks into the sprint, assigns them to employees, and
  sets each employee's exact order.
- **Availability is derived automatically** from **linear per-order sequence**: a task is
  `available` when every earlier-`sequence_order` task in the *same work order* is `done`,
  `skipped`, or `cancelled`; otherwise it is `blocked` (visible in the employee's future queue but
  not startable).
- Availability is a **derived dimension, not a status** — the task's `status` stays exactly as the
  board shows it (no second, conflicting status system; no duplicate task records).
- Each employee has a **personal queue**: current task → next (top-ranked *available* task) → rest
  of queue by rank → future/blocked (greyed) → completed.

## Why
- Gives the manager operational control and gives workers a self-service "what's next," now.
- Single source of truth: the sprint/queue is a view + a few fields over `runtime_tasks`, so the
  board and the queue never diverge.
- Sets up the future planning engine without pre-building it.

## Alternatives considered
- **Separate task/queue system** — rejected: duplicate records and conflicting statuses.
- **Calendar/day-grid view** — parked; unnecessary complexity for now.
- **Branching dependencies / capacity-aware scheduling now** — deferred to the planning engine.

## Consequences
- New fields on `runtime_tasks`: `sprint_id?`, `queue_rank` (fractional, per-assignee ordering),
  `priority?` (highlight flag). New `sprints` entity + a per-tenant sprint-cadence setting.
- Availability is recomputed whenever a task in the order transitions.
- **Still deferred (planning engine):** capacity/workload math, auto-assignment, dynamic
  reprioritization, branching/parallel dependencies, and sequence-skipping. The current structure
  must not block these. (`docs/architecture.md` §8)
- Supersedes the parked calendar approach and pulls *sequence-based* availability forward from the
  planning-engine phase (see `docs/roadmap.md`).
