# WigFlow — Architecture (Technical Foundation)

> **Status:** Living document. This is the *fixed technical foundation* of the system.
> Product/behaviour decisions live in `docs/decisions/` (ADRs). Domain detail lives in
> `docs/domains/`. Shared vocabulary lives in `docs/glossary.md`.
>
> **Rule:** Every code change that affects structure, data, or behaviour must update the
> relevant doc here or in `docs/domains/`, and any *product* decision must add/update an ADR.
> See `AGENTS.md` for the full rules of engagement.

WigFlow is a **multi-tenant SaaS** for managing task-and-process work in wig-manufacturing
salons. It began as a single-client production tool and is being rebuilt to be resold to
many salons without code forks. It is **Hebrew-first / RTL**, but built multilingual-ready.

---

## 1. Stack (fixed — not re-litigated)

| Layer | Choice | Notes |
|-------|--------|-------|
| UI engine | **React 18** | Base rendering library. |
| App framework | **Next.js (App Router)** | SSR/RSC, file routing, server actions = the trusted server layer. One deployable. |
| Components | **shadcn/ui** (on Radix UI) | Copied into the repo and owned; not a locked dependency. |
| Styling | **Tailwind CSS** | Uses **logical properties** (`ps/pe`, `ms/me`, `text-start/end`) for RTL/LTR. |
| Backend platform | **Supabase** | Managed **Postgres + Auth + Storage + RLS**. |
| Data fetching | **TanStack Query** | Client-side caching/refetching. |
| Language | **TypeScript** | End to end. |
| Schema source of truth | **Postgres migrations** (Supabase CLI) | TS types generated from the DB schema so app ↔ DB never drift. |
| i18n | **next-intl** | Message catalogs; default locale `he`, `dir="rtl"`. |

### 1.1 Where business logic lives
**Business logic lives in the app layer** (Next.js server actions, TypeScript). We drop down
to Postgres functions (RPC) **only when there is a concrete reason** (e.g. a transaction that
must be atomic at the DB level). This keeps logic testable, type-safe, and portable.

### 1.2 Lock-in posture
The database is plain Postgres (portable via `pg_dump`); Supabase is open-source and
self-hostable. We **avoid deeply proprietary Supabase features** (Realtime, Edge Functions)
unless there is a strong, documented need.

### 1.3 Repository topology & future service extraction
- **Single monolith repo.** One repository holds the full Next.js app (UI + server
  actions/route handlers), the Supabase data layer (migrations, RLS, functions, seed), and
  `docs/`. There are **no** separate frontend/backend/DB repos. Rationale: efficiency and
  maintainability for a small team; a well-built Next.js + Postgres monolith comfortably serves
  the planned scale (hundreds of tenants), so **scale is not a reason to split**.
- **Modularity discipline** (so a future split is lift-and-shift, not a rewrite):
  - Organize code **by domain module** (bounded context: identity, work-definition, work-orders,
    scheduling, …), *not* by scattering technical layers.
  - Each module has a **framework-agnostic domain/service layer** (plain TS) holding business
    logic that **must not import Next.js**. Server actions/route handlers are **thin adapters**
    that call the domain layer.
  - Modules interact only through **explicit public interfaces** — no reaching into another
    module's internals. Enforce with **import-boundary lint rules** (e.g. dependency-cruiser /
    ESLint).
  - **DB access is encapsulated per module** (repository functions).
  - Expose a **versioned HTTP API (`/api/v1`)** so external programs have a stable contract from
    day one.
- **When to extract a service (triggers — NOT lines of code, NOT tenant count):** any of — a
  component needs an independent scaling/resource profile (AI/ML, heavy optimization, media
  processing); needs independent deploy cadence or team ownership; needs fault isolation from core
  production; is best in another language/runtime; or is a heavy async/queue workload. The natural
  first extractions are **peripheral, non-core capabilities** (AI/API integrations, billing
  integrations, a scheduling optimizer). The **core product stays a monolith** — "monolith core +
  satellite services."

---

## 2. Multi-tenancy & security

- **Model:** shared database, **row-level tenant isolation**. Every tenant-scoped table has a
  `business_id`.
- **Enforcement:** **PostgreSQL Row-Level Security (RLS)** is a *blanket guardrail* — a row is
  visible/editable only if the current user has an active `membership` for that row's
  `business_id`. RLS is standard Postgres (not Supabase lock-in) and prevents cross-tenant
  leakage even if app code has a bug. This is defence-in-depth, **not** "logic in the DB."
- **Business logic** still runs in server actions; RLS is only the isolation net.
- **Permissions** (which role may do what) live in **one app-layer code module** (the role set
  + permission map together). `memberships.role` is stored as **plain text validated against
  that set** (not a Postgres enum), so **adding a role = editing one file** — no migration.
  Enforced in server actions (the real check) and reflected in the UI.

---

