# 0002 — Clients configure their own work definitions

**Status:** Accepted

## Context

Different salons run different processes: different order types, different production steps,
different intake questions. The original system hardcoded much of this for one client.

## Decision

Make **work definitions data, not code**. Task types, task groups, work stages, and intake
templates are **tenant-configurable** through the admin UI. A salon can define its own catalog and
forms without any code change or deployment.

## Why

- It is the mechanism that makes reselling viable — onboarding a new salon is configuration, not a
  code fork (supports ADR 0001).
- More up-front UI work, but it removes recurring engineering cost per client.

## Alternatives considered

- **Hardcode one client's setup and generalize later** — faster to first launch but creates forks
  and technical debt; rejected because resale is a primary goal.

## Consequences

- Requires admin configuration screens (Task Types, Task Groups, Work Stages, Intake Templates).
- Permissions for _who can configure_ remain role-gated (manager/admin).
- The _set_ of task **statuses** and **work-stage semantics** remain system-level; only the
  content/catalog is tenant-configurable. Work stages are configurable-but-governed (admin-level,
  never per work order).
