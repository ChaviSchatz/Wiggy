# WigFlow — Design System (build-ready lock)

> Concrete tokens, components, page archetypes, and interaction patterns so screens are **composed
> from known parts, not re-designed**. Hebrew-first / RTL. Implements the intent in
> `docs/ui/design-language.md`. Per-screen composition lives in `docs/ui/screen-designs.md`.
>
> These values are the contract. They are not "tunable in build" — earlier drafts said that, and the
> result was three screens inventing colours that did not exist. Change a value here, in one place,
> and every surface follows.

## 0. How tokens are named

Every token is defined once as a CSS custom property in `src/app/globals.css` and exposed to
Tailwind in `tailwind.config.ts`. Nothing in a component or a page may hardcode a colour, a radius,
or a shadow.

Two naming notes, so the table below is not surprising:

- **The brand family is called `mauve-*` in code but its values are plum.** The name is historical.
  Renaming it would touch ~40 call sites for zero user-visible gain, so the name stays and the
  values move. Read `mauve` as "brand".
- **Prefer the semantic alias where one exists.** `primary`, `ring`, `border`, `card`, `background`,
  and `foreground` are consumed by the shadcn/ui primitives and are the correct thing to reference
  from a component. Reach for a raw family token only when no semantic alias covers the case.

## 1. Colour

### Surfaces, text, and lines

| Class          | Value     | Role                                                                   |
| -------------- | --------- | ---------------------------------------------------------------------- |
| `bg`           | `#FCFBFC` | app background — faintly plum-tinted near-white                        |
| `surface`      | `#FFFFFF` | cards, panels, table and top-bar surfaces                              |
| `surface-soft` | `#FDFBFD` | board columns and nested panels, to sit _under_ `surface`              |
| `cream`        | `#FFFDF9` | helper / tip / explanatory surfaces only                               |
| `ink`          | `#351F33` | primary text                                                           |
| `muted`        | `#7D6E7B` | secondary text and all metadata — 4.6:1 on `bg`                        |
| `faint`        | `#9B8F99` | **non-text only** — icons, dividers, decorative marks, disabled states |
| `line`         | `#EBE5EB` | default borders and dividers                                           |
| `line-strong`  | `#DFD4DF` | borders on interactive controls that need to read as editable          |
| `hairline`     | `#C7A8C3` | the 2px plum-tinted accent tick on panel and column headers            |

`faint` measures **3.0:1** on `bg`, which satisfies AA for non-text and large text but **fails for
body copy**. Metadata at 12px uses `muted`, not `faint`. This is the one token in the system with a
usage restriction, and it exists because the reference comps use a third grey at sizes where it is
not legible.

### Brand

| Class       | Value     | Role                                                                          |
| ----------- | --------- | ----------------------------------------------------------------------------- |
| `mauve-600` | `#672B62` | **primary** — brand, primary buttons, active nav, focus ring. 10.0:1 on white |
| `mauve-700` | `#572252` | primary hover / pressed                                                       |
| `mauve-900` | `#482044` | deepest brand tone, headings on plum-tinted grounds                           |
| `mauve-200` | `#EAD9E8` | soft border — the outline of a soft/tinted button                             |
| `mauve-100` | `#F4EAF3` | soft fill — tinted button ground, hover row, soft chip                        |

Soft fills are **flat tokens, not opacity modifiers**. `bg-mauve-100` is correct;
`bg-mauve-100/30` is not, because it makes the rendered colour depend on whatever is behind it.

### Side navigation (dark surface)

The side nav is the one inverted surface in the product, so it carries its own set.

| Class            | Value                   | Role                           |
| ---------------- | ----------------------- | ------------------------------ |
| `sidebar`        | `#5B2557`               | side-nav ground                |
| `sidebar-fg`     | `rgba(255,255,255,.90)` | nav item label                 |
| `sidebar-fg-dim` | `rgba(255,255,255,.68)` | brand subtitle, user role line |
| `sidebar-hover`  | `rgba(255,255,255,.08)` | nav item hover                 |
| `sidebar-active` | `rgba(255,255,255,.14)` | nav item active                |
| `sidebar-line`   | `rgba(255,255,255,.12)` | brand divider, footer divider  |
| `sidebar-mark`   | `#EAD9E8`               | brand mark stroke              |

### Status colours

Each status is a **triplet**: a soft background, a deepened foreground for text, and a mid-tone for
dots, borders, and icons. The mid-tone is the hue as drawn in the reference kit; the foreground is
that hue deepened until it passes AA against its own soft background.

