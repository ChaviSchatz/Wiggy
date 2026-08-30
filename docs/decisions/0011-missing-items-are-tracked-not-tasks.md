# 0011 — Missing tops/skins are tracked items, not runtime tasks

**Status:** Accepted

## Context

Every new wig may be blocked on stock the salon does not have yet: no top, no skin, a missing
material. Today the salon notices this during intake ("no top in stock"), writes it down somewhere,
and someone remembers to chase it. The order is not idle — production continues on everything that
does not depend on the missing part — but the order cannot be handed off until the part arrives.

The intake already has a question for it, and ADR 0003 requires every intake selection to have
exactly one operational fate. So the question is what an answered "no top" flag _becomes_: a runtime
task on the board, or something else.

## Decision

A flagged shortage becomes a **`missing_items` row** — a tracked item attached to the order, never a
runtime task:

- **Auto-created from the intake flag.** An intake `field` item carrying
  `config.missing_item_kind (top|skin|material)` is a **missing-stock flag**; answering it creates a
  missing item of that kind (architecture §6.5). The flag remains structured intake data too, so the
  answer is still visible in the order's snapshot. Office roles can also add an item **manually**
  against any live order.
- **Never a board task.** Chasing a supplier is procurement, not production work, so a missing item
  occupies no work-stage column, no sprint, and no personal queue.
- **Lifecycle `open → found → ordered → handled`, not a ratchet.** Any status may be set from any
  other, because salons correct themselves ("marked handled, the top never turned up"). Only
  `handled_at` is derived from the transition — set while `handled`, cleared on the way back out
  (architecture §7.4).
- **Surfaced until resolved _or_ the order closes.** The dashboard alert and the order hub's
  warnings section show unhandled items; a completed or cancelled order stops raising the alarm even
  if the item was never formally handled, because nobody is going to chase a top for an order that
  no longer exists.
- **Audited like everything else.** Creation and each status change write to the unified `activity`
  stream (ADR 0004), against the **order** as subject with the kind/transition in the payload, so
  the shortage shows up in the order's history next to the work it delayed.
- **Editing happens in one place** — the missing-items list. The hub links to it rather than
  duplicating the handle dialog.

## Why

- A missing item has a **different lifecycle and a different owner** than production work: it is
  waiting on the outside world, not on capacity, so it must not compete for a worker's queue slot or
  distort the board.
- Keeping it out of `runtime_tasks` avoids a fake task that no availability rule, sprint, or
  approval flow knows what to do with.
- Auto-creation from the intake flag means the shortage is captured at the moment it is discovered,
  with zero extra steps for the person taking the order.

## Alternatives considered

- **Generate a runtime task ("order a top")** in a procurement stage. Uniform, and ADR 0003 would be
  satisfied trivially — but it pollutes the board and the personal queues with work nobody schedules,
  and the task state machine has no honest state for "waiting for a supplier". Rejected.
- **A plain note on the order.** Cheapest, but invisible: no status, no owner, no dashboard alert —
  exactly the situation the salon is already in. Rejected.
- **A separate order kind** (`work_order_kind = missing_item`) per shortage. Reserved for the case
  where sourcing genuinely _is_ the job with its own process (architecture §10); overkill for
  "this wig is missing its top". Rejected for this flow.

## Consequences

- `intake_template_items.config` gains `missing_item_kind`; the config editor (`[config]`, later
  slice) must expose it. An unrecognised kind in tenant config is dropped rather than inserted.
- Auto-creation is **best-effort** at confirm time: the order and its tasks are already committed,
  and the flag stays in `intake_responses`, so a failure degrades to adding the item manually.
- Item creation does **not** change the order's status. An order can reach `ready_for_handoff` with
  an unhandled missing item; the alert is what stops the handoff, not a state machine rule. Making
  it blocking is a follow-up if salons ask for it.
- Screen inventory #57 (feedback/triage-style management) stays `[config]`; missing items need no
  such screen because the list _is_ the management surface.
