# Wiggy

A Hebrew-first (RTL) production-management web app for a wig salon.

This repository is a single-monolith Next.js app. **Slice 0** contains the
frontend scaffold only: theme, i18n/RTL, the app-shell navigation, and tooling.
No database/auth/Supabase server work is wired up yet (only an env example and a
thin browser-client stub).

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
npm run dev          # start the dev server at http://localhost:3000
```

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
| `npm run format`           | Format the codebase with Prettier                                 |
| `npm run format:check`     | Check formatting without writing                                  |

## Environment variables

Copy `.env.example` to `.env.local` and provide values:

| Variable                        | Description                            |
| ------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (public)          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public)        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service-role key (server-only; secret) |

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

`npm run seed:dev` creates one business, one admin user, and an admin
membership. It is idempotent (safe to re-run). Dev-only credentials:

- **Email:** `admin@wiggy.local`
- **Password:** `wiggy-dev-password`

These credentials are for local development only. Never use them anywhere real.

## Project structure

- `src/app` — App Router routes (dashboard `/` plus placeholder pages).
- `src/components/layout` — app shell (top bar, side nav, bottom nav, page header).
- `src/components/ui` — shadcn/ui primitives.
- `src/i18n` — next-intl request config (single locale `he`).
- `messages/he.json` — Hebrew message catalog (all UI strings live here).
- `context-files/` — product context and background docs.
