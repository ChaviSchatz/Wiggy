# 0005 — Multilingual-ready, Hebrew-first

**Status:** Accepted

## Context
The product is Hebrew-first and RTL. The original UI risked hardcoding Hebrew strings, which would
make adding languages painful later.

## Decision
Launch **Hebrew-first (RTL)** but build the product **multilingual-ready** from day one:
- All **app-shell** copy (buttons, labels, statuses, system messages) comes from i18n message
  catalogs — **no hardcoded UI strings**.
- Layout direction is handled with **logical CSS** so components flip cleanly between RTL and LTR.

## Why
- Retrofitting i18n after launch is expensive; doing it up front is cheap.
- Opens future markets/languages with only new message files, not code changes.

## Alternatives considered
- **Hardcode Hebrew now, internationalize later** — rejected; retrofitting is costly and
  error-prone.

## Consequences
- **Boundary:** i18n covers the app shell only. **Tenant-entered content** (e.g. a task type named
  `צבע`) is data, stored as entered, and is **not** auto-translated. Translating tenant content is
  a separate future feature.
- Mechanism (library, locale routing, logical properties) is documented in `docs/architecture.md`
  §9 (technical foundation).
