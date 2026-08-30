# WigFlow — Screen Designs

> The design of every screen in the system, expressed as composition from the parts in
> `docs/ui/design-system.md`. Numbering follows `docs/ui/screen-inventory.md`.
>
> This file says **what each screen is made of and what leads**. It does not repeat token values, and
> it does not describe behaviour that already lives in `docs/architecture.md`, the domain docs, or an
> ADR — where product behaviour and visual design disagree, product behaviour wins.

## How to read this

Each screen gives its **archetype**, its **composition** in reading order, and any **screen-specific
rule** that is not already implied by the archetype. Anything not stated is inherited from the
design system, which means a screen with nothing specific to say is a good screen.

Two global rules that shape almost everything below:

- **Identity leads.** Every surface that represents work opens with the customer name. The order code
  is metadata beside it, never the headline.
- **One accent per view.** One plum primary action. Everything else is outline, ghost, or text.

---

## 1. Auth & account

### 1–4. Login · Forgot password · Reset password · Bootstrap

**Archetype I — Auth.** Centred card on `bg`, wordmark in `font-display` above it, single `Panel` at
`radius-md`, `FormField` stack, one full-width `primary` button, one text link beneath.

No side nav, no top bar. The wordmark is the only brand element, and it is the plum wordmark rather
than a logo lockup.

### 5. My profile

**Archetype G.** `PageHeader` + two stacked `Panel`s in a `max-w-lg` column: personal details, then
change password. Each panel owns its own Save button; there is no page-level save.

The worker avatar appears here at `lg` size as a preview. Until staff photos exist as a field, it
renders the monogram — the panel does not offer an upload control for something the schema cannot
store.

---

## 2. Home

### 7. Dashboard

**Archetype F.** Role-tailored, and the two variants are genuinely different screens rather than one
screen with rows hidden.

**Office / manager:** `PageHeader` with a greeting, then a four-up `KpiCard` grid, then attention
`Panel`s.

The KPI grid is where the "one accent per view" budget is spent: the single most operationally
important metric — active work in production — takes the emphasised treatment (2px plum border,
plum-soft eyebrow label), and the other three are plain. Values are `text-metric` in `font-display`
with `tabular-nums`.

Attention panels are flat lists, not cards-within-cards: customer name in `text-identity`, order code and
context in `muted`, `StatusChip` at the inline-end. Each panel header states what the list is for and
each row links to the work-order hub.

Sprint progress renders as a slim `mauve-100` track with a `mauve-600` fill. It is the one place a
width is set from data, so the fill is the only inline style in the product.

**Worker:** the dashboard is a thin summary, not a management surface. Greeting, the worker's own
counts, and a single prominent link into My Work. No business-wide numbers, because a worker seeing
counts they cannot act on is noise.

---

## 3. Customers

### 9. Customers list

**Archetype A.** `PageHeader` + `FilterBar` (debounced search) + `DataTable` + `Pagination`.

Columns: name, phone, city, active orders, last order, status. Name is `text-identity`; everything else
is `text-body` in `muted`. Counts and dates are `tabular-nums`. Row click opens the detail page; row
actions sit in a trailing cell.

### 10–11. Create / edit customer

**Dialog.** Two-column `FormField` grid that collapses to one below `sm`, notes spanning full width,
an active/inactive `Toggle` row, then `primary` save and `outline` cancel.

### 12. Customer detail

**Archetype B, light.** `PageHeader` with the customer name as title and phone/city as subtitle,
`BackLink` above it. Two-column layout at `lg`: order history on the wide side, details on the narrow
side.

Details render as label/value rows with the label in `muted` at a fixed inline-size, so values align
down the column. Order history rows lead with order kind and code, and carry a `StatusChip`.

---

## 4. Work orders

### 15. Work orders list

**Archetype A.** `PageHeader` + `FilterBar` (search, status, urgency) + `DataTable` + `Pagination`.

Columns: customer, order kind, code, created, due, status, urgency. Status and urgency are
`StatusChip`s; normal urgency renders as nothing at all rather than a grey "normal" chip, because a
chip on every row stops chips carrying information.

### 16–19. New order wizard

**Archetype C.** `PageHeader` + `Stepper` + a single step `Panel` + footer navigation, in a
`max-w-2xl` column. The stepper is the only progress indicator; steps do not repeat their own number
in a heading.

- **Step 1 — customer.** Search-and-select, or create inline. Results are selectable rows with a
  `mauve-100` hover ground and a 2px `mauve-600` border when selected.
- **Step 2 — intake template.** Selectable cards, one per order kind, same selection treatment.
- **Step 3 — intake.** Rendered from `intake_template_items`, so its structure is data, not layout.
  Sections become `Panel`s, fields become `FormField`s, task and group selections become checkbox and
  radio groups. "Other" free-text sits with the group it belongs to (ADR 0006).
- **Step 4 — details.** Dates, urgency, notes, then a summary of what will be generated.

Urgency is a two-option segmented control, not a chip row: normal selected shows a `mauve-600` border
on `mauve-100`, urgent shows `danger-200` on `danger-100` with a `danger-600` label. Two options,
because urgency has two values (ADR 0012).