## 3. Domain map (bounded contexts)

1. **Identity & Tenancy** — tenants (`businesses`), users (`profiles`), `memberships` (user↔tenant + role).
2. **Work Stages & Staff** — `work_stages` (the ordered production phases / board columns; *stations merged in here*) and `staff_members` (people who do work; may lack a login).
3. **Customers** — customer records; anchor for the future CRM timeline.
4. **Work Definition (configuration)** — `task_types`, `task_groups`, `task_group_items`, `intake_templates`, `intake_template_items`.
5. **Work Orders & Runtime** — `work_orders`, `runtime_tasks`, `task_approvals`, `task_comments`.
6. **Attachments & Media** — one polymorphic `attachments` table.
7. **Activity & Audit** — one unified `activity` stream (powers audit + order history + customer timeline).
8. **Platform** — tenant settings/branding, feedback.

See `docs/domains/` for per-domain detail.

---

## 4. Core data model

> Fields below are the *shape*; exact columns/types are finalized in migrations. All
> tenant-scoped tables carry `business_id` + `created_at`/`updated_at` (omitted for brevity).

### 4.1 Identity & Tenancy
- **`businesses`** — `id, name, slug, logo_url, primary_color, timezone, default_locale (he), is_active`.
- **`profiles`** — `id (= auth uid), full_name, email, avatar_url`. Tenant-agnostic identity.
- **`memberships`** — `id, user_id→profiles, business_id→businesses, role (text), is_active`; unique `(user_id, business_id)`.

### 4.2 Work Stages & Staff
- **`work_stages`** — `id, business_id, key, name, sort_order, color, is_active`. Tenant-configurable-but-governed (admin edits; never per work order). Seeded from a system default set. **Board columns are `work_stages` ordered by `sort_order`.**
- **`staff_members`** — `id, business_id, full_name, title, default_work_stage_id?, user_id?→profiles (nullable), is_active`. Assignable to tasks; a login is optional. (Capacity fields are planning-engine future.)

### 4.3 Work Definition (tenant-configurable catalog)
- **`task_types`** — `id, business_id, name, description, default_work_stage_id, default_staff_member_id?, default_duration_minutes?, requires_approval_default (bool), instructions, sort_order, is_active`. **Reusable, standalone. Holds no intake-specific metadata.**
- **`task_groups`** — `id, business_id, name, description, sort_order, is_active`.
- **`task_group_items`** — join `(task_group_id, task_type_id, sort_order)`. **Many-to-many** — a task type may live in multiple groups.
- **`intake_templates`** — `id, business_id, name, work_order_kind, description, is_active`. Not necessarily customer-facing (see ADR 0003 / §9).
- **`intake_template_items`** — the **single ordered list** that *is* the form. `id, intake_template_id, sort_order, item_kind (task_type | task_group | field | section), task_type_id?, task_group_id?, field_key?, field_label?, field_type?, options?, config(JSON)`.
  - `config` = `{ mandatory, visible, default_selected, selection_mode (single|multi|all), display_style (checklist|dropdown|list), section_title, help_text, generates_runtime_tasks, allow_other, other_default_work_stage_id }`.

### 4.4 Work Orders & Runtime
- **`work_orders`** — `id, business_id, customer_id? (nullable), intake_template_id, template_version?, work_order_kind (snapshot), number, status (order-level), priority, due_at, order_received_date, intake_responses (JSON snapshot), notes, created_by`.
- **`runtime_tasks`** — `id, business_id, work_order_id, task_type_id? (null for "Other"), title (snapshot), description (snapshot), work_stage_id (snapshot), sequence_order, status, assigned_staff_member_id?, due_at (nullable in v1), started_at?, completed_at?, requires_approval (snapshot), approver_staff_member_id?, production_notes, source (template|manual|other), origin_item_id?`.
- **`task_approvals`** — approval events (approver, action, reason, timestamps).
- **`task_comments`** — internal comments on a runtime task.

### 4.5 Cross-cutting
- **`attachments`** — polymorphic: `id, business_id, kind (file|photo|voice), parent_type (work_order|runtime_task|customer), parent_id, storage_path, ...`.
- **`activity`** — append-only unified stream: `id, business_id, actor_user_id?, verb, subject_type, subject_id, work_order_id?, customer_id?, payload(JSON), created_at`. Powers audit log, order history, and the future customer timeline.

---

## 5. Two principles that govern the whole model

### 5.1 Snapshot on use
Definitions (task types, intake templates, stages) are *templates*. When a work order is
generated, the resolved values are **copied** onto the `work_order` (`intake_responses`,
`work_order_kind`) and its `runtime_tasks` (title, description, stage, requires_approval,
duration). **The catalog is read only at generation time and never again.** Editing a template
later affects **new orders only**; existing orders are immutable snapshots.

### 5.2 Three-layer defaulting → snapshot
Every operational attribute resolves in this order at generation, then freezes on the task:

