# Domain: Work Stages & Staff

**Purpose:** The ordered production phases (board columns) and the people who do the work.

## Entities
- **`work_stages`** — ordered production phases (e.g. Intake, Planning, Machine Sewing, Hand Tying,
  Color, Wash/Styling, Final Review, Pickup). `sort_order` defines the macro sequence and the
  **production board columns**. *Stations are merged into this concept — there is no separate
  stations table.*
- **`staff_members`** — people who perform work; assignable to tasks. `user_id` is **nullable** —
  not every worker has a login. `default_work_stage_id` gives a default landing stage.

## Governance
- Work stages are **tenant-configurable-but-governed**: an admin can rename/reorder/enable/add
  them. They are **never** created per work order. Seeded from a system default set.

## Concept boundary (important)
- A **Work Stage** ("Color") = the *phase/where* work happens (a board column).
- A **Task Group** ("Color") = a *catalog grouping of task types* (see work-definition domain).
- These are different axes and must stay separate.

## Sequencing (v1)
- Macro order = `work_stages.sort_order`.
- Within a stage, tasks order by `runtime_tasks.sequence_order` (editable).
- **No enforcement/blocking in v1** — ordering is presentation + suggestion. Dependency-based
  `available`/`blocked` is deferred (architecture §8).

## Related
- ADR 0002. Architecture §4.2, §6, §8.