Footer navigation is Back as `outline` on the inline-start and Next/Confirm as `primary` on the
inline-end, in that visual order regardless of writing direction.

### 20. Work-order hub

**Archetype B.** The most information-dense screen in the product, and the one that most needs the
panel rhythm to hold. Detailed content spec stays in `docs/ui/work-order-hub.md`; this is its visual
composition.

`BackLink` to the board, then `PageHeader` where the title is the customer name and the subtitle
carries order kind, code, and dates. Status and urgency `StatusChip`s sit in the header actions slot
alongside contact `IconButton`s.

Then, in order: `Stepper`; next-action `Panel` on a `cream` ground because it is advisory rather than
a state; warnings `Panel` with a `danger-200` border when non-empty and omitted entirely when empty;
tasks; notes; attachments; history.

Tasks are rows inside one `Panel`, not a card each: title, stage, assignee `Avatar`, `StatusChip`, and
inline action. Attachments are a `WorkImage` grid — squared, only what exists, with non-image files as
labelled tiles. History is a single-column timeline with the actor, the action, and a `tabular-nums`
timestamp.

`PrimaryActionBar` holds the order-level actions and sticks to the bottom of the viewport below `lg`.

### 20b. Work-order quick-view peek

**Archetype H.** Opens from a board or queue card on the inline-start edge.

Customer name in `font-display`, order code and urgency as metadata, contact `IconButton`s, then a
compact `Stepper`, a two-up grid of assignee / due / urgency / next action, the current-stage note,
then `WorkImage` thumbnails if any exist.

Actions pin to the bottom: `primary` for the stage action, `outline` for "open full order". The peek
answers "what is this and what is next"; anything more is the hub's job.

### 21–27. Order and task dialogs

**Dialog.** Confirm/start, cancel, mark delivered, edit intake, add manual task, upload attachment,
record voice note.

Cancel order is an `AlertDialog` with a solid `danger` confirm. Edit intake is audited, so its dialog
states that the change will be recorded. Upload and voice note show a structural progress state, not
a spinner.

### 28. Print view

Print stylesheet only: no chrome, no colour fills, black on white, `line` borders as hairlines,
identity and intake data at body size. Plum survives only in the wordmark.

---

## 5. Missing items

### 29. Missing items list

**Archetype A.** `PageHeader` + `FilterBar` (kind, status, responsible) + `DataTable` + `Pagination`.

Status is a `StatusChip`: open → `danger`, found and ordered → `peach`, handled → `sage`. Rows link to
their originating order, because a missing item is only meaningful in context (ADR 0011).

### 30–31. Handle / create missing item

**Dialog.** Handle advances status through open → found → ordered → handled with the current state
shown as a `StatusChip` and the next step as the `primary` action. Create is a short `FormField` stack.

---

## 6. Production board

### 32. Production board

**Archetype D.** The screen the product is judged on.

`PageHeader` (title, subtitle stating that the board shows active work by current stage, and a
`primary` new-order action) + `FilterBar` + a horizontally scrolling row of `KanbanColumn`s, one per
work stage in configured order.

Column headers carry the stage name, a count, and the `hairline` tick. **No column tints** — see the
`KanbanColumn` note in `design-system.md` for why `work_stages.color` is not used as one. An empty
column states that it is empty rather than rendering as a bare frame.

`FilterBar` renders task status as underline tabs (all, plus each live status), with worker and task
type as selects because their options are data-driven and unbounded. A small legend on the
inline-end maps dot colour to urgency state — three entries, not four (ADR 0012).

The board carries **no backlog panel and no approvals panel.** Backlog belongs to sprint planning and
approvals are a separate managerial queue (ADR 0009); the board is visible to every role that can see
production, so embedding either would put a manager's queue in front of workers. Where a manager needs
the count, the side-nav entry carries it.

There is no per-column "add work" affordance. Work enters through the New Order wizard, which
generates tasks, or through "add manual task" on the hub.

#### The WorkCard

One card per task (ADR 0010). Composition, in order:

| Slot         | Content                                                                 | Treatment                                       |
| ------------ | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Identity     | Customer name, or order kind when the order has no customer             | `text-identity`, truncated to one line          |
| Code         | Order number beside the identity                                        | `text-meta` `muted`, `tabular-nums`             |
| Urgency mark | Filled star when the order is urgent                                    | `danger-500`, inline with identity              |
| Task         | The task title                                                          | `text-body` `ink`                               |
| Assignee     | Worker `Avatar` at `sm`, tap to reassign                                | inline-start of the footer                      |
| Due          | Task due date, falling back to the order's, omitted when neither is set | `text-meta` `muted`, `tabular-nums`, inline-end |
| State        | Inline `Start`/`Done` action, or a `StatusChip` when no action applies  | inline-end of the footer                        |

A 2px `mauve-100` rule runs down the leading edge. Hover moves the border to `line-strong` and
translates `-1px`. No shadow.

