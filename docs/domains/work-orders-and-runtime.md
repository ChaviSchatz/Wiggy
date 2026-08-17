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
- **`missing_items`** — a top/skin/material the order is waiting on: `work_order_id, kind
  (top|skin|material), description, status (open|found|ordered|handled),
  responsible_staff_member_id?, handled_at?, notes`. **Not** a runtime task — it is procurement
  chasing, not production work, so it never occupies a board column or a personal queue.

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

## Missing items
- Created **automatically** from an intake missing-stock flag (`config.missing_item_kind`,
  architecture §6.5) or **manually** by an office role, always against one order.
- Statuses form a lifecycle but not a ratchet — any status from any other, with `handled_at`
  stamped only while `handled` (architecture §7.4, ADR 0011).
- Surfaced in three places: the dashboard alert, the order hub's warnings section, and the
  missing-items list (the only screen where they are edited).

## Related
- ADR 0003, ADR 0006, ADR 0004 (activity), ADR 0011 (missing items). Architecture §4.4, §5, §6, §7.
