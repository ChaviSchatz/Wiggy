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

| Command                | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the development server      |
| `npm run build`        | Create a production build         |
| `npm run start`        | Serve the production build        |
| `npm run lint`         | Run ESLint                        |
| `npm run test`         | Run the test suite once (Vitest)  |
| `npm run test:watch`   | Run tests in watch mode           |
| `npm run format`       | Format the codebase with Prettier |
| `npm run format:check` | Check formatting without writing  |

## Environment variables

Copy `.env.example` to `.env.local` and provide values:

| Variable                        | Description                     |
| ------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (public)   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |

These are read by the browser client factory in `src/lib/supabase/client.ts`.

## Project structure

- `src/app` — App Router routes (dashboard `/` plus placeholder pages).
- `src/components/layout` — app shell (top bar, side nav, bottom nav, page header).
- `src/components/ui` — shadcn/ui primitives.
- `src/i18n` — next-intl request config (single locale `he`).
- `messages/he.json` — Hebrew message catalog (all UI strings live here).
- `context-files/` — product context and background docs.
