# Domain: Identity & Tenancy

**Purpose:** Who the user is, which tenant(s) they belong to, and their role.

## Entities

- **`businesses`** — the tenant (a salon). Holds branding, timezone, default locale.
- **`profiles`** — user identity, extends Supabase `auth.users`; tenant-agnostic.
- **`memberships`** — links a user to a tenant with a role; unique `(user_id, business_id)`.

## Roles & permissions

- Roles: `admin`, `manager`, `secretary`, `worker` (extensible — see below).
- `memberships.role` is **plain text** validated against a code-defined set.
- **Permissions map lives in one app-layer module.** Adding a role = editing that one file (+ its
  permission entries). No migration.
- Enforced in server actions (authoritative) and reflected in the UI.

## Invariants

- Every tenant-scoped row is accessible only to users with an active `membership` for its
  `business_id` (enforced by RLS — `docs/architecture.md` §2).
- Auth (login, reset) is Supabase Auth; there is no open self-registration by default.

## Related

- ADR 0001 (multi-tenant SaaS). Architecture §1.1, §2.
