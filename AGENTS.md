# AGENTS.md — WigFlow

WigFlow is a **multi-tenant SaaS** for task-and-process management in wig-manufacturing salons.
**Hebrew-first / RTL**, built multilingual-ready. This file is the entry point for any AI agent or
human working in this repo. Read it first.

> **Current repo state:** implementation has begun. Slice 0 scaffolded the Next.js app
> (`package.json`, `src/`); Slice 1a added the Supabase data foundation (multi-tenant schema +
> RLS in `supabase/migrations`, roles module, generated types); Slice 1b added the auth-flow
> screens/guards on top of it (login, forgot/reset password, first-login bootstrap, sign-out,
> profile — `src/middleware.ts`, `src/lib/auth/`, `src/app/(auth)`, `src/app/(app)`), plus
> role-gated navigation; Slice 2 added the work-definition catalog schema (`work_stages`,
> `staff_members`, `task_types`, `task_groups`/`task_group_items`,
> `intake_templates`/`intake_template_items`) with read-only RLS (no editor UI yet — that's
> `[config]`, a later slice) and seeded it via `scripts/seed-work-definition.ts`; Slice 3 added
> `customers` (full CRUD, member-level RLS) with list/detail/create/edit/delete screens
> (`src/app/(app)/customers`, `src/lib/customers/`). The design is specified in `docs/`;
> implementation follows the specs there.

## Start here (read in this order)

1. `docs/architecture.md` — the **fixed technical foundation** (stack, multi-tenancy, data model,
   state machines, generation algorithm, i18n).
2. `docs/decisions/` — **product ADRs** (what the system does and why).
3. `docs/domains/` — per-domain detail (entities, invariants).
4. `docs/glossary.md` — ubiquitous language + Hebrew↔English mapping.
5. `docs/roadmap.md` — module plan & sequencing.
6. `docs/ui/screen-inventory.md` — the canonical screen list we build from (v1 / config / future tags).
7. `docs/ui/information-architecture.md` — navigation, role visibility, landing pages, device strategy.
8. `docs/ui/design-language.md` — visual direction ("warm operational studio") + avatar/identity rules.
9. `docs/ui/design-system.md` — build-ready tokens, components, page archetypes, interaction patterns.
10. `docs/ui/work-order-hub.md` — the central order screen (hybrid presentation + content).
11. `docs/plan/v1-implementation-plan.md` — the v1 build plan (vertical slices).
12. `context-files/Wiggy Summary Document - English Translation.md` — original product spec (input,
    partly superseded by the docs above; the `docs/` folder wins on any conflict).

## Rules of engagement (AI-native project)

This project is meant to stay readable to AI agents. When you change things:

- **Update docs in the same change.** Any change to structure, data, or behaviour updates the
  relevant file in `docs/architecture.md` or `docs/domains/`.
- **Product decisions → an ADR.** If you make or change a _product_ decision (what the system does,
  how it behaves, why), add/update a numbered ADR in `docs/decisions/` and its index. Technical/
  stack decisions are **not** ADRs — they live in `docs/architecture.md` and are treated as fixed
  foundation, not re-litigated per feature.
- **Keep the glossary authoritative.** Use the exact terms from `docs/glossary.md` in code and UI
  keys; add new terms there when introduced.
- **Schema is the source of truth.** DB changes go through migrations; TypeScript types are
  generated from the schema (never hand-edit generated types).

## Non-negotiable conventions

- **No hardcoded UI strings.** All app-shell copy comes from i18n message catalogs (`next-intl`),
  default locale `he`, `dir="rtl"`. Use Tailwind **logical properties** (`ps/pe`, `ms/me`,
  `text-start/end`), never `left/right`. Tenant-entered content is stored as entered, not
  translated (ADR 0005).
- **Business logic in the app layer** (Next.js server actions / TypeScript). Use Postgres functions
  only when there is a concrete reason (documented). (architecture §1.1)
- **Tenant isolation via RLS.** Every tenant-scoped table has `business_id`; never rely on app-code
  filtering alone. (architecture §2)