**Not on the card:** no photo or thumbnail, no order kind, no stage name, no overflow menu. Order kind
is omitted because the task title is the actionable thing and the card is already carrying two lines
of identity; it is one tap away in the peek. Stage is omitted because the column already is the stage.
Photos belong to the peek and the hub.

Blocked tasks (sequence-unavailable, ADR 0008) render at reduced opacity with a `Lock` chip, and
managers see an unlock action for the documented override.

### 33–38. Task detail, comments, status changes, approve/return, reassign, defer

Task detail is the peek (20b). Comments are a thread inside the peek and the hub, each entry leading
with the author avatar and a `tabular-nums` timestamp.

Status changes are inline on the card with an `UndoToast`. Approve/return, reassign, and defer are
dialogs. Return-for-rework requires a reason, because the worker receiving it needs to know why.
Defer takes a reason and a resume date.

---

## 7. Sprint & personal queue

### 39. Sprint planning board

**Archetype D**, manager and admin only.

`PageHeader` through the shared component — this screen previously hand-rolled its own title, and it
does not any more. Sprint context (date range, or an empty state offering "create sprint") renders as
a `soft` chip row in the header actions slot.

Backlog column on the inline-start, then one lane per employee. Cards are `WorkCard` in its planning
variant: same identity and task lines, with assignment and up/down reorder controls in place of the
Start/Done action. Reorder is explicit buttons rather than pointer drag, matching the board's inline
action style and staying usable on a tablet.

### 40. Create / close sprint

**Dialog.** Date range and cadence on create; on close, a summary of what will roll over, since
unfinished tasks simply keep appearing rather than being rewritten.

### 41. My Work

**Archetype E**, tablet-first. Large targets, minimal chrome, sprint-agnostic.

Sections in the fixed order the queue derivation produces: **Current**, **Next**, **Queue**,
**Blocked**, **Completed**. Each is a `Panel` with a heading and a count.

`Current` takes a 2px `mauve-600` border, because it is the one thing the worker should be doing.
`Completed` takes a `sage` treatment. `Blocked` is reduced-opacity with a dashed border and states its
reason in words — deferred, or waiting on the preceding task — rather than as a bare lock icon, since
this is the surface where the worker needs to know _why_ they cannot proceed.

Items are `WorkCard` in its queue variant — the widest of the three, with a ≥44px primary action and
a `WorkImage` thumbnail where a reference photo exists, since recognising the physical wig matters
here in a way it does not on a triage board.

### 42. Awaiting-approval view

**Archetype A**, business-wide for any role that can approve.

Rows lead with customer name and order code, then the task and the reason it is waiting, then a
`WorkImage` thumbnail where one exists, then `Approve` as `primary` and `Return` as `outline`.

Rows are `Card`s rather than raw tinted divs, and the `peach` treatment marks the whole list as an
attention surface — set once on the section, not repeated on every row.

### 43. Bulk assign / reprioritize

**Dialog.** Multi-select from the current lane or backlog, then a single target worker or queue
position. States how many tasks will change before it commits.

---

## 8. Configuration

### 44–57. Settings hub, work stages, task types, task groups, intake templates, staff, users, branding, business settings, feedback management

**Archetype G** throughout: `PageHeader` + list + inline or side editor.

These are seeded rather than edited in v1, so the design commitment is narrow: they use the same
`DataTable`, `FormField`, and `Dialog` parts as every other list, and a reorderable list uses the same
explicit up/down controls as sprint planning rather than introducing a second reordering idiom.

The intake template builder (51) is the one genuinely novel surface here and will get its own spec when
it is built. Branding (55) is where a tenant will eventually override the brand token, which is another
reason the brand exists as one token rather than as scattered classes.

---

## 9. Cross-cutting

### 58. Submit feedback

**Dialog**, reachable from the top bar at every width. Category select, message, optional screenshot,
`primary` submit. Confirms in place rather than navigating away.

### 61. Empty, loading, and skeleton states

Every list, board column, and panel has all three. `EmptyState` states what is missing and offers one
action. Skeletons mirror the structure of what is loading — column shapes on the board, row shapes in a
table — so the layout does not jump. Loading routes render the `PageHeader` immediately so the page
identity is stable while content arrives.

### 62. Error pages — 403 / 404 / generic

Centred, `bg` ground, `font-display` heading, one sentence of explanation in `muted`, and one
`primary` action back to somewhere useful. 403 names the role limitation rather than implying the page
does not exist.

---

## 10. Responsive posture

| Range   | Chrome                                  | Content                                                                                                  |
| ------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `≥lg`   | Side nav + top bar over the main column | Full layouts; board scrolls horizontally                                                                 |
| `md–lg` | Bottom nav + sticky top bar             | Two-column layouts collapse to one; board keeps horizontal scroll                                        |
| `<md`   | Bottom nav + compact top bar            | Single column; tables become stacked rows led by identity; secondary metadata drops rather than wrapping |

Below `md`, a table row becomes a row of its own led by the identity line, with the two most
important columns beneath it and the rest available on the detail screen. Hierarchy is preserved by
dropping content, not by reflowing every column into a tall stack.
