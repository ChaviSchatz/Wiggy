# Domain: Work Definition (configuration catalog)

**Purpose:** The tenant-configurable definitions that decide _what work exists_ and _how intake
presents it_. This is what lets each salon shape its own process without a code fork.

## Entities

- **`task_types`** — reusable, standalone catalog item (a kind of work). Holds **only its own
  defaults**: `default_work_stage_id`, `default_staff_member_id?`, `default_duration_minutes?`,
  `requires_approval_default`, `instructions`, `sort_order`. **No intake-specific metadata.**
- **`task_groups`** — a configurable group of task types (e.g. "Color").
- **`task_group_items`** — many-to-many join `(task_group_id, task_type_id, sort_order)`. A task
  type may belong to multiple groups.
- **`intake_templates`** — a configurable form/process definition. `work_order_kind` ∈
  `{customer, display_wig, internal, missing_item, repair, …}`. Not necessarily customer-facing.
- **`intake_template_items`** — the **single ordered list that _is_ the form**. Each item is one of
  `item_kind`: `task_type`, `task_group`, `field`, or `section`. Carries a `config` JSON with
  intake-specific settings (mandatory, visible, default_selected, selection_mode, display_style,
  section_title, help_text, generates_runtime_tasks, allow_other, other_default_work_stage_id).

## Key rules

- **Separation of concerns:** Task Type = identity + defaults (reusable). Intake Template Item =
  how _this_ form presents/selects it. (ADR 0003.)
- **Snapshot on use:** editing any of these affects **new orders only**; existing orders keep their
  snapshot (architecture §5).
- Field types are a fixed, code-defined set: `text`, `textarea`, `boolean`, `select`
  (`src/lib/work-definition/field-types.ts`). `select` reads its values from the item's `options`
  column. The builder validates against this set on write and the intake wizard renders from it on
  read, so the two cannot drift.
- **Templates deactivate, never delete** — `work_orders.intake_template_id` is `on delete restrict`.
  Template _items_ can be deleted: `runtime_tasks.origin_item_id` is `on delete set null` and is
  written but never read.

## Related

- ADR 0002, ADR 0003, ADR 0006. Architecture §4.3, §5, §6.
