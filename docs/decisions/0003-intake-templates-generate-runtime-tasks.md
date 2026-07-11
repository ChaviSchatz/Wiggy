# 0003 — Intake templates generate runtime tasks (no disconnected checklist)

**Status:** Accepted

## Context
The original system had intake forms that were essentially **checklists disconnected from the task
system** — production could not edit, assign, schedule, or track what was ticked during intake.
Upgrade/repair was a separate checklist entirely. This is the single biggest anti-pattern we are
fixing.

## Decision
The **intake template is the single configurable definition that drives work**. When an intake is
confirmed, its selections **generate real runtime tasks**. Every element chosen during intake has
exactly one operational fate:
1. **generate a real runtime task**, or
2. **save structured intake data**, or
3. **save a note/instruction**, or
4. **explicitly do nothing operational**.

There is **no hidden checklist** that production cannot act on. The intake is one ordered list of
items (`intake_template_items`) that mixes metadata fields, sections, notes, and task/task-group
selections.

Concepts:
- **Task Type** — reusable, standalone catalog item (a *kind* of work). Holds only its own defaults.
- **Task Group** — a configurable group of task types (e.g. "Color" → Full color, Roots, Highlights).
- **Intake Template** — decides *which* task types/groups are relevant and *how* they appear
  (mandatory/optional, single/multi-select, display style), per this form.
- **Runtime Task** — the actual, snapshotted task on the production board.

## Why
- Everything selected becomes trackable, assignable, schedulable production work.
- The same model serves customer orders, upgrades/repairs, internal production, and display wigs —
  no special-case checklists.
- Intake-specific configuration stays on the template item; task identity/defaults stay on the task
  type — clean separation, maximum reuse.

## Alternatives considered
- **Keep intake as a form + a separate task list** — the status quo; rejected because it produces
  untracked, unassignable work.

## Consequences
- Requires the three-layer defaulting + snapshot rules and the generation algorithm in
  `docs/architecture.md` (§5, §6).
- "Other" free-text is handled by ADR 0006.
- Runtime tasks are snapshots, so later template edits never alter existing orders.