| Family   | `-100` background | `-600` foreground (text) | `-500` mid (dot/border) | Contrast | Means                                        |
| -------- | ----------------- | ------------------------ | ----------------------- | -------- | -------------------------------------------- |
| `sage`   | `#EAF5EE`         | `#3A7852`                | `#4D936B`               | 4.7:1    | done, on time, positive                      |
| `peach`  | `#FFF1DF`         | `#99611F`                | `#C17D31`               | 4.6:1    | attention, awaiting approval, pending        |
| `danger` | `#FBE9E9`         | `#B34545`                | `#CA6060`               | 4.7:1    | urgent, late, blocking, destructive          |
| `info`   | `#EDF2F8`         | `#526E96`                | `#6481AA`               | 4.6:1    | in progress, informational                   |
| `mauve`  | `#F4EAF3`         | `#672B62`                | `#672B62`               | 8.5:1    | brand-flavoured state, approval queue        |
| `idle`   | `#F2EFF2`         | `#736874`                | `#7B707A`               | 4.7:1    | inactive, skipped, cancelled, not applicable |

Border steps also exist where a status surface needs an outline: `sage-200 #C9E3D4`,
`peach-200 #F5E2C9`, `danger-200 #F2DADA`, `info-200 #D8E3F0`, `mauve-200 #EAD9E8`,
`idle-200 #E4DFE4`. `sage-300 #A9CFBB` exists for the completed segment of a progress connector.

**Do not use a `-500` mid-tone for text.** Every mid-tone fails AA at body size against its own soft
background — that is precisely why the `-600` steps exist.

## 2. Typography

Two families, loaded via `next/font`:

| Class          | Family | Used for                                                   |
| -------------- | ------ | ---------------------------------------------------------- |
| `font-display` | Rubik  | page titles, section headings, KPI numbers, wordmark       |
| `font-sans`    | Heebo  | everything else — body, labels, metadata, controls, tables |

| Step            | Size / weight / tracking | Family  | Used for                               |
| --------------- | ------------------------ | ------- | -------------------------------------- |
| `text-page`     | 30px / 800 / `-0.035em`  | display | page title (`h1`)                      |
| `text-section`  | 20px / 700 / normal      | display | section heading (`h2`)                 |
| `text-metric`   | 26px / 800 / `-0.02em`   | display | KPI value                              |
| `text-identity` | 15px / 700               | sans    | card title, row identity               |
| `text-body-lg`  | 16px / 400               | sans    | long-form body, dialog prose           |
| `text-body`     | 14px / 400               | sans    | default body, table cell, control text |
| `text-label`    | 13px / 600               | sans    | form label, column header              |
| `text-meta`     | 12px / 400               | sans    | metadata, chip text, timestamps        |

**12px is the floor.** Nothing renders smaller, including chips and helper text. The reference comps
go to 8.5px; that is artboard density and it is not reproducible on a salon tablet.

Each step carries its own weight and tracking, so a heading cannot be half-applied — `text-page`
already _is_ 800 weight with tight tracking. The identity step is named `text-identity` rather than
`text-card` because `card` is a colour token and `text-card` therefore already means a text colour.

`tabular-nums` on every numeral that sits in a column or gets compared: order codes, dates, counts,
durations. `text-balance` on headings, `text-pretty` on paragraphs. Never adjust tracking outside
the display steps above.

## 3. Spacing, shape, depth, motion

- **Spacing scale:** `4 · 8 · 12 · 16 · 24 · 32 · 48`. Page gutter 24px desktop, 12px below `lg`.
- **Radius:** `xs 9` chips-adjacent and small controls · `sm 12` cards and board columns ·
  `md 16` panels, sheets, dialogs · `lg 20` large containers · `full` chips and avatars only.
  Existing aliases map on: `control → xs`, `card → sm`.
- **Border width** is 1px everywhere. A 2px border means exactly one thing: _this is the selected or
  focused item_.
- **Shadow — two steps, and one of them is nothing.**
  - Resting surfaces: **no shadow.** A hairline `line` border on `bg` is what separates them.
  - Floating surfaces (dialog, drawer, toast, popover): `0 16px 34px rgba(69,35,66,.11)`.
  - A card that responds to hover changes its border to `line-strong` and translates `-1px`. It does
    not grow a shadow.
- **Motion:** 150–200ms `ease-out`, `transform` and `opacity` only. Never animate width, height, or
  spacing. Respect `prefers-reduced-motion`. No animation is added unless the interaction needs it.
- **Icons:** lucide, 1.5px stroke, `size-5` default and `size-4` inside controls. Icon-only buttons
  always carry an `aria-label`.
