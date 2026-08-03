# Wiggy — Design System (build-ready lock)

> Concrete tokens, components, page archetypes, and interaction patterns so screens are **composed
> from known parts, not re-designed**. Hebrew-first / RTL. Extends `docs/ui/design-language.md`.
> Exact hex/values are tunable in build without rework.

## 1. Tokens

### Color (warm operational studio)
| Token | Value | Use |
|---|---|---|
| `bg` | `#FAF7F5` | app background (warm white) |
| `surface` | `#FFFFFF` | cards/surfaces |
| `ink` | `#2E2A2E` | primary text |
| `muted` | `#7A727A` | secondary text |
| `line` | `#E9E2E7` | borders/dividers |
| `mauve-600` | `#7C5E7D` | **primary** (brand, primary buttons, active nav) |
| `mauve-100` | `#EFE7EF` | primary soft bg/hover |
| `sage-600` | `#5F8A73` | positive / done |
| `sage-100` | `#E6EFE9` | positive soft |
| `peach-500` | `#E0916B` | warm accent / attention |
| `peach-100` | `#F8E9DF` | accent soft |
| `danger-600` | `#C0553B` | destructive/urgent |
Contrast must meet WCAG AA; warmth comes from hue, not low contrast.

### Type — Heebo (primary), Rubik/Assistant fallback
Scale (px): `12` caption · `14` body · `16` body-lg · `20` h3 · `24` h2 · `30` h1. Weights `400/500/600/700`. Comfortable line-height for Hebrew; tabular numerals for codes/times.

### Spacing / radius / shadow / motion
- Spacing scale: `4 · 8 · 12 · 16 · 24 · 32 · 48`.
- Radius: `card 16` · `button/input 10` · `chip 999`.
- Shadow: `sm 0 1px 2px rgba(46,42,46,.06)` · `lg 0 8px 24px rgba(46,42,46,.08)`.
- Motion: 150–200ms ease; respect `prefers-reduced-motion`.
- Icons: **lucide**, 1.5px stroke. Density: **comfortable**; **compact** for tables/board.
- Touch targets: **≥44px** on tablet.

## 2. Component inventory (built on shadcn/ui)
- **Button** (primary/secondary/ghost/destructive) · **IconButton** · **UndoToast**
- **Card** · **Chip/Badge** (status, stage, priority, availability) · **StatusPill**
- **Avatar** (circular; worker; monogram fallback) · **ReferenceThumb** (squared image, only-when-present)
- **Form**: Input, Textarea, Select, Combobox, DatePicker, Checkbox, RadioGroup, Toggle, FieldError
- **Overlays**: Drawer/Sheet (peek), Dialog (confirm/forms), Popover, Tooltip, Toast
- **Nav**: TopBar, SideNav (desktop, RTL right), BottomBar (tablet), PageHeader, BackLink
- **Data**: DataList/Table, FilterBar, SearchBar, Pagination, EmptyState, Skeleton
- **Domain**: Stepper (order progress), KanbanColumn + TaskCard, QueueList + QueueItem, KpiCard, FileUpload, AudioPlayer, AssigneePicker, PrimaryActionBar

## 3. Page archetypes (every screen maps to one)
| Archetype | Structure | Screens |
|---|---|---|
| **A. List/Index** | PageHeader + FilterBar/Search + DataList/Table + row actions | customers, work orders, missing items, task types/groups, intake templates, staff, users, feedback |
| **B. Detail/Hub** | header + progress + sections + PrimaryActionBar | work-order hub |
| **C. Wizard** | Stepper + step body + footer nav | New Order |
| **D. Board/Kanban** | FilterBar + columns + cards | production board, sprint planning |
| **E. Queue (tablet)** | station switcher + sectioned big-target list | My Work |
| **F. Dashboard** | KpiCard grid + widget lists | home (role-tailored) |
| **G. Settings/CRUD** | list + inline/side editor or form | all `[config]` editors, branding, business settings |
| **H. Drawer/Peek** | compact overlay: identity + progress + reference thumbs + quick actions | work-order quick view |
| **I. Auth** | centered card | login, reset, bootstrap |
| **Dialog** | focused form/confirm | add/"Other" task, reassign, defer, approve/return, cancel, upload, create sprint |

## 4. Interaction patterns (conventions, apply everywhere)
- **Overlay rules:** quick glance/single action → **Drawer/peek**; focused form/confirm → **Dialog**; rich/deep-linkable content → **full page**. Everyday actions (Done/Start) are **inline**, no overlay.
- **Task actions:** optimistic update + **UndoToast** (short window). Done = primary, Start = secondary.
- **Destructive actions** (cancel order, delete): confirm Dialog.
- **Lists:** debounced search, server pagination, sticky FilterBar; **EmptyState** (never blank) + **Skeleton** while loading.
- **Forms:** inline validation on blur + submit; explicit Save/Cancel; wizard drafts autosave locally.
- **Navigation:** one-click back to board (SideNav/BottomBar + explicit BackLink); minimize clicks.
- **RTL/i18n:** logical CSS only; all copy from `next-intl` catalogs (he default); tenant content stored as entered.
- **A11y:** focus states, keyboard nav, aria labels, 44px touch targets, reduced-motion.
- **Identity/media:** worker = circular avatar (monogram fallback); client = text; reference photos = squared, only when present (`design-language.md`).
