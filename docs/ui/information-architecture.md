# WigFlow — Information Architecture & Device Strategy (v1)

> How the v1 screens (`docs/ui/screen-inventory.md`) hang together: device strategy, navigation,
> role visibility, and per-role landing pages. Hebrew-first / RTL.

## Device strategy (v1)
- **One responsive web app** — no native app in v1.
- **Office roles (manager, secretary, admin): desktop-first.** Data-dense planning, config, intake.
- **Production workers: shared station tablets.** Kiosk-style, big touch targets, quick "who's at
  this station" switching. (Not personal accounts on personal devices in v1.)
- **Phone interface: future** — for remote workers; deferred (see `docs/roadmap.md`).

## Navigation shells
- **Desktop (office):** persistent **right-hand side nav** (RTL), role-filtered, + top bar
  (business branding, **+ New Order** CTA for office roles, feedback, profile; global search later).
- **Tablet (workers):** **bottom bar** navigation focused on *My Work* and *Board*, large touch
  targets, minimal chrome, plus a "who's at this station" switcher in the top bar.

## Navigation sections × role visibility

| Nav section | Screens | Worker | Secretary | Manager | Admin |
|---|---|---|---|---|---|
| Home / Dashboard | 7 | ✓ | ✓ | ✓ | ✓ |
| My Work (personal queue) | 41 | ✓ | ✓* | ✓ | – |
| Production Board | 32–38 | ✓ | view | ✓ | ✓ |
| Sprint Planning | 39–40, 43 | – | – | ✓ | ✓ |
| Approvals | 42, 36 | – | – | ✓ | ✓ |
| Work Orders (+New Order) | 15–28 | – | ✓ | ✓ | ✓ |
| Customers | 9–12 | – | ✓ | ✓ | ✓ |
| Missing Items | 29–31 | – | ✓ | ✓ | ✓ |
| Settings / Admin | 44–57 | – | – | ✓ (ops) | ✓ (all) |
| Feedback + Profile | 58, 5 | ✓ | ✓ | ✓ | ✓ |

\* Secretary sees "My Work" only if assigned tasks; otherwise hidden.

## Landing page per role (on login)
- **Worker →** **My Work** (their queue: now → next → up next → blocked → done). The primary
  "what do I do now" screen; on a shared tablet, gated by the station's active-worker switcher.
- **Manager (Fradi) →** **Dashboard** command center, one tap into Sprint Planning and Approvals.
- **Secretary →** **Work Orders** list with a prominent **+ New Order** CTA.
- **Admin →** **Dashboard** + full Settings access.

**Home is role-tailored, not one shared screen.** Every role can open it (table above), so its
content follows the role: office roles (manager/admin/secretary) see order + sprint KPIs and
attention widgets (unhandled missing items, approvals awaiting them, orders due soon, each gated
on the permission behind it); workers see a snapshot of their own queue with a link into My Work.

## Global elements
- **+ New Order** CTA (office roles), **Feedback** (all), **Profile/account** (all).
- Deferred: notifications center, global search.

## Navigation principles (least-clicks)
- **One-click return to the production board** from any drill-down: the full-page work-order hub has
  an explicit **"← back to production board"**, the persistent nav (Board) always returns in one
  click, and the quick-view peek is dismissible (tap-away / Esc).
- Optimize every flow for **minimal clicks** and obvious back paths — the users span all levels of
  technical comfort. Common actions (Done/Start) are reachable **inline** without opening a screen.

## Wireframes
- `docs/wireframes/app-shell-and-landings.html` — desktop Manager Dashboard (right side nav) +
  Worker My Work (tablet, bottom bar).
- `docs/wireframes/sprint-and-queue.html`, `docs/wireframes/intake-to-board.html` — earlier flows.

> These wireframes fix **structure and behaviour**, not styling. Visual design is no longer "refined
> during build": spacing, type, colour, and components are fixed in `docs/ui/design-system.md`, and
> per-screen composition in `docs/ui/screen-designs.md`. Where a wireframe and those files disagree on
> appearance, the design files win; where they disagree on structure or navigation, this file wins.
