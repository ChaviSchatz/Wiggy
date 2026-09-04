# Screen alignment — design match to docs/ui

## Goal

Bring every real, already-built screen in the app into full alignment with the product's own
design spec (`docs/ui/design-language.md` intent, `docs/ui/design-system.md` token/component
values, `docs/ui/screen-designs.md` per-screen composition), using the real component library
(`src/components/ui`, `src/components/domain`, `src/components/chrome`, etc.) — the same library
mirrored into `docs/design/` for the claude.ai/design sync. Where a screen has no explicit
spec, extrapolate consistently in the same style rather than leaving it ad hoc.

Out of scope: the claude.ai/design project (already synced separately); new product behavior:
we only close visual/compositional gaps, never change what a screen does (product behavior wins
over visual design per `screen-designs.md`'s own stated precedence).

## Scope: 16 pages + ~30 dialogs, batched by inventory section

1. **Auth & profile** — login, forgot-password, reset-password, bootstrap, profile
2. **Home** — dashboard (`src/app/(app)/page.tsx`)
3. **Customers** — list, detail, create/edit dialog, delete dialog
4. **Orders & hub** — list, filters, order hub (+ progress-stepper, notes/history/task/
   attachments/warnings sections, task-dialogs, edit-intake-dialog)
5. **New-order wizard** — the 4 wizard steps
6. **Board, Sprint, My Work, Approvals** — production board (+ task-peek-sheet,
   assignee-picker-dialog), sprint (+ its components), my-work, approvals
7. **Settings** — hub, business, staff (+ form dialog), templates (+ form dialog) — most
   recently built section; expect fewer fixes here, but still audited.

## Method (per screen)

1. Read the screen's entry in `screen-designs.md` (archetype + composition + any screen-specific
   rule), plus the relevant parts of `design-language.md` and `design-system.md`.
2. Read the current implementation.
3. Fix deviations: wrong/missing components, ad-hoc markup instead of the real library, wrong
   tokens (color/spacing/radius/shadow), RTL/logical-CSS violations, identity/media rules
   (customer-name-leads, circular worker avatars vs. text-only client identity, squared reference
   photos), action hierarchy (one plum accent per view, Done > Start).
4. Visually verify: run the app locally against seeded data and view the screen (and its
   dialogs/states) before moving on.

## Execution: solo calibration, then fan out

- **Calibration (done by me directly):** Login (`Archetype I — Auth`, simplest), Customers list
  (`Archetype A — list/table`, reused by Orders and Missing-items), Order hub (most complex
  composite page). Surfaces systemic issues before any batch runs.
- **Fan-out:** remaining batches (2, 4, 5, 6, 7 minus what calibration already covered) each run
  as an Agent tool subagent doing the same audit → fix → visually verify loop, seeded with
  calibration learnings. I review each batch's diff before it's considered done.

## Verification environment

- Supabase local (already running) + `npm run seed:dev && npm run seed:demo && npm run seed:screens`
  for full screen/state coverage (empty states, all filters, all pagination, etc.).
- `npm run dev`, view each screen (and reachable states/dialogs) in a browser.
- `npm run lint` and `npm run test` after each batch as a regression gate — this work changes
  markup/styling, not behavior, so existing tests should keep passing.

## Git strategy

- Branch: `design/screen-alignment` off up-to-date `main` (created; `feat/intake-template-editor`
  already pushed separately).
- Commit granularity: one commit per top-level screen (including the dialogs that belong to it).

## Definition of done

A screen is done when: it uses the real component library (no ad-hoc replacements for something
that already exists as a component), its composition matches its `screen-designs.md` entry,
its tokens/spacing/RTL match `design-system.md`/`design-language.md`, it's been viewed in the
browser against seeded data, and `lint`/`test` stay green.
