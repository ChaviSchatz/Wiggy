# Glossary — Ubiquitous Language

Shared vocabulary for WigFlow. Use these exact terms in code, docs, and UI keys.

## Core modeling terms

| Term                     | Meaning                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Tenant / Business**    | A client salon. Root of data isolation (`businesses`, `business_id`).                                                      |
| **Membership**           | A user's link to a tenant, carrying their role.                                                                            |
| **Work Stage**           | An ordered production _phase_ / board column (Intake, Color, …). _The where._ Stations are merged into this.               |
| **Task Type**            | A reusable catalog definition of a _kind_ of work (Wash, Full color, Top check). Holds defaults only.                      |
| **Task Group**           | A configurable grouping of task types (Color → Full color, Roots, Highlights). _A catalog grouping, not a stage._          |
| **Intake Template**      | A configurable form/process definition that drives work; decides which task types/groups are relevant and how they appear. |
| **Intake Template Item** | One ordered element of an intake template: a task type, a task group, a field, or a section.                               |
| **Work Order**           | A concrete unit of work created from an intake (customer, internal, display wig, etc.).                                    |
| **Runtime Task**         | The actual, snapshotted task on the production board (assignable, trackable).                                              |
| **Snapshot**             | A frozen copy of resolved values on an order/task at generation time; never changed by later template edits.               |
| **Activity**             | An append-only event in the unified stream (audit + history + timeline).                                                   |
| **Sprint**               | A tenant-configurable time-box the manager plans work into (2 days / 1 week / 2 weeks / …).                                |
| **Queue rank**           | A task's fractional position in one employee's personal queue (exact working order).                                       |
| **Availability**         | Derived overlay on a task — `available` (startable) or `blocked` (predecessors unfinished). Not a status.                  |
| **Personal queue**       | An employee's assigned tasks, ordered by queue rank (current → next → rest → future/blocked → completed).                  |
| **Approvals view**       | An approver's separate managerial surface listing tasks `awaiting_approval` for them (not their personal queue).           |
| **Missing item**         | A top, skin or material an order is waiting on. Tracked alongside the order, never a runtime task (ADR 0011).              |
| **Missing-stock flag**   | An intake field carrying `config.missing_item_kind`; answering it creates a missing item of that kind.                     |
| **Feedback item**        | An in-app bug/feature/question submission, captured per tenant. Append-only in v1.                                         |

## Status vocabulary

| Term                  | Applies to   | Meaning                                                          |
| --------------------- | ------------ | ---------------------------------------------------------------- |
| `pending`             | task         | created, not started                                             |
| `in_progress`         | task         | being worked                                                     |
| `awaiting_approval`   | task         | submitted, needs approval                                        |
| `returned_for_rework` | task         | approval rejected, back to worker                                |
| `done`                | task         | completed (and approved if required)                             |
| `deferred`            | task         | manually paused                                                  |
| `skipped`             | task         | intentionally not needed (normal)                                |
| `cancelled`           | task/order   | voided/aborted                                                   |
| `blocked`             | task         | **reserved (future)** — prerequisite not met (dependency engine) |
| `draft`               | order        | intake in progress                                               |
| `confirmed`           | order        | tasks generated, none started (backlog)                          |
| `active`              | order        | work underway                                                    |
| `ready_for_handoff`   | order        | all tasks done, awaiting pickup/delivery                         |
| `completed`           | order        | delivered/collected/closed                                       |
| `on_hold`             | order        | manually paused                                                  |
| `open`                | missing item | flagged, nobody has found it yet                                 |
| `found`               | missing item | located in stock/elsewhere                                       |
| `ordered`             | missing item | ordered from a supplier, awaiting arrival                        |
| `handled`             | missing item | resolved; stamps `handled_at`                                    |

## Hebrew ↔ English (UI-facing domain terms)

> App-shell strings come from i18n catalogs; this table is the canonical mapping. Tenant-entered
> content is stored as entered and not translated (ADR 0005).

| English                          | Hebrew                     |
| -------------------------------- | -------------------------- |
| Wig                              | פאה                        |
| Work order                       | הזמנת עבודה                |
| Customer                         | לקוח / לקוחה               |
| Task                             | משימה                      |
| Work stage                       | שלב עבודה                  |
| Production board                 | לוח ייצור                  |
| Intake                           | קליטה                      |
| Intake form                      | טופס קליטה                 |
| Staff member                     | איש/אשת צוות               |
| Approval                         | אישור                      |
| Sewing                           | תפירה                      |
| Hand tying                       | קשירה ידנית                |
| Color                            | צבע                        |
| Wash / Styling                   | חפיפה / עיצוב              |
| Final review                     | ביקורת סופית               |
| Pickup / Delivery                | איסוף / מסירה              |
| Draft                            | טיוטה                      |
| Pending                          | ממתין                      |
| In progress                      | בביצוע                     |
| Done                             | הושלם                      |
| Missing items                    | פריטים חסרים               |
| Missing top / skin               | טופ חסר / עור חסר          |
| Open / Found / Ordered / Handled | פתוח / נמצא / הוזמן / טופל |
| Responsible                      | אחראי/ת                    |
| Feedback                         | משוב                       |
