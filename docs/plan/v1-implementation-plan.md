# WigFlow v1 — Implementation Plan

> **For agentic workers:** implement slice-by-slice; each slice is a shippable vertical increment.
> Within a slice, screens are built from `docs/ui/design-system.md` archetypes + components — **no
> design re-brainstorming**, just execution. Expand each slice's tasks into TDD steps at the moment
> you start it, against the scaffold from Slice 0.

**Goal:** Ship v1 of WigFlow — intake → runtime tasks → task-centric board + worker queue + sprint
planning + work-order hub + missing items — for the first salon (seeded config).

**Architecture:** Single-monolith Next.js (App Router) + Supabase (Postgres/Auth/Storage/RLS),
business logic in server actions over a framework-agnostic domain layer; Tailwind + shadcn/ui with
warm-studio tokens; Hebrew-first RTL via next-intl. See `docs/architecture.md`.

**Tech Stack:** Next.js, TypeScript, Supabase, TanStack Query, Tailwind, shadcn/ui, next-intl,
lucide, Vitest + Testing Library, Playwright.

**References:** `docs/architecture.md` · `docs/ui/{screen-inventory,information-architecture,design-language,design-system,screen-designs,work-order-hub}.md` · `docs/domains/*` · ADRs 0001–0012.

---

## Slice ordering (each is shippable/testable)

0. Foundation & app shell → 1. Identity/tenancy/auth/RLS → 2. Seed work-definition data →
1. Customers → 4. Intake → order → runtime-task generation → 5. Task-centric board →
2. Work-order hub + task actions + approvals → 7. Sprint & personal queue → 8. Missing items +
   dashboard + feedback → 9. Polish (print, states, i18n copy, a11y, QA).

---

## Slice 0 — Foundation & app shell

**Goal:** runnable RTL app + tooling + local Supabase.
**Modules/files:** `package.json`, `next.config`, `tailwind.config`, `app/` (root layout, providers),
`lib/` (supabase client, query client, i18n), `components/ui/*` (shadcn), `components/shell/*`
(TopBar, SideNav, BottomBar), `messages/he.json`, `supabase/` (config, migrations), `.env.example`,
`eslint`/`prettier`/`vitest`/`playwright` configs, `AGENTS.md` dev commands.
**Tasks:**

- Scaffold Next.js + TS; add Tailwind + shadcn; encode `design-system.md` tokens as theme.
- next-intl with `he` default + `dir="rtl"`; logical-property lint rule.
- Supabase CLI local; empty migration; type-gen script.
- App shell per `information-architecture.md`: desktop right SideNav + TopBar; tablet BottomBar; role-filtered nav stub.
- Set up Vitest + Testing Library + Playwright; sample test; lint/format.
  **Acceptance:** `dev` runs; RTL shell renders; i18n string resolves; `lint`, `test`, `build` pass;
  `supabase start` up; types generate. **Update `AGENTS.md` Cursor Cloud section with real dev/test/build commands + env vars.**

## Slice 1 — Identity, tenancy, auth, RLS

**Goal:** secure multi-tenant auth.
**Modules:** migrations for `businesses`, `profiles`, `memberships` (+ RLS helper `current_business_id`);
`lib/auth/*`, `lib/roles.ts` (role set + permissions map), server actions for bootstrap; route
guards; screens: Login, Forgot/Reset, First-login bootstrap, Profile.
**Tasks:** auth flows (email/password); RLS policies (membership-based); `bootstrap_current_user`
on first login; `can(user, action)` guard used in server actions + nav; seed one admin/manager user.
**Acceptance:** login works; RLS blocks cross-tenant reads (test); nav/actions gated by role.

## Slice 2 — Seed work-definition data (seeded; editors are [config], later)

**Goal:** the salon's catalog exists as data.
**Modules:** migrations for `work_stages`, `task_types`, `task_groups`, `task_group_items`,
`intake_templates`, `intake_template_items`, `staff_members`; `supabase/seed.sql`.
**Tasks:** seed default stages (Intake…Pickup), task types/groups, one "New Wig" intake template with
items (fields + task/group selections), staff. Regenerate types.
**Acceptance:** seeded catalog present + queryable under RLS; types available.

## Slice 3 — Customers

**Goal:** manage customers (List archetype).
**Modules:** `customers` migration + RLS; domain `lib/customers/*`; screens: list (search/filter),
create/edit (Dialog/form), detail.
**Acceptance:** CRUD works; RLS-scoped; validated forms; empty/loading states.

## Slice 4 — Intake → order → runtime-task generation (core loop)

