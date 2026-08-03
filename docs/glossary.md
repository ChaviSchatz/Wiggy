# Glossary — Ubiquitous Language

Shared vocabulary for Wiggy. Use these exact terms in code, docs, and UI keys.

## Core modeling terms
| Term | Meaning |
|------|---------|
| **Tenant / Business** | A client salon. Root of data isolation (`businesses`, `business_id`). |
| **Membership** | A user's link to a tenant, carrying their role. |
| **Work Stage** | An ordered production *phase* / board column (Intake, Color, …). *The where.* Stations are merged into this. |
| **Task Type** | A reusable catalog definition of a *kind* of work (Wash, Full color, Top check). Holds defaults only. |
| **Task Group** | A configurable grouping of task types (Color → Full color, Roots, Highlights). *A catalog grouping, not a stage.* |
| **Intake Template** | A configurable form/process definition that drives work; decides which task types/groups are relevant and how they appear. |
| **Intake Template Item** | One ordered element of an intake template: a task type, a task group, a field, or a section. |
| **Work Order** | A concrete unit of work created from an intake (customer, internal, display wig, etc.). |
| **Runtime Task** | The actual, snapshotted task on the production board (assignable, trackable). |
| **Snapshot** | A frozen copy of resolved values on an order/task at generation time; never changed by later template edits. |
| **Activity** | An append-only event in the unified stream (audit + history + timeline). |
| **Sprint** | A tenant-configurable time-box the manager plans work into (2 days / 1 week / 2 weeks / …). |
| **Queue rank** | A task's fractional position in one employee's personal queue (exact working order). |
| **Availability** | Derived overlay on a task — `available` (startable) or `blocked` (predecessors unfinished). Not a status. |
| **Personal queue** | An employee's assigned tasks, ordered by queue rank (current → next → rest → future/blocked → completed). |
| **Approvals (on board)** | `awaiting_approval` tasks are handled on the production board (highlight + inline approve/return + filter + dashboard count), kept out of the personal queue (ADR 0009). |

## Status vocabulary
| Term | Applies to | Meaning |
|------|-----------|---------|
| `pending` | task | created, not started |
| `in_progress` | task | being worked |
| `awaiting_approval` | task | submitted, needs approval |
| `returned_for_rework` | task | approval rejected, back to worker |
| `done` | task | completed (and approved if required) |
| `deferred` | task | manually paused |
| `skipped` | task | intentionally not needed (normal) |
| `cancelled` | task/order | voided/aborted |
| `blocked` | task | **reserved (future)** — prerequisite not met (dependency engine) |
| `draft` | order | intake in progress |
| `confirmed` | order | tasks generated, none started (backlog) |
| `active` | order | work underway |
| `ready_for_handoff` | order | all tasks done, awaiting pickup/delivery |
| `completed` | order | delivered/collected/closed |
| `on_hold` | order | manually paused |

## Hebrew ↔ English (UI-facing domain terms)
> App-shell strings come from i18n catalogs; this table is the canonical mapping. Tenant-entered
> content is stored as entered and not translated (ADR 0005).

| English | Hebrew |
|---------|--------|
| Wig | פאה |
| Work order | הזמנת עבודה |
| Customer | לקוח / לקוחה |
| Task | משימה |
| Work stage | שלב עבודה |
| Production board | לוח ייצור |
| Intake | קליטה |
| Intake form | טופס קליטה |
| Staff member | איש/אשת צוות |
| Approval | אישור |
| Sewing | תפירה |
| Hand tying | קשירה ידנית |
| Color | צבע |
| Wash / Styling | חפיפה / עיצוב |
| Final review | ביקורת סופית |
| Pickup / Delivery | איסוף / מסירה |
| Draft | טיוטה |
| Pending | ממתין |
| In progress | בביצוע |
| Done | הושלם |