```
TaskType default  →  IntakeTemplateItem override (optional)  →  RuntimeTask snapshot (frozen)
```

This answers "where does X live?": **stage, duration, and approval requirements are defaults on
the TaskType**, optionally overridden per template item, and finalized (copied) onto the runtime
task.

---

## 6. Runtime task generation (algorithm)

On **confirm intake** (`work_order.status: draft → confirmed`):
1. Walk `intake_template_items` in `sort_order`.
2. For each item:
   - `item_kind = field | section` → save into `work_orders.intake_responses` (structured data / notes). **Never a task.**
   - `item_kind = task_type` (selected/included) → create one `runtime_task`.
   - `item_kind = task_group` → create one `runtime_task` per selected task type (`selection_mode = all` includes every type in the group).
   - `allow_other` entries → create a `runtime_task` with `task_type_id = null`, `source = 'other'`, stage from `config.other_default_work_stage_id` (fallback: a general stage). See ADR 0006.
3. For each created task, resolve values via §5.2 and **snapshot** them.
4. **Sequencing (v1):** `sequence_order` derives from the task's `work_stage.sort_order`, tie-broken by item order; manager-editable per order afterward. **No blocking/enforcement in v1** — ordering is presentation + suggestion.

> Every intake selection has exactly one operational fate: **a real task**, **structured data**,
> **a note**, or **explicitly nothing**. There is no hidden checklist. (ADR 0003.)

---

## 7. State machines

### 7.1 Runtime task states (system-level; transitions enforced in app code)
States: `pending`, `in_progress`, `awaiting_approval`, `returned_for_rework`, `done`,
`deferred`, `skipped`, `cancelled`.

- `pending → in_progress` (start) · `pending → skipped | deferred | cancelled`
- `in_progress → done` (no approval required) · `in_progress → awaiting_approval` (approval required) · `in_progress → deferred`
- `awaiting_approval → done` (approve) · `awaiting_approval → returned_for_rework` (reject + reason)
- `returned_for_rework → in_progress` · `deferred → pending | in_progress`
- almost any → `cancelled`

Distinctions: **`skipped`** = intentionally not needed (normal); **`cancelled`** = voided/aborted.
**`deferred`** = *manual* pause. A **`blocked`** state is **reserved** for the future dependency
engine (§8) and is **not** implemented now.

### 7.2 Work order states (mostly derived from task states)
States: `draft`, `confirmed`, `active`, `ready_for_handoff`, `completed`, `on_hold`, `cancelled`.

- `draft` — intake in progress, not confirmed, no tasks.
- `confirmed` — intake confirmed, tasks generated, **all tasks still `pending`** (the "not-yet-started backlog" view).
- `active` — at least one task has moved beyond `pending`.
- `ready_for_handoff` — all non-`skipped`/`cancelled` tasks are `done` (≈ ready for pickup).
- `completed` — delivered/collected (manual), or auto for kinds without handoff.
- `on_hold` / `cancelled` — manual.

Manual transitions: *confirm intake* (`draft → confirmed`, triggers generation), *on hold/resume*,
*mark delivered* (`ready_for_handoff → completed`), *cancel*. A server action recalculates the
derived order status after every task change. `delivered` is an **order** outcome, never a task state.

---

## 8. Deferred: planning engine & dependency engine

Parked for a dedicated later design session (do **not** build now; the model only reserves room):
- **Due-date computation** from `default_duration` + order due/received dates.
- **Dependency engine:** explicit `task_dependencies` (prerequisite links, within *or* across
  stages) → computed **`available`** vs **`blocked`** task states, enabling non-linear flow
  (a task becomes workable when its *actual* prerequisites are met, not by rigid stage order).
- Worker capacity, buffers, estimated completion dates, automatic rollover.

Until then, ordering is soft (stage `sort_order` + editable `sequence_order`) with no enforcement.

---

## 9. Internationalization (Hebrew-first, multilingual-ready)

- **No hardcoded UI strings.** All app-shell copy comes from `next-intl` message catalogs.
  Default locale `he`, `dir="rtl"`; adding a language = a new message file.
- **Direction via logical CSS** (Tailwind `ps/pe`, `ms/me`, `text-start/end`) — never `left/right`.
- **Boundary:** i18n covers the **app shell** (buttons, labels, statuses, system messages).
  **Tenant-entered content** (a task type named `צבע`) is **data, stored as entered** — not
  auto-translated. Translating tenant content is a separate future feature.

---

## 10. Intake is not only for customers

`intake_templates.work_order_kind` ∈ `{ customer, display_wig, internal, missing_item, repair, … }`.
Customer details are just an **optional section** inside an intake, and `work_orders.customer_id`
is **nullable** — so internal production, display wigs, and missing-top/skin processes all use
the *same* intake → runtime-task machinery. (ADR 0003.)
