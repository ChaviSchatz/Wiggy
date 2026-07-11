# Architecture Decision Records (ADRs)

ADRs here capture **product decisions** — *what* the system does, *how* it behaves, and *why*
we chose that. They are the durable record of product intent.

**ADRs are for product decisions, not technical ones.** Technical/stack decisions (framework,
RLS, i18n mechanism, snapshot implementation, etc.) live in `docs/architecture.md` and are
considered fixed foundation, not re-litigated per feature.

## Format
Each ADR is one numbered file: `NNNN-short-title.md`, containing:
- **Status** — Accepted / Superseded / Proposed
- **Context** — the situation / problem
- **Decision** — what we decided
- **Why** — reasoning and what it enables
- **Alternatives considered**
- **Consequences** — trade-offs and follow-ups

## Index
- [0001](0001-multi-tenant-saas-product.md) — Multi-tenant SaaS product
- [0002](0002-clients-configure-their-own-work-definitions.md) — Clients configure their own work definitions
- [0003](0003-intake-templates-generate-runtime-tasks.md) — Intake templates generate runtime tasks (no disconnected checklist)
- [0004](0004-one-unified-activity-timeline.md) — One unified activity timeline
- [0005](0005-multilingual-ready-hebrew-first.md) — Multilingual-ready, Hebrew-first
- [0006](0006-other-free-text-always-creates-a-task.md) — "Other" free-text always creates a runtime task
- [0007](0007-consolidate-scheduling-billing-attendance.md) — Consolidate scheduling, appointments, billing & attendance into WigFlow
