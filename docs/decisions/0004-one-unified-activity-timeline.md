# 0004 — One unified activity timeline

**Status:** Accepted

## Context

The original system wrote an audit log but had no UI for it, and separately wanted a customer
timeline and per-order history. These are three views of the same underlying fact: "something
happened."

## Decision

Record every meaningful action once, in a **single append-only `activity` stream**, and reuse it to
power **audit log**, **work-order history**, and the **future customer timeline**.

## Why

- Write once, reuse everywhere — no parallel logging systems to keep in sync.
- Directly enables the near-term Customer Timeline goal for little extra cost.
- A single, queryable history is easier for both humans and AI agents to reason about.

## Alternatives considered

- **Separate audit log now, build timeline later** — simpler immediately but duplicates
  infrastructure and risks divergence; rejected.

## Consequences

- `activity` rows carry enough context (`verb`, `subject_type/id`, optional `work_order_id`,
  `customer_id`, `payload`) to render any of the three views by filtering.
- Every state transition (task and order) writes an activity entry.
- Append-only: entries are never edited or deleted.
