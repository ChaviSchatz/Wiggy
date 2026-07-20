# 0009 — Approvals are a separate managerial queue

**Status:** Accepted

## Context
Some tasks require approval by a manager (e.g. Fradi). The manager also has her *own* production
and planning tasks. If approvals land in her main personal task queue, they conflate **managing
work** with **doing work**, cluttering her day-to-day list.

## Decision
Approvals are handled as a **separate managerial surface**, not as items in the personal task
queue:
- The approver sees an **"Awaiting approval" view** = tasks where `status = awaiting_approval` and
  `approver_staff_member_id = me`. This is distinct from their personal work queue.
- On the **production board**, an awaiting-approval task shows an approve / return-for-rework
  control at its stage (where the worker submitted it).
- A person's **main queue** contains only tasks **assigned to them** (`assigned_staff_member_id`),
  ordered by `queue_rank`. A manager can therefore have *both* a personal work queue and an
  approvals view.

## Why
- Keeps each person's day-to-day "what do I work on next" list focused on their own execution work.
- Cleanly separates oversight/quality-control from production, matching how the manager actually
  works.

## Alternatives considered
- **Approvals inside the approver's main queue** — rejected: mixes managing with doing and clutters
  the personal queue.

## Consequences
- No new fields — approvals are already identifiable via `status` + `approver_staff_member_id`.
- Two distinct per-person surfaces: "My queue" (assigned work) and "Awaiting approval" (as
  approver). Both read the same `runtime_tasks` — no duplicate state.