- **Runtime tasks/orders are snapshots.** Never make an existing order depend on live catalog rows.
  (architecture §5)
- **Every intake selection has one fate:** a real task, structured data, a note, or nothing. No
  disconnected checklists. (ADR 0003)

## Repository topology

Single **monolith** repo: Next.js app (UI + server actions) + Supabase data layer
(migrations/RLS/functions) + `docs/`. Keep code modular by domain (framework-agnostic domain layer;
thin adapters; enforced import boundaries) so peripheral capabilities can later be extracted into
satellite services without a rewrite. See `docs/architecture.md` §1.3.

## In scope now (designed)

- **Manual sprint + task queue** over existing `runtime_tasks` (no new task system) with
  **automatic linear per-order availability**. See `docs/domains/sprint-and-task-queue.md`,
  ADR 0008/0009, architecture §4.6 / §7.3. Approvals are a **separate approver view**, not in the
  personal queue.

## Deferred (do not build until their dedicated design session)

- **Planning engine:** branching/parallel dependencies, capacity/workload, auto-assignment,
  dynamic reprioritization, due-date computation, automatic rollover, sequence-skipping.
  (architecture §8)
- **Production calendar** (parked); **client appointments + coupling** (after planning engine);
  **billing** + **attendance** (reserve-room-later). See `docs/roadmap.md`.

## Stack (fixed)

Next.js (App Router) + React 18 + TypeScript · Tailwind + shadcn/ui · Supabase (Postgres + Auth +
Storage + RLS) · TanStack Query · next-intl. See `docs/architecture.md` §1.

## Wireframes

`docs/wireframes/intake-to-board.html` — a static, no-build mockup of the three core flows (admin
config → intake → production board). Open directly in a browser.

## Cursor Cloud specific instructions

Package manager is **npm**. Standard scripts live in `package.json`; the README documents dev
server, env vars, and the dev seed. Notes below are the non-obvious caveats.

- **Two test suites.** `npm run test` is unit-only (Vitest/jsdom) and needs no Supabase — keep it
  that way. `npm run test:integration` (config `vitest.integration.config.mts`) hits **local
  Supabase** and requires Docker + `npx supabase start` to be running.
- **First-time backend bring-up (one-time per VM; NOT in the update script).** Docker is not
  preinstalled. Install Docker Engine, then (Docker 29 on this VM) set `/etc/docker/daemon.json` to
  `{"storage-driver":"fuse-overlayfs","features":{"containerd-snapshotter":false}}`, switch to
  `iptables-legacy`, start `dockerd`, and run `npx supabase start`. Copy the printed API URL, anon
  key, and service_role key into `.env.local`. (System/service setup is intentionally excluded from
  the update script.)
- **Local Supabase is required** for `npx supabase db reset`, `npm run gen:types`, `npm run
seed:dev`, and `npm run test:integration`. Check with `npx supabase status`. Env vars
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) live in
  `.env.local` (gitignored).
- **Schema is the source of truth.** After changing `supabase/migrations`, run `npm run gen:types`
  to regenerate `src/lib/supabase/database.types.ts`; never hand-edit it (it's in `.prettierignore`).
- **Explicit table GRANTs.** Supabase local's default privileges do _not_ grant DML to
  `authenticated`/`service_role`, so migrations grant table verbs explicitly. New tenant tables must
  do the same or reads/writes fail with `permission denied` even with correct RLS.
- **Server-only admin client.** `src/lib/supabase/admin.ts` (service-role, bypasses RLS) imports
  `server-only`. Running it from plain Node needs the `react-server` export condition: `npm run
seed:dev` passes `--conditions=react-server --experimental-strip-types`, and the integration
  vitest config aliases `server-only` to a no-op stub. The `.ts` import extension in the seed script
  is why `tsconfig` sets `allowImportingTsExtensions`.
- **Dev login** (from `npm run seed:dev`): `admin@wiggy.local` / `wiggy-dev-password` (local only).
