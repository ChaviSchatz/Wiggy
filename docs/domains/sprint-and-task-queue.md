# Domain: Sprint & Task Queue (operational layer)

**Purpose:** An operational layer _on top of_ `runtime_tasks` so the production manager can plan a
sprint and each employee knows exactly what to work on next. **Not a separate task system** — a
view + a few fields over the existing production tasks. See ADR 0008, ADR 0009.

## Entities & fields

- **`sprints`** — `id, business_id, name?, starts_on, ends_on, status (planning|active|closed)`.
  A tenant-configurable time-box.
- **Per-tenant cadence** — a setting (on `businesses` / settings) for default sprint length (e.g.
  2 days, 7 days, 14 days). Sprints are created per this cadence; the manager may adjust.
- **`runtime_tasks` additions:**
  - `sprint_id?` — which sprint the task is pulled into (`null` = backlog).
  - `queue_rank` — fractional rank giving the **exact order within an assignee's queue**
    (drag-to-reorder). Scoped per assignee.
  - `priority?` — optional highlight flag (e.g. urgent); distinct from rank.

## Three ordering axes (keep distinct)

1. `work_stages.sort_order` — macro phase order (board columns).
2. `runtime_tasks.sequence_order` — order **within one work order** → drives availability.
3. `runtime_tasks.queue_rank` — order **within one employee's queue**, across different orders.

## Availability (derived — NOT a status)

- A task is **`available`** when every earlier-`sequence_order` task in the **same work order** is
  `done`, `skipped`, or `cancelled`; otherwise **`blocked`**.
- Availability is **computed** (optionally cached), recomputed whenever a task in the order
  transitions. The task's `status` is untouched → the board and queue never diverge.
- Only gates _not-yet-started_ work: a `blocked` task shows in the future queue (greyed, "waiting
  on …") but can't be started; once `available` + `pending`, it's startable.
- Linear per-order only for now; branching/parallel dependencies are deferred (planning engine).
- **Manual override** (`availability_override`): a manager can unlock a specific blocked task for
  rare real parallelism (e.g. hand-tying the top while the base is still being sewn). Audited;
  distinct from the planning engine (ADR 0008).

## Manager weekly/sprint planning view

- All open, actionable tasks for the sprint; **filter** by employee, task type, status, stage, etc.
- **Assign** tasks to employees; set each employee's **exact working order** (drag → `queue_rank`).
- Per-employee lanes showing **current** + **queue**; simple **workload counts** (not capacity —
  that's deferred).
- **Unassigned** tasks sit in a manager pool until assigned (not shown on any employee queue).

## Employee personal view

- **Current** task (in progress) → **Next** (top-ranked _available_ task) → **rest of queue** by
  `queue_rank` → **future/blocked** (greyed) → **completed**.
- Deterministic "next" = the highest-ranked `available` task in my queue.
- Employees see only tasks **assigned to them** (no self-serve pool in this phase).

## Approvals (separate — ADR 0009)

- **Not** in the personal queue. The approver has a separate **"Awaiting approval"** view.
- **v1 shipped scope:** business-wide — every `status = awaiting_approval` task, scoped only by
  the `approveTasks` permission, not by `approver_staff_member_id = me`. `approver_staff_member_id`
  has no population path yet; per-approver scoping is a future enhancement once it does (ADR 0009
  amendment).
- On the board, awaiting-approval tasks expose approve / return-for-rework at their stage.

## Carryover

- Unfinished tasks in a closed sprint carry into the next sprint (display/rollover), preserving
  history; stored planning data is not silently rewritten.

## Sync guarantee

- Everything here reads/writes the same `runtime_tasks` + `task_approvals`. No duplicate task
  records, no second status system.

## Related

- ADR 0008, ADR 0009. Architecture §4.4, §4.6, §7.3, §8. Roadmap: "Employee task management".
