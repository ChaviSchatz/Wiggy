# Domain: Work Orders & Runtime

**Purpose:** The live work — orders and the runtime tasks that appear on the production board.

## Entities
- **`work_orders`** — `customer_id? (nullable), intake_template_id, work_order_kind (snapshot),
  number, status (order-level), priority, due_at, order_received_date, intake_responses (JSON
  snapshot), notes, created_by`.
- **`runtime_tasks`** — the actual board tasks. Self-contained **snapshots**: `task_type_id?
  (null for "Other"), title, description, work_stage_id, sequence_order, status,
  assigned_staff_member_id?, due_at?, started_at?, completed_at?, requires_approval,
  approver_staff_member_id?, production_notes, source (template|manual|other), origin_item_id?`.
- **`task_approvals`** — approval events (approver, action, reason, timestamps).
- **`task_comments`** — internal comments on a task.

## Lifecycle
- Created via **intake generation** (architecture §6): confirming an intake snapshots data onto the
  order and creates runtime tasks from the selected task types/groups.
- **Runtime tasks are immutable snapshots** — later catalog/template edits never change them.
- **Task states** and **order states**: see architecture §7. Order status is mostly **derived**
  from task states by a server action after every task change.
- `delivered` is an **order** outcome (`completed`), never a task state.

## Board
- The production board shows **real runtime tasks** grouped by `work_stages` (columns, ordered by
  `sort_order`), sorted within a stage by `sequence_order`.

## Related
- ADR 0003, ADR 0006, ADR 0004 (activity). Architecture §4.4, §5, §6, §7.
