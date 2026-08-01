# 0010 — Task-centric production board with worker-avatar assignment

**Status:** Accepted

## Context
The production board could be **order-centric** (one card per order at its current stage) or
**task-centric** (one card per task at its stage). Reference comps are customer-led, but the
underlying model is task-based, and there is a real everyday parallel case (hand-tying the *top*
while the *base* is still being machine-sewn), plus future planning-engine resequencing that opens
later-stage tasks early. All of these need task granularity.

## Decision
The production board is **task-centric**:
- **One card per task**, placed in its work-stage column. A single order may therefore appear in
  **multiple columns** at once (e.g. the top/base parallel case).
- Card **text leads with the customer name** + order code (identity is **text — no client
  avatar**). Customer-less orders lead with order kind + code.
- The card **avatar is the assigned worker** (circular; **tap → reassign**). The **primary action
  (Done/Start) is inline on the card** — no drawer needed for the everyday action.
- **Tapping the card body → quick-view peek** (compact info, reference photos, quick actions);
  **"open full order" → the full-page work-order hub** (`docs/ui/work-order-hub.md`).
- The board shows **live work by stage only** (active/available tasks), not the full backlog.
- **Reference photos** (style/color) render as **squared** thumbnails when present — visually
  distinct from circular worker avatars (`docs/ui/design-language.md`).

Availability stays **linear per order with a manual manager override** (ADR 0008) — the parallel
top/base case is handled by the manager unlocking the blocked task on the rare occasion it's needed,
not by modeling parallelism.

## Why
- Matches the real work model (tasks, assignment, the top/base parallel case) and the future
  planning engine, while keeping the customer-led, salon feel of the comps.
- Reassignment is one tap where the manager already looks (the worker avatar).

## Alternatives considered
- **Order-centric board** — cleaner "one card per wig," but can't show an order in two stages,
  fights the top/base case, and mismatches the task-level queue/sprint. Rejected.

## Consequences
- Avatar identity differs by surface (board = worker; My Work / hub = customer) — see
  `docs/ui/design-language.md`.
- Reassign is available from the board (screen inventory #37).
- Depends on the availability overlay + override (architecture §7.3).
