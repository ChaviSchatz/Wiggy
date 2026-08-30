# Wiggy

A Hebrew-first (RTL) production-management web app for a wig salon.

This repository is a single-monolith Next.js app. **Slice 0** scaffolded the
frontend (theme, i18n/RTL, app-shell navigation, tooling). **Slice 1** added
the Supabase data foundation (multi-tenant schema + RLS, roles module) and
the auth flows on top of it: login, forgot/reset password, first-login
bootstrap, sign-out, and a profile screen — all behind `src/middleware.ts`,
which also gates every screen by role (`src/lib/roles.ts`).

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [next-intl](https://next-intl-docs.vercel.app) — default locale `he`, `dir="rtl"`
- [lucide-react](https://lucide.dev) icons, [Heebo](https://fonts.google.com/specimen/Heebo) font
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) (jsdom)
- ESLint + Prettier. Package manager: **npm**.

## Getting started

```bash
npm install          # install dependencies
cp .env.example .env.local   # then fill in the Supabase values
npx supabase start   # start local Supabase (see "Local Supabase" below)
npx supabase db reset # apply migrations + seed
npm run gen:types     # regenerate database.types.ts
npm run seed:dev      # seed a dev business + admin user
npm run dev          # start the dev server at http://localhost:3000
```

The app now requires a session for every screen (`src/middleware.ts`), so
visiting `http://localhost:3000` redirects to `/login` — sign in with the
dev seed credentials below.

## Scripts

| Command                    | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| `npm run dev`              | Start the development server                                      |
| `npm run build`            | Create a production build                                         |
| `npm run start`            | Serve the production build                                        |
| `npm run lint`             | Run ESLint                                                        |
| `npm run test`             | Run unit tests once (Vitest, jsdom; no Supabase)                  |
| `npm run test:watch`       | Run unit tests in watch mode                                      |
| `npm run test:integration` | Run RLS integration tests against local Supabase                  |
| `npm run gen:types`        | Regenerate `src/lib/supabase/database.types.ts` from the local DB |
| `npm run seed:dev`         | Seed a dev business + admin user (idempotent)                     |
| `npm run seed:demo`        | Add demo customers/orders/tasks on top of the dev seed (local)     |
| `npm run seed:screens`     | Add screen-coverage data on top of the demo seed (local)          |
| `npm run format`           | Format the codebase with Prettier                                 |
| `npm run format:check`     | Check formatting without writing                                  |

## Environment variables

Copy `.env.example` to `.env.local` and provide values:

| Variable                        | Description                                                                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (public)                                                                                                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public)                                                                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service-role key (server-only; secret)                                                                                                                         |
| `NEXT_PUBLIC_SITE_URL`          | Optional. Origin used to build password-reset email links (`src/lib/auth/actions.ts`). Falls back to the request's `Host` header, which is fine for local dev. |

The public vars are read by the browser client factory in
`src/lib/supabase/client.ts`. The service-role key is read only by the
server-only admin client in `src/lib/supabase/admin.ts` (seeding, bootstrap,
integration tests) and must never be exposed to the browser.

## Local Supabase & data layer

The data foundation (multi-tenant schema + RLS) lives in `supabase/migrations`.
With the Supabase CLI and Docker running:

```bash
npx supabase start        # start local Supabase (Postgres, Auth, Studio)
npx supabase db reset     # apply migrations + seed from scratch
npm run gen:types         # regenerate TypeScript types from the schema
npm run seed:dev          # seed a dev tenant + admin (see credentials below)
```

### Dev seed (local only)

`npm run seed:dev` creates one business, one admin user, an admin
membership, and the Slice 2 work-definition catalog for that business (8
work stages, 3 staff members, 8 task types across 2 task groups, and one
"New Wig" intake template with 9 items, two of which are the "no top / no skin"
missing-stock flags — see `scripts/seed-work-definition.ts`).
It is idempotent (safe to re-run). Dev-only credentials:

- **Email:** `admin@wiggy.local`
- **Password:** `wiggy-dev-password`

These credentials are for local development only. Never use them anywhere real.

`npm run seed:demo` then fills that business with browsable demo data
(customers, work orders at several statuses, tasks across the board, a sprint,
missing items) so the board, queue and dashboard aren't empty. Also idempotent.

`npm run seed:screens` layers on **screen-coverage** data for manual QA. The
demo seed tells one small story, which leaves much of the UI with nothing to
render: 5 of the 7 order-status filters, the board's "deferred" and "returned
for rework" tabs, 3 of the 4 missing-item statuses, every attachment/comment
section in the order hub, and all three list paginations (page size 20). This
seed covers all of them, plus edge cases the layout can break on (a customer
with no contact details or orders, a very long Hebrew name) and a closed sprint
still holding unfinished work. Everything it creates is prefixed "בדיקה" and
tagged `[qa]` in `notes`, so it is easy to spot and never mixes with the demo
story. Idempotent; `npm run seed:screens -- --reset` removes just its own rows
and reseeds them.

## Auth flows

- `src/middleware.ts` — session + role guard for every request: signs out →
  `/login`; signed in but first login (no `profiles.full_name` yet) →
  `/bootstrap`; keeps a signed-in user off `/login`/`/forgot-password`.
- Screens: `/login`, `/forgot-password`, `/reset-password`, `/bootstrap`
  (route group `src/app/(auth)`, centered-card layout, no app shell) and
  `/profile` (route group `src/app/(app)`, inside the normal app shell).
- `src/lib/auth/actions.ts` — the Server Actions behind those screens
  (sign in/out, request/complete password reset, bootstrap, edit
  profile/password). `src/lib/auth/current-user.ts` resolves the signed-in
  user's profile + active membership + role; framework-agnostic (takes any
  Supabase client), covered by `tests/integration/current-user.integration.test.ts`.
- Password reset uses Supabase's default recovery-link flow (session
  established client-side from the emailed link before `updatePasswordAction`
  runs); local dev emails land in Mailpit at `http://127.0.0.1:54324`.
- Side-nav visibility is role-gated (`src/components/layout/nav-items.ts` +
  `src/lib/roles.ts`), matching `docs/ui/information-architecture.md`.

## Project structure

- `src/app/(app)` — authenticated routes, wrapped in the app shell (dashboard
  `/`, board, orders, customers, sprint, missing-items, settings, profile).
- `src/app/(auth)` — unauthenticated/auth-transition routes (login,
  forgot/reset password, bootstrap), centered-card layout only.
- `src/middleware.ts` — auth/role route guard (see "Auth flows" above).
- `src/lib/auth` — auth domain logic + Server Actions.
- `src/lib/supabase` — Supabase client factories: browser (`client.ts`),
  server/Server Actions (`server.ts`), middleware (`middleware.ts`),
  service-role admin (`admin.ts`).
- `src/components/layout` — app shell (top bar, side nav, bottom nav, page header).
- `src/components/auth` — shared auth-screen UI (centered card).
- `src/components/ui` — shadcn/ui primitives.
- `src/i18n` — next-intl request config (single locale `he`).
- `messages/he.json` — Hebrew message catalog (all UI strings live here).
- `context-files/` — product context and background docs.
