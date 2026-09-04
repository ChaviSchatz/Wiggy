# Wiggy Component Inventory

Every shared component in the system: what it is for, its variants, where it is used, and whether
it needs work. Source lives in `components/<group>/<Name>.jsx`, with `.d.ts` for props and
`.prompt.md` for usage guidance. Visual rules are in `WIGGY_DESIGN_SYSTEM.md`.

**Status key** — *approved*: matches the approved screens, use as-is. *existing*: in the system and
sound, not yet exercised by an approved screen. *needs refactor*: works, but has a known gap.

---

## Chrome

| Component | Purpose | Variants | Used in | Status |
| --- | --- | --- | --- | --- |
| `AppShell` | Side nav beside a main column; top bar spans the main column | — | All app screens | approved |
| `SideNav` | Primary navigation on the one inverted surface | active / hover / with count | All app screens | approved |
| `TopBar` | Transient tools and user identity, 60px | with/without wordmark, with/without user | All app screens | approved |
| `PageHeader` | The one way a page states where you are | `default` / `compact` (26px/600 management + record header); `titleMeta` inline beside the title; with subtitle / actions / back link | All app screens | approved |
| `BackLink` | Return to a parent list from a detail view | — | Detail screens | existing |
| `BottomNav` | Mobile alternative to `SideNav`, 44px targets | — | Mobile breakpoint | existing |
| `Wordmark` | Product mark; the tenant-logo slot | `onDark`, sizes, optional subtitle | SideNav, TopBar, auth | approved |
| `WiggyMark` | Hairline stand-in glyph beside the wordmark | — | Wordmark | **placeholder — not the real mark** |

## Core

| Component | Purpose | Variants | Used in | Status |
| --- | --- | --- | --- | --- |
| `Button` | The only button implementation | `primary` / `outline` / `ghost` / `danger`; `xs`–`lg`; `iconStart` | Everywhere | approved |
| `IconButton` | Icon-only action, 32px, transparent until hover | size override | Chrome, cards, drawer | approved |
| `Card` | Base content surface: white, 1px line, radius-sm | `interactive` | Board, lists, dashboard | approved |
| `Panel` | Larger grouped surface for detail views | with/without title | Detail screens | existing |
| `SectionHeading` | Section title + the plum accent hairline, for detail surfaces that use hairline sections instead of `Panel` | default / `sm` (dialog form group); meta; actions | Customer profile, Create/Edit customer | existing |
| `StatusChip` | The one place domain vocabulary maps to colour | filled / `quiet`; `default` / `lg`; dot toggle | Board, drawer, tables | approved |
| `Avatar` | **A person.** Monogram or photo, circular | `xs` / `sm` / `md` / `lg`; `onDark` | Sidebar, cards, drawer | approved |
| `WorkImage` | Customer, wig and process imagery — rectangular | sizes | Drawer, work order | approved |
| `ImageSlot` | Design-system placeholder marking where an image goes | size, radius | Drawer gallery, specimens | approved |
| `Icon` | Lucide line icons | name, size, stroke, fill | Everywhere | approved |

## Forms

| Component | Purpose | Variants | Used in | Status |
| --- | --- | --- | --- | --- |
| `FormField` | Label + control + help + error, consistently placed | required, help, error | All forms | existing |
| `Input` | Single-line text, 36px | invalid, disabled, with icon | Forms, auth | existing |
| `Textarea` | Multi-line text | invalid, disabled | Notes, forms | existing |
| `Select` | Real listbox primitive, never a native `<select>` | invalid, disabled, placeholder | Board filters, forms | approved |
| `Combobox` | Select with type-ahead for long lists | — | Customer pickers | existing |
| `DatePicker` | Date entry, tabular numerals | — | Order forms | existing |
| `Checkbox` | Boolean in a list or form | indeterminate, disabled | Forms, tables | existing |
| `RadioGroup` | One of a small set | — | Forms | existing |
| `Toggle` | Immediate on/off setting | disabled | Settings | existing |
| `FormMessage` | Error and help text under a field | error / help | All forms | existing |

## Data

| Component | Purpose | Variants | Used in | Status |
| --- | --- | --- | --- | --- |
| `FilterBar` | Shared tabs + search + filter row | tabs, search, actions slot | Board, orders, customers | approved |
| `DataTable` | Record list for cross-record comparison | sortable, row actions | Orders, customers, missing items | **needs refactor — no empty slot** |
| `DetailList` | Read-only label → value pairs describing one record | `columns` 1–2; `numeric` per item | Customer profile | existing |
| `Pagination` | Server pagination, page size 20 | — | Table screens | existing |
| `EmptyState` | Says a region is empty, never a bare frame | with/without action | Lists, board columns | existing |
| `SelectableOption` | One operational choice in a configuration-driven list | `radio` / `check` indicator; meta, description, trailing | Wizard customer + template steps | existing |
| `InlineAlert` | Page-level statement about the surface | `danger` / `peach` / `sage` / `info`; with action | Wizard validation, submission feedback | existing |
| `Skeleton` | Loading placeholder for a region | line / block | Async regions | existing |

