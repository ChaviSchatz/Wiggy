# 0001 — Multi-tenant SaaS product

**Status:** Accepted

## Context
Wiggy started as a tool for a single salon (Tzipi & Fradi). The goal is now to resell the same
product to many independent salons.

## Decision
Build Wiggy as a **multi-tenant SaaS**: many client salons ("tenants") share one deployment,
with each tenant's data fully isolated from the others. Each tenant self-serves its own
configuration.

## Why
- One codebase and one deployment to maintain, rather than a fork per client.
- Isolation is the core trust guarantee of a B2B product — one salon must never see another's data.
- Enables future self-service onboarding and subscription billing without re-architecture.

## Alternatives considered
- **Single-tenant / per-client deployments** — simpler isolation but multiplies operational and
  maintenance cost; rejected.
- **Database-per-tenant** — strong isolation but heavy to operate at many small tenants; rejected
  for now in favour of shared-DB row-level isolation.

## Consequences
- Every tenant-scoped table carries `business_id`; isolation is enforced at the database via RLS
  (mechanism documented in `docs/architecture.md` §2).
- A user relates to a tenant via `memberships`, so a user can belong to multiple tenants later
  with no schema change.
- Billing/subscription fields are added to `businesses` when Stripe is introduced (future).