- **Density:** comfortable by default; compact for tables and board columns.
- **Touch targets:** ≥44px on any worker-facing or tablet surface.

### Fixed dimensions

| Element                                        | Value                      |
| ---------------------------------------------- | -------------------------- |
| Side nav width                                 | 228px                      |
| Side nav item height                           | 47px                       |
| Top bar height                                 | 69px                       |
| Bottom nav height                              | 64px + safe-area inset     |
| Primary button height                          | 41px                       |
| Default control height (button, input, select) | 39px                       |
| Board column width                             | 280px (floor 260px)        |
| Drawer / peek width                            | `min(430px, 100vw - 28px)` |

### z-index scale

Fixed and exhaustive. No arbitrary `z-[…]`.

| Layer                                        | Value |
| -------------------------------------------- | ----- |
| `z-nav` side navigation                      | 20    |
| `z-header` top bar                           | 30    |
| `z-bottom` mobile bottom nav                 | 40    |
| `z-overlay` dialog, drawer, and their scrims | 50    |
| `z-toast` toasts and undo                    | 60    |

## 4. Component inventory

Built on shadcn/ui. **Reuse before creating.** A new component needs a reason the existing set
cannot express — repetition alone is not one.

### Chrome

- **AppShell** — full-height side nav beside a main column; the top bar spans the main column only,
  not the whole viewport. The brand lives in the side nav.
- **SideNav** — dark plum, 228px, role-filtered, `≥lg` only. Brand and subtitle at the top over a
  divider; current user at the bottom over a divider. Active item is `sidebar-active` ground; there
  is no coloured left/right bar and no bold weight change.
- **TopBar** — white, 69px, hairline bottom border, spanning the **main column only**. Carries
  actions: primary `+ New Order` for permitted roles, feedback, profile, sign out. Identity is _not_
  repeated here — the brand and the current user live in the side nav on desktop, and below `lg`
  (where the side nav is hidden) the wordmark reappears in this bar. **No global search** — that is a
  deferred screen and its absence is deliberate.
- **BottomNav** — `<lg` only, role-filtered, ≥44px targets, respects `safe-area-inset-bottom`.
  Active item is a soft `mauve-100` ground with `mauve-600` label.
- **PageHeader** — `h1` at `text-page` plus optional subtitle at `text-meta`, and an optional
  actions slot on the inline-end. **Every** page title goes through this, including the sprint board
  and the work-order hub. There is no second way to render a page title.
- **BackLink** — leading chevron that flips with writing direction, label at `text-body`.

### Primitives

- **Button** — `primary` (plum, 41px), `outline`, `ghost`, `soft` (`mauve-100` ground,
  `mauve-200` border, `mauve-600` label), `danger-soft` (tinted, for a destructive trigger sitting
  in context), `danger` (solid, for the confirming button inside a destructive dialog), `link`.
  Sizes `sm 35` · `default 39` · `primary 41` · `lg 44` · `icon 39`.
- **IconButton** — 36px, transparent, plum icon, `mauve-100` hover ground. `aria-label` required.
- **StatusChip** — the single place domain vocabulary maps to colour. Takes a domain status (task
  status, order status, missing-item status, availability, urgency) and resolves the family. Renders
  at `text-meta`, `radius-full`, `-100` ground with `-600` label. Callers pass meaning, never
  colour. `Badge` remains the presentational primitive underneath.
- **Avatar** — circular worker avatar, monogram fallback with a deterministic calm colour, thin
  light ring so it reads on both white and the dark side nav. Sizes `sm 28` · `md 34` · `lg 44`.
  Never used for a client.
- **WorkImage** — squared reference/work thumbnail, `radius-xs`, `object-cover`, rendered **only
  when an image exists**. No placeholder, no reserved slot. Structurally distinct from `Avatar` so
  the two can never be confused.
- **Card** — `surface`, `line` border, `radius-sm`, no shadow.
- **Panel** — `surface`, `line` border, `radius-md`, optional `hairline` tick at the leading edge of
  its header. The section container.
- **Input · Textarea · Select · Combobox · DatePicker · Checkbox · RadioGroup · Toggle** — 39px,
  `radius-xs`, `line-strong` border, `mauve-600` focus ring at 3px `mauve-100`. `Select` is a real
  primitive; native `<select>` with a copy-pasted class string is not acceptable.
- **FormField** — label + control + description + error as one unit, so validation copy always
  lands in the same place relative to its input.
- **FormMessage** — inline validation, `danger-600`, adjacent to the field that failed.

### Data

