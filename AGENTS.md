# AGENTS.md — WigFlow

WigFlow is a **multi-tenant SaaS** for task-and-process management in wig-manufacturing salons.
**Hebrew-first / RTL**, built multilingual-ready. This file is the entry point for any AI agent or
human working in this repo. Read it first.

> **Current repo state:** design/documentation phase. The application is **not yet scaffolded** —
> there is no `package.json`/`src/` yet. The design is fully specified in `docs/`. Implementation
> follows the specs there.

## Start here (read in this order)
1. `docs/architecture.md` — the **fixed technical foundation** (stack, multi-tenancy, data model,
   state machines, generation algorithm, i18n).
2. `docs/decisions/` — **product ADRs** (what the system does and why).
3. `docs/domains/` — per-domain detail (entities, invariants).
4. `docs/glossary.md` — ubiquitous language + Hebrew↔English mapping.
5. `context-files/Wiggy Summary Document - English Translation.md` — original product spec (input,
   partly superseded by the docs above; the `docs/` folder wins on any conflict).

## Rules of engagement (AI-native project)
This project is meant to stay readable to AI agents. When you change things:
- **Update docs in the same change.** Any change to structure, data, or behaviour updates the
  relevant file in `docs/architecture.md` or `docs/domains/`.
- **Product decisions → an ADR.** If you make or change a *product* decision (what the system does,
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

## Deferred (do not build until their dedicated design session)
- Due-date computation, worker capacity, and the **dependency engine** (`available`/`blocked`
  tasks). The model only *reserves room* for these. (architecture §8)

## Stack (fixed)
Next.js (App Router) + React 18 + TypeScript · Tailwind + shadcn/ui · Supabase (Postgres + Auth +
Storage + RLS) · TanStack Query · next-intl. See `docs/architecture.md` §1.

## Wireframes
`docs/wireframes/intake-to-board.html` — a static, no-build mockup of the three core flows (admin
config → intake → production board). Open directly in a browser.

## Cursor Cloud specific instructions
- The app is not scaffolded yet; there are no build/test/lint/run commands until it is. Do not
  search for `package.json`/`src/` — they are intentionally absent during the design phase.
- When scaffolding begins, this section should record the real dev commands (install, dev server,
  test, lint) and any non-obvious startup caveats (e.g. required Supabase env vars
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, local `supabase start`).
