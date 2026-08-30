# 0006 — "Other" free-text always creates a runtime task

**Status:** Accepted

## Context

Intake sometimes needs an escape hatch: work that isn't in the catalog yet (e.g. an unusual
repair). We must avoid this becoming untracked checklist data.

## Decision

When an intake item allows **"Other"** free-text and the user fills it in, the system **always
generates a real runtime task** (`task_type_id = null`, `source = 'other'`). It is a first-class
task — assignable, schedulable, approvable, and trackable like any other.

If the user only wants to **record information** (not request work), that belongs in a **note/field
intake item** (metadata), never in "Other". The distinction is **structural, not a toggle**.

We also provide a **"Promote to Task Type"** action to turn a recurring "Other" into a reusable
catalog task type (and optionally add it to a group).

## Why

- Guarantees no operational work hides as untracked text (supports ADR 0003).
- Removing the "is this a task or a note?" toggle prevents data from landing in the wrong place.
- Promotion lets the catalog self-improve from real usage.

## Alternatives considered

- **A per-item toggle "generate task vs. just note"** — rejected: ambiguous, risks displacing note
  data into tasks and vice versa. The note-vs-task choice is expressed by _which kind of intake
  item_ you use, not a toggle on "Other".

## Consequences

- Because a runtime task is a self-contained snapshot, an "Other" task needs no backing task type:
  its metadata comes from user input + the hosting intake item's `config`
  (`other_default_work_stage_id`, default approval) + system fallback (see `docs/architecture.md`
  §5.2, §6).
- `runtime_tasks.task_type_id` is nullable.