- **DataTable** — flat and dense. `surface-soft` header at `text-label` in `muted`, 1px `line` row
  separators, `surface` hover tint, `text-start` alignment throughout. No per-row card, no vertical
  rules.
- **FilterBar** — one shared search + filter row for every list and board. Filters are underline
  tabs, not pills: inactive is `muted`, active is `mauve-600` with a 2px `mauve-600` underline.
- **Pagination · EmptyState · Skeleton** — an `EmptyState` always offers one clear next action;
  loading is a structural skeleton that matches the shape of what is arriving, never a spinner.

### Overlays

- **Dialog** — `radius-md`, floating shadow, scrim `rgba(45,24,43,.30)`. Focused forms and confirms.
- **AlertDialog** — destructive and irreversible actions only. Solid `danger` confirm button.
- **Drawer / Sheet (peek)** — inline-start edge, inset 14px, `radius-md`, floating shadow.
  Dismissible by scrim tap and `Esc`.
- **Popover · Tooltip**
- **UndoToast** — bottom inline-start, `z-toast`, short window, one action.

### Domain

- **WorkCard** — the single task card, shared by the production board, sprint planning, and My Work
  through variants rather than through three parallel implementations. Composition is specified in
  `screen-designs.md`.
- **KanbanColumn** — `line` border, `radius-sm`, header with title, optional subtitle, count, and
  `hairline` tick. Each column takes a faint background tint from a small **system-curated** set
  (`stage-tint-1`…`5`, `globals.css`), cycled by column position. **Never `work_stages.color`** — a
  tenant-entered hex carries no contrast guarantee and would sit outside the controlled palette;
  the curated set gets the same "columns read as distinct at a glance" result without that risk.
  Stage identity still comes primarily from the header text and the tick, not from the tint alone.
- **QueueList + QueueItem** — the sectioned personal queue.
- **Stepper** — order progress. Completed nodes `sage-600`, current `mauve-600`, upcoming `line-strong`
  outline; connector `sage-300` behind completed segments and `line` ahead of them.
- **KpiCard** — `text-metric` value in display, label at `text-label`, caption at `text-meta`. The
  single most important metric on a dashboard may take a 2px `mauve-600/34%` border and a small
  plum-soft eyebrow label; at most one per view.
- **AssigneePicker · FileUpload · AudioPlayer · PrimaryActionBar**

## 5. Page archetypes

Every screen maps to one. `screen-designs.md` says which.

| Archetype              | Structure                                                     |
| ---------------------- | ------------------------------------------------------------- |
| **A. List / index**    | PageHeader + FilterBar + DataTable + row actions + Pagination |
| **B. Detail / hub**    | PageHeader + Stepper + Panel sections + PrimaryActionBar      |
| **C. Wizard**          | PageHeader + Stepper + step Panel + footer nav                |
| **D. Board / kanban**  | PageHeader + FilterBar + KanbanColumn row of WorkCards        |
| **E. Queue (tablet)**  | PageHeader + sectioned QueueList with large targets           |
| **F. Dashboard**       | PageHeader + KpiCard grid + attention Panels                  |
| **G. Settings / CRUD** | PageHeader + list + inline or side editor                     |
| **H. Drawer / peek**   | identity + progress + reference thumbs + quick actions        |
| **I. Auth**            | centred card on `bg`                                          |
| **Dialog**             | focused form or confirm                                       |

## 6. Interaction patterns

- **Overlay rules:** quick glance or single action → **drawer/peek**; focused form or confirm →
  **dialog**; rich or deep-linkable content → **full page**. Everyday actions (Done/Start) are
  **inline**, never behind an overlay.
- **Task actions:** optimistic update plus **UndoToast**. Done = primary, Start = secondary.
- **Destructive actions:** `AlertDialog`, solid confirm button, and the copy names what will happen.
- **Lists:** debounced search, server pagination, sticky FilterBar, `EmptyState` never blank,
  `Skeleton` while loading.
- **Forms:** inline validation on blur and on submit, explicit Save/Cancel, wizard drafts autosave
  locally. Errors appear next to the control that produced them. Never block paste.
- **Navigation:** one click back to the board from any drill-down, via persistent nav plus an
  explicit `BackLink`.
- **RTL / i18n:** logical CSS only; all copy from `next-intl` (`he` default); tenant content stored
  as entered.
- **A11y:** visible focus states, full keyboard navigation, `aria-label` on icon-only controls,
  ≥44px touch targets on tablet, reduced-motion respected, WCAG AA contrast.
- **Identity / media:** worker = circular avatar; client = text; reference photos = squared and only
  when present; never a photo on a board card. See `design-language.md`.