## Domain

| Component | Purpose | Variants | Used in | Status |
| --- | --- | --- | --- | --- |
| `WorkCard` | Compact active production item | `board` / `planning` / `queue`; urgent / blocked / with action | Production Board, sprint planning, My Work | approved |
| `KanbanColumn` | One production stage on the board | with count, empty label, footer action | Production Board | approved |
| `Stepper` | Stage progress, quiet by design | current / completed / upcoming | Work Order Drawer, order detail | approved |
| `WizardStepper` | Orientation in a multi-step creation flow | completed / current / upcoming; clickable completed steps | New work order wizard | existing |
| `AssigneePicker` | Compact employee selection in a popover | assigned / unassigned; flips on overflow | Drawer, order detail | approved |
| `KpiCard` | A single headline number with its label | with delta | Dashboard | existing |
| `QueueList` / `QueueItem` | Tablet work queue, 44px targets | — | Worker tablet view | existing |
| `PrimaryActionBar` | Sticky primary action on task surfaces | — | Tablet task view, wizard footer | existing |
| `FileUpload` | Attach a file to a work order | — | Work order detail | existing |
| `AudioPlayer` | Play a recorded voice note | — | Work order notes | existing |

## Overlays

| Component | Purpose | Variants | Used in | Status |
| --- | --- | --- | --- | --- |
| `Drawer` | Contextual work information beside the page | — | Production Board (Work Order Drawer) | approved |
| `Dialog` | A contained decision that blocks the page | sizes | Forms, confirmations | existing |
| `AlertDialog` | Destructive or irreversible confirmation | — | Delete, cancel order | existing |
| `Popover` | Compact floating selection | placement | AssigneePicker, menus | existing |
| `Tooltip` | Names an icon-only control | placement | Chrome, toolbars | existing |
| `UndoToast` | Short undo window after a sensitive action | — | Board actions | approved |

---

## Composed patterns

Not components — established compositions to copy rather than redesign.

| Pattern | Built from | Reference |
| --- | --- | --- |
| **Work Order Drawer** | `Drawer` + `Stepper` + `StatusChip` + gallery + `AssigneePicker` + footer actions | Production Board |
| **Board column** | `KanbanColumn` + `WorkCard` list + footer add action | Production Board |
| **List screen** | `PageHeader` + `FilterBar` + `DataTable` + `Pagination` | Orders, customers |
| **Record detail screen** | `PageHeader` + `BackLink` + `FilterBar` tabs + `SectionHeading` sections + `Card` + `DetailList` | Customer profile |
| **Active-record row** | `Card` wrapping hairline-separated rows: identity + quiet stage chip + due + `Avatar` + chevron | Customer profile |
| **Create / edit record dialog** | `Dialog` + `SectionHeading size="sm"` groups + `FormField` grid + one plum primary, one ghost secondary | Create/Edit customer |
| **Card list screen** | `PageHeader` + `FilterBar` + card grid | Board, My Work |
| **Creation wizard** | `PageHeader` + `WizardStepper` strip + `SelectableOption` steps + `SectionHeading` field grids + `DetailList` review + `PrimaryActionBar sticky` | New work order |
| **Section in a detail surface** | Section title + plum accent hairline + content + hairline separator | Drawer |

The drawer's section rhythm (14px above and below, hairline between, one `SECTION` constant) is
the model for any detail surface. Do not hand-tune per-section padding.

---

## Known gaps

**`DataTable` renders a bare frame when `rows` is empty.** §17 says an empty region always says it
is empty, but the component has no `empty` slot, so every screen has to branch around it (the
customers list does). Add `empty?: React.ReactNode` and render `EmptyState` inside the table's own
border.

**`DataTable` has no row-action column convention.** Row actions are currently a hand-built flex of
`IconButton`s in a width-capped column, repeated per screen. Either a `rowActions` prop or a
documented recipe.

**`WiggyMark` is a placeholder.** A hairline stand-in drawn to occupy the right space at the right
weight. Send the original SVG and it drops into `Wordmark` unchanged.

**Employee avatars render monograms.** Intentional at this stage; `Avatar` accepts `src`.

**`Panel` is under-exercised.** The drawer moved to hairline-separated sections instead, which
reads better. Before using `Panel` on a new screen, check whether hairline sections would serve.

**Screens not yet rebuilt on the locked system.** Dashboard, orders, customers and the auth kit
predate the final chrome and card passes. They inherit the token changes automatically, but their
compositions have not been reviewed against the approved board and drawer.
