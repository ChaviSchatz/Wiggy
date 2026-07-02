# Wiggy / WigFlow

## Cursor Cloud specific instructions

### Current repository state (IMPORTANT)

This repository currently contains **no application source code**. The only tracked
content is:

- `README.md` — placeholder (`# Wiggy`).
- `context-files/Wiggy Summary Document - English Translation.md` — the product/feature
  specification (the substantive content).

There is **nothing to install, build, run, lint, or test yet**. There is no
`package.json`, no lockfile, no `Dockerfile`/`docker-compose`, no `supabase/` config,
and no `src/`. Do not waste time searching for these — they are genuinely absent.

Because of this, the environment "setup" is effectively a no-op today. The configured
update script guards on the presence of `package.json` so it stays safe until real code
lands.

### Intended stack (from the spec, not yet present in this repo)

Per `context-files/Wiggy Summary Document - English Translation.md`, WigFlow is a
Hebrew-first / RTL wig-production management web app intended to be built with:

- Frontend: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui + React Router,
  TanStack Query for data fetching.
- Backend: Supabase (Postgres + Auth (email/password) + Storage + RLS), with business
  logic in Postgres RPC functions (e.g. `start_work_order`, `task_transition`,
  `log_audit`).

When application code is added, expect the standard Vite flow (`npm install`,
`npm run dev`, `npm run build`, `npm run lint`) plus a Supabase instance
(cloud project or local `supabase start`) as the single mandatory external dependency
for end-to-end testing. End-to-end auth/data flows will require
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or equivalent) plus a seeded user,
since there is no open self-registration.
