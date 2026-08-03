# 0009 — Approvals stay out of the personal queue (handled on the board)

**Status:** Accepted (amended 2026-08-03 — no dedicated approvals screen in v1)

## Context
Some tasks require approval by a manager (e.g. Fradi). The manager also has her *own* production
and planning tasks. If approvals land in her main personal task queue, they conflate **managing
work** with **doing work**, cluttering her day-to-day list.

## Decision
Approvals are **not** items in a worker's personal task queue, and they do **not** need a dedicated
Approvals screen. They are handled **on the production board**:
- An `awaiting_approval` task is **highlighted on the board** in its stage with inline **Approve /
  Return-for-rework** controls (where the worker submitted it).
- The board offers an **"awaiting approval" filter**, and the dashboard shows an
  **awaiting-approval count**, so an approver finds pending approvals without a separate screen.
- A person's **main queue** contains only tasks **assigned to them** (`assigned_staff_member_id`),
  ordered by `queue_rank` — approvals never appear there.

**Principle (unchanged):** approvals are *managing* work, not day-to-day production, so they stay out
of the personal queue.

## v1 update (2026-08-03)
This ADR originally specified a **dedicated "Awaiting approval" screen** alongside the board
controls. Per PR review (#3), that separate screen/nav item is **dropped for v1** — the board
(highlight + inline approve/return + filter) plus a dashboard count covers it with fewer screens and
clicks. The core principle (approvals excluded from the personal queue) is unchanged. A dedicated
aggregated approvals view can return later if approval volume warrants it.

## Why
- Keeps each person's day-to-day "what do I work on next" list focused on their own execution work.
- Cleanly separates oversight/quality-control from production, matching how the manager actually
  works.

## Alternatives considered
- **Approvals inside the approver's main queue** — rejected: mixes managing with doing and clutters
  the personal queue.

## Consequences
- No new fields — approvals are already identifiable via `status` + `approver_staff_member_id`.
- **No dedicated approvals screen/nav in v1**; approvals are surfaced on the board (highlight +
  inline approve/return + filter) and via a dashboard count.
- Approvals never appear in the personal work queue. All of it reads the same `runtime_tasks` — no
  duplicate state.