**Goal:** create an order and generate tasks.
**Modules:** `work_orders`, `runtime_tasks` migrations + RLS; domain `lib/work-orders/generate.ts`
(three-layer defaulting + snapshot + sequence, `docs/architecture.md` §5–§6); New Order **Wizard**
(4 steps) with dynamic intake render from `intake_template_items`; confirm action.
**Tasks:** wizard steps (customer → template → dynamic intake → details/confirm); generation server
action (snapshot fields, `sequence_order` from stage order, "Other" → task); order number.
**Acceptance:** create order via intake; correct runtime tasks generated with snapshots + sequence;
field/note items saved to `intake_responses`; unit tests on the generator.

## Slice 5 — Task-centric production board (ADR 0010)

**Goal:** live work by stage, actionable.
**Modules:** domain `lib/availability.ts` (linear + `availability_override`); Board archetype
(columns = `work_stages`, TaskCard); quick-view peek (Drawer); AssigneePicker; task transitions.
**Tasks:** render tasks by stage; customer-led text + circular worker avatar; inline Start/Done +
UndoToast; availability overlay (blocked greyed) + manager override; tap avatar → reassign; tap card
→ peek; FilterBar (employee/type/status/stage).
**Acceptance:** tasks appear by stage; start/done with undo; blocked shown + unlockable; reassign;
peek opens/dismisses; board stays in sync with status. Playwright happy-path.

## Slice 6 — Work-order hub + actions + approvals

**Goal:** the unified order screen + approvals.
**Modules:** `task_approvals`, `task_comments`, `attachments`, `activity`, `missing_items` migrations;
Hub (Detail archetype, full page per `work-order-hub.md`); Dialogs: add/"Other" task, defer/resume,
approve/return, cancel, mark delivered, upload, edit-intake; Awaiting-approval view.
**Tasks:** hub sections (identity/text, stepper, next-action, tasks w/ circular avatars, notes,
files, squared reference photos, audio, warnings/missing, history from `activity`, general details,
back-to-board); transitions write `task_approvals` + `activity`; edit-intake audited.
**Acceptance:** hub renders; approve/return; comments; attachments (squared) + voice; edit-intake
audited; delivered/cancel; every transition logs `activity`.

## Slice 7 — Sprint & personal queue (ADR 0008/0009)

**Goal:** manager planning + worker queue.
**Modules:** `sprints` migration + tenant cadence setting; Sprint planning Board (lanes per employee,
backlog, drag → `queue_rank`, filters, create/close sprint); My Work Queue (tablet archetype);
Approvals view (separate).
**Tasks:** assign + reorder (fractional rank); backlog → lane; employee queue now→next→queue→
blocked→done (next = top-ranked available); approvals excluded from personal queue.
**Acceptance:** manager plans/reorders a sprint; worker sees correct ordered queue; approvals only in
approver view; unfinished carries to next sprint.

## Slice 8 — Missing items + dashboard + feedback

**Goal:** operational glue.
**Modules:** missing-items list/handle/create (List + Dialog), auto-create from intake flag; role
dashboards (KpiCard + widgets); feedback Dialog + `feedback_items`.
**Acceptance:** missing item lifecycle (open→found→ordered→handled) + dashboard alert; role-tailored
dashboards; feedback submitted/stored.

## Slice 9 — Polish

**Goal:** ship-ready.
**Tasks:** work-order print template; EmptyState/Skeleton/error pages per screen; Hebrew copy pass;
a11y + 44px touch targets; RTL audit; end-to-end smoke (Playwright) of the core loop.
**Acceptance:** lint/test/build green; core journeys pass on desktop + tablet widths.

---

## Testing strategy

- **Unit (Vitest):** domain logic — generation, availability (+override), permissions, ordering.
- **Integration:** server actions against local Supabase (RLS enforced).
- **E2E (Playwright):** per-slice happy paths; RTL + tablet viewport for worker flows.
- TDD for domain logic; commit per task; each slice ends green.

## Self-review (done)

- **Spec coverage:** every `[v1]` screen in `screen-inventory.md` maps to a slice (auth→1, customers→3,
  intake/orders→4, board→5, hub/approvals/missing→6/8, sprint/queue→7, dashboard/feedback→8, print/states→9).
- **Consistency:** entity/field names match `docs/architecture.md` §4; availability/override per §7.3;
  identity/media per `design-language.md`; archetypes/components per `design-system.md`.
- **No design placeholders:** screens resolve to archetypes; deferred `[config]`/`[future]` items are
  out of v1 by design (seeded config).
