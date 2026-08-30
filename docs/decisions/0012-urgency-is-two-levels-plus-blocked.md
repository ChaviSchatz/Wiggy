# 0012 — Urgency is two levels plus blocked, not a graded scale

**Status:** Accepted

## Context

The UX/UI exploration for the production board arrived with an urgency legend of four states —
urgent, medium, on time, waiting. That is a reasonable thing for a designer to draw: four dot colours
make a board look legible at a glance.

The data does not support it. Urgency today is `work_orders.priority`, a two-value enum
(`normal | urgent`) set by whoever takes the order. `runtime_tasks.priority` exists but is a boolean
**queue-ordering flag** introduced for sprint planning (ADR 0008), not an urgency level.
"Waiting" is not stored at all — it is derived per task from linear sequence availability, and a
manager can override it.

So the question the comp raises is a product one: do we introduce a graded urgency scale, and does
lateness become an urgency level?

## Decision

**Urgency stays two-valued, and the board's urgency vocabulary is exactly three visual states.**

- **`work_orders.priority` remains `normal | urgent`.** No third level, no numeric scale.
- **The three states a card can express are `urgent`, `normal`, and `blocked`.** `urgent` is the
  order-level flag someone deliberately set. `blocked` is derived from sequence availability, not
  from urgency, and it renders as a lock rather than as a hot colour — it means _cannot be worked on_,
  not _worry about this_.
- **`normal` renders as nothing.** No grey "normal" chip on every card and every row. A chip that
  appears on everything communicates nothing and spends the view's colour budget.
- **`runtime_tasks.priority` never renders as urgency.** It orders a worker's queue and stays
  invisible outside sprint planning and My Work ordering.
- **Lateness is displayed, but it is not an urgency level.** A due date shows on the card as data:
  the task's `due_at`, falling back to the order's `due_at`, and omitted when neither is set. A past
  due date may be styled to read as late; it does not promote the order to `urgent`, and it does not
  add a legend entry.

## Why

- **A middle level has no definition and no owner.** Nobody at the salon can say what makes a wig
  "medium" rather than "normal", so in practice the middle bucket either stays empty or absorbs
  everything — and either way it teaches people to ignore the field.
- **The two states we do have are honest.** `urgent` is a decision a person made and can be held to.
  `blocked` is objective and computed. Both mean something specific.
- **It protects the colour budget.** The design language allows one accent per view and treats status
  colour as a scanning aid. Four urgency colours plus task-status chips plus the primary action is
  more colour than the board can carry before everything reads as equally loud.
- **Automatic due-date computation is deferred** (architecture §8), so `due_at` is only present when
  someone typed it. Deriving urgency bands from a field that is frequently empty would make urgency
  look broken rather than calm.

## Alternatives considered

- **Add a three-level enum** (`low | normal | urgent` or `normal | medium | urgent`). A small
  migration, and it matches the comp exactly. Rejected: it ships a field with no agreed definition,
  and grading work the salon does not grade is a planning-engine concern that is explicitly deferred.
- **Derive four urgency bands from `due_at`** (late / due soon / on time / no date). Tempting because
  it needs no schema change. Rejected as an _urgency_ model: it conflates a deadline with a
  prioritisation decision, and it would silently reclassify work as dates pass, which is the kind of
  moving target ADR 0008 avoided by keeping sequencing linear and explicit. The due date is still
  shown — as a date.
- **Overload `runtime_tasks.priority` as a second urgency tier.** No migration at all. Rejected: it
  is the sprint queue's ordering flag, and giving it a second meaning would make reordering a queue
  visibly change a task's urgency.

## Consequences

- The board legend has **three** entries, not four, and the sprint and My Work surfaces use the same
  three.
- `StatusChip` maps `urgent → danger`, `blocked → idle` with a lock, and `normal → nothing rendered`.
  This mapping lives in one component so a future change is one edit.
- The New Order wizard's urgency control is a **two-option** segmented control. If a third level is
  ever added, that control and the chip mapping are the only UI that changes.
- Adding a level later is a purely **additive** migration — a new enum value plus one row in the chip
  mapping — so this decision is cheap to revisit if salons start asking for it. What would not be
  cheap is retiring a level people had started using, which is the asymmetry driving the choice.
- Lateness styling is a **presentation** rule in `docs/ui/screen-designs.md`, not a status. If the
  salon later wants "late" to behave like a state — filterable, countable, escalating — that is a new
  decision and needs its own ADR.
