# Wiggy Design System

The visual foundation for every Wiggy screen. Wiggy is the operations surface of a premium wig
salon: multi-tenant, Hebrew-first, used all day by managers and craftspeople on desktop and
tablet. It is a working tool, not a dashboard product.

The approved Production Board, Work Card, Work Order Drawer and application chrome are the visual
source of truth. This document extracts what they established so future screens inherit it instead
of rediscovering it.

**How to use this.** Build a new screen from the tokens in `tokens/*.css` and the components in
`components/`. Create a layout; do not create a new button, card, radius, colour or interaction
model. If something genuinely cannot be expressed, see [§22 Adding to the system](#22-adding-to-the-system).

Companion files:
- `tokens/*.css` — the machine-readable tokens; this document explains them.
- `components/<group>/<Name>.{jsx,d.ts,prompt.md}` — source, typed props, usage guidance.
- `COMPONENT_INVENTORY.md` — what exists, its variants, where it is used, and its status.
- `readme.md` — provenance: what came from the repo, what was inferred.

---

## 1. Design principles

**The work is the interface.** Production content is the only thing on screen that should feel
important. Chrome recedes: the sidebar is a margin, the top bar holds transient tools, the page
title states where you are and gets out of the way.

**Restraint is the brand.** Wiggy looks bespoke because of precision — consistent 1px borders,
aligned baselines, deliberate whitespace — not because of decoration. Nothing is added to create
personality.

**Plum is punctuation.** Strong plum appears a handful of times per screen and always means
something. An interface where every interactive element is plum has no accent at all.

**Borders before shadows.** Structure comes from fine lines and spacing. Elevation is reserved for
surfaces that genuinely float.

**Hierarchy survives greyscale.** If the screen stops being readable when colour is removed, the
typography is wrong. Colour confirms hierarchy; it never creates it.

**Density with air.** Operators scan dozens of records. Compact, but never squeezed against a
border.

**Hebrew-first, natively.** RTL is the default authoring direction, not a mirrored patch.

---

## 2. Colour tokens

Defined in `tokens/colors.css`. Never hardcode a colour in a component; reference the token.

### Brand

| Token | Value | Use |
| --- | --- | --- |
| `--mauve-600` | `#672b62` | Primary plum. CTAs, active state, current stage, focus. |
| `--mauve-700` | `#572252` | Deep plum. Hover/pressed on primary. |
| `--mauve-900` | `#482044` | Deepest plum. Rare — heavy type on light plum. |
| `--mauve-200` | `#ead9e8` | Soft plum. Sidebar mark, quiet accents on dark. |
| `--mauve-100` | `#f4eaf3` | Plum wash. Focus ring, selected row, approval chip ground. |
| `--sidebar` | `#5b2557` | The one inverted surface in the product. |

The family is named `mauve` for historical reasons — the values are plum.

### Surfaces

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#fcfbfc` | Application background. |
| `--surface` | `#ffffff` | Cards, drawers, inputs, menus. |
| `--surface-soft` | `#fdfbfd` | Board columns, drawer footer, helper surfaces. |
| `--cream` | `#fffdf9` | Warm off-white for occasional editorial panels. |

Stage grounds (`--stage-warm`, `--stage-sage`, `--stage-peach`, `--stage-lilac`, `--stage-blue`)
are near-invisible tints for holding a column together. They are never a stage's identity.

### Text

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#351f33` | Primary text. |
| `--muted` | `#7d6e7b` | Secondary text, labels, supporting copy. |
| `--faint` | `#9b8f99` | Metadata: codes, counts, timestamps. 3.0:1 — non-essential text only. |
| `--disabled` | `#b9afb8` | Disabled text and glyphs. Never load-bearing. |

### Borders

| Token | Value | Use |
| --- | --- | --- |
| `--line` | `#ebe5eb` | Default 1px border and section separator. |
| `--line-strong` | `#dfd4df` | Stronger border, dashed placeholder edge, input outline. |
| `--border-focus` | `var(--mauve-600)` | Focused control. |
| `--border-selected` | `var(--mauve-600)` | Selected control. |
| `--hairline` | `#c7a8c3` | The short plum accent tick — a Wiggy signature. |
| `--scrim` | `rgb(45 24 43 / 0.3)` | Dimming behind drawers and modals. |

### Status

Each family is a triplet: `-100` ground, `-500` dot or border only, `-600` text (AA on `-100`).

| Meaning | Ground | Mid | Text |
| --- | --- | --- | --- |
| Success / done | `--sage-100` `#eaf5ee` | `--sage-500` `#4d936b` | `--sage-600` `#3a7852` |
| Warning / waiting | `--peach-100` `#fff1df` | `--peach-500` `#c17d31` | `--peach-600` `#99611f` |
| Danger / exception | `--danger-100` `#fbe9e9` | `--danger-500` `#ca6060` | `--danger-600` `#b34545` |
| Info / in progress | `--info-100` `#edf2f8` | `--info-500` `#6481aa` | `--info-600` `#526e96` |
| Approval / plum | `--mauve-100` `#f4eaf3` | — | `--mauve-600` `#672b62` |
| Idle / neutral | `--idle-100` `#f2eff2` | `--idle-500` `#7b707a` | `--idle-600` `#736874` |

Do not introduce a new colour family. A new product state maps onto an existing family by meaning.

---

## 3. Typography

Two families, defined in `tokens/fonts.css` and `tokens/typography.css`.

**Rubik** (`--font-display`) — page titles, major section headings, large numeric metrics. Nothing
else.
**Heebo** (`--font-sans`) — everything else: navigation, record names, card text, labels, buttons,
filters, metadata.

| Role | Token | Size | Weight | Notes |
| --- | --- | --- | --- | --- |
| Page title | `--text-page` | 31px | 700 | Rubik, `-0.025em`, line-height 1.15. One per screen. |
| Record / management title | `--text-metric` | 26px | 600 | Rubik, `-0.02em`, line-height 1.1. `PageHeader size="compact"` — list and detail screens where the title names a place, not a story. |
| Page subtitle | `--text-page-sub` | 12.5px | 400 | Heebo, `--muted`. |
| Section title | `--text-section` | 18px | 700 | Rubik. |
| Numeric metric | `--text-metric` | 26px | 800 | Rubik, `-0.02em`, tabular. |
| Record / customer name | `--text-identity` | 14px | 600 | Heebo. Card identity. |
| Record name (detail) | `--text-identity-lg` | 15px | 600 | Heebo. Drawer and detail headers. |
| Body large | `--text-body-lg` | 16px | 400 | Heebo. Long-form only. |
| Body | `--text-body` | 14px | 400 | Heebo. |
| Label | `--text-label` | 13px | 600 | Heebo. Form labels, small headings. |
| Button | — | 13px | 500–600 | Heebo. Matches control height. |
| Metadata | `--text-meta` | 12px | 400 | Heebo, `--muted`. |
| Micro metadata | `--text-micro` | 11px | 500 | Heebo, `--faint`. Dense cards and table sub-lines only: codes, dates, counts. Never a label a decision depends on. |

Line-height tokens travel with the step (`--leading-page`, `--leading-body`, etc.) so a heading
cannot be half-applied.

**Rules.** 11px is the floor, and only for dense card metadata — never for body copy. Weight is
the scarce resource: at most one 700+ element per card and one per section. A label is not bold by
default. Numerals in tables, dates, codes and metrics use `font-variant-numeric: tabular-nums`.

---

## 4. Spacing

One scale, in `tokens/spacing.css`: **4 · 8 · 12 · 16 · 24 · 32 · 48**.

| Token | Value | Typical use |
| --- | --- | --- |
| `--space-1` | 4px | Icon-to-label, chip internals. |
| `--space-2` | 8px | Control gaps, card internal gaps. |
| `--space-3` | 12px | Section internal padding, drawer rhythm. |
| `--space-4` | 16px | Block separation: title → tabs → filters → content. |
| `--space-6` | 24px | Major section separation. |
| `--space-8` | 32px | Page-level separation. |
| `--space-12` | 48px | Empty states, rare large breaks. |

Page gutter: `--gutter-desktop` on desktop, `--gutter-compact` (12px) below `lg`.

Values off this scale need a reason. Optical adjustments of 1–2px on a single component (a card's
10/11px padding, a chip's 2/8) are acceptable where they make a dense element read correctly; a
new *layout* gap is not.

---

## 5. Radius

Defined in `tokens/shape-depth.css`. Radius scales with the element.

| Token | Value | Applies to |
| --- | --- | --- |
| `--radius-xs` | 9px | Small controls, inputs, buttons, chips-adjacent surfaces. |
| `--radius-sm` | 11px | Cards, board columns. |
| `--radius-md` | 15px | Panels, sheets, dialogs, drawers. |
| `--radius-lg` | 16px | Large containers. |
| `--radius-full` | 999px | **Status chips and avatars only.** |

Aliases: `--radius-control` → xs, `--radius-card` → sm.

Pill radius is reserved. Tabs, filters, navigation items and form controls are never pills.

---

## 6. Borders

`--border-width` is 1px. **2px means exactly one thing: selected or focused.**

| Purpose | Treatment |
| --- | --- |
| Default border | `1px solid var(--line)` |
| Stronger border | `1px solid var(--line-strong)` |
| Focus | `1px solid var(--border-focus)` + `box-shadow: var(--focus-ring)` |
| Selected | `1px solid var(--border-selected)`, or a 2px plum underline for tabs |
| Placeholder / add slot | `var(--border-dashed)` |
| Section separator | `1px solid var(--line)`, full width of the content column |
| Accent hairline | 18×1.5px `--mauve-600` at 40% opacity, under a section title |

The accent hairline is a Wiggy signature. Use it under section titles inside drawers and detail
panels — sparingly enough that it stays a signal. `SectionHeading` renders it; do not hand-draw it.

---

## 7. Shadows and elevation

Three levels. A component picks one; it does not invent a shadow.

| Level | Token | Value | Use |
| --- | --- | --- | --- |
| 0 | `--elevation-0` | `none` | Ordinary content and cards. The border does the work. |
| 1 | `--elevation-1` | `0 4px 14px rgb(69 35 66 / 0.04)` | Dropdowns, popovers, subtle floating controls. |
| 2 | `--elevation-2` | `0 2px 6px rgb(69 35 66 / 0.05), 0 22px 52px -12px rgb(69 35 66 / 0.16)` | Drawers, modals, floating menus. |

Elevation 2 is two layers on purpose: a tight contact shadow plus a wide soft lift, so a drawer
reads as a floating work surface rather than a heavy modal.

Never apply a shadow to sections *inside* an elevated surface.

---

## 8. Iconography

Lucide, via the `Icon` component. No icon fonts, no sprite sheets, no PNGs.

| Context | Size | Stroke |
| --- | --- | --- |
| Sidebar navigation | 18px | 1.5 |
| Top bar and toolbars | 15–16px | 1.6 |
| Inline in controls | 14–15px | 1.6–1.7 |
| Card metadata | 11–13px | 1.7–2.0 |

Icons are line art at `--muted` or `--faint`. Filled glyphs are reserved for meaning — the urgency
star is a filled `--danger-500`. Never colour an icon plum to decorate it.

Icons carry `aria-label` when they are the only content of a control, and `aria-hidden` when a
text label sits beside them.

---

## 9. Buttons

One `Button` component with variants. Never a second button implementation.

| Variant | Treatment | Use |
| --- | --- | --- |
| `primary` | Plum fill, white text | The single most important action in a view. One per view. |
| `outline` | `--line` border, `--ink` text, transparent | Secondary actions, drawer footers. |
| `ghost` | No border, `--muted` text, plum-wash hover | Tertiary and in-card actions. |
| `danger` | Danger fill or outline | Destructive confirmation only. |

Sizes: `xs` (~26px), `sm` (`--control-height-sm`, 30px), default (`--control-height`, 36px),
`lg` (`--control-height-lg`, 44px — touch).

**Board cards are the exception that proves the rule.** Repeating a filled plum "Complete" button
across a dozen cards destroys the accent, so the board uses a compact 22px circular icon action
that fills plum on hover. Anywhere a card list needs a per-row action, use that pattern.

`IconButton` is the icon-only form: `--icon-button-size` (32px), transparent until hover.

---

## 10. Forms

All fields go through `FormField` (label, control, help, error) so labelling and error placement
are consistent.

Control height `--control-height` (36px); `--control-height-lg` (44px) on touch surfaces.
Radius `--radius-xs`. Border `--line`, focus `--border-focus` + `--focus-ring`.

Components: `Input`, `Textarea`, `Select`, `Combobox`, `DatePicker`, `Checkbox`, `RadioGroup`,
`Toggle`, `FormMessage`.

`Select` is a real primitive with a proper listbox — never a native `<select>` with styling
pinned on. Menus open at `--elevation-1`, flip above the trigger when there is no room below, and
cap their height to the space actually available.

Errors: `FormMessage` below the field, `--danger-600` text, and `aria-invalid` on the control.
Never colour the label red.

---

## 11. Cards

`Card` is the base surface: `--surface`, `1px solid var(--line)`, `--radius-sm`, no shadow.
`interactive` adds a hover border and pointer.

Cards rely on spacing, typography and fine borders. Not on shadows, large radii or decorative
fills. Internal padding stays consistent within a surface — a list of cards uses one padding
value, not per-card variation.

`Panel` is the larger sibling for grouped content in detail views (`--radius-md`, optional title).
Do not wrap every piece of information in a panel; most content sits directly on the page,
separated by hairlines.

---

## 12. Status chips

`StatusChip` is the one place domain vocabulary maps to colour. Callers pass **meaning**
(`status="awaiting_approval"`), never a colour. The map lives in the component.

Two forms:
- **Filled** — tinted `-100` ground, `-600` text, dot. For exceptions and states that must be seen.
- **`quiet`** — dot plus word, no ground. For ordinary flow on dense surfaces.

On a board column of a dozen cards, ordinary states are `quiet` so a filled chip still means
"look here". Chips are `--radius-full` — one of only two pill uses in the system.

Chips shrink and ellipsize rather than clipping: the chip and its label both carry `min-width: 0`.

---

## 13. Navigation

**AppShell** — full-height side nav beside a main column; the top bar spans the main column only.

**SideNav** — `--sidenav-width` (196px), `--sidebar` ground, the one inverted surface. Items are
34px, 12.5px Heebo at weight 400 (active included), 18px icons at 1.5 stroke. The active state is
tonal: `rgb(255 255 255 / 0.11)` ground, full-strength text, and a 2px `--sidebar-mark` marker on
the inline-start edge. Not a filled pill, not bold.

**TopBar** — `--topbar-height` (60px), white, hairline bottom border. Transient tools only; page
actions belong to `PageHeader`. Icons sit container-less until hover.

**PageHeader** — every page title goes through it. Title, optional subtitle, optional actions and
back link. 16px below it, then tabs, filters, content.

**Tabs** (inside `FilterBar`) — muted text, no ground, 2px plum underline and plum text when
active. Counts sit attached to the label, smaller and quieter. Never pills.

**BottomNav** — the mobile alternative to SideNav, 64px, 44px touch targets.

---

## 14. Drawers, modals, popovers

| Surface | Component | Use |
| --- | --- | --- |
| Drawer | `Drawer` | Contextual work information beside the board. The Work Order Drawer is the reference. |
| Modal | `Dialog` | A contained decision that blocks the page. |
| Confirmation | `AlertDialog` | Destructive or irreversible action. |
| Popover | `Popover` | Compact selection, e.g. choosing an employee. |
| Tooltip | `Tooltip` | Naming an icon-only control. |
| Toast | `UndoToast` | Short undo window after a sensitive action. |

The drawer is the model for detail surfaces: `--drawer-width`, `--radius-md`, `--elevation-2`,
`--scrim` behind, a header carrying identity, hairline-separated sections on a single 14px rhythm,
and a sticky footer on `--surface-soft` with one plum primary and one outline action.

Sections inside an overlay are separated by hairlines, never by nested cards or shadows.

---

## 15. Employee avatars

**A circular avatar means a person** — employee, assignee, system user. Nothing else in Wiggy is
circular except status chips.

`Avatar` sizes: `xs` 22, `sm` 26, `md` 32, `lg` 44 (touch). It renders a monogram by default and a
photo when one exists; `onDark` adapts it for the sidebar. Tapping an assignee avatar opens
reassignment.

Never use a circular treatment for a customer, a wig, or a work photo.

---

## 16. Work and customer imagery

`WorkImage` is the product component: a rectangular, softly rounded container (`--radius-xs`, 10px
in gallery contexts). `ImageSlot` is the design-system placeholder that marks where one would go.

**Where imagery appears:** the Work Order Drawer, the full Work Order screen, attachment and
history views, and selected CRM areas where a reference photo genuinely helps.

**Where it does not:** Production Board cards. The board is textual triage; a photo on every card
turns a scanning surface into a gallery.

Galleries use one tile geometry throughout — thumbnails, the `+N` overflow indicator and the add
control are the same square with the same radius and gap. The overflow indicator is a light wash
with muted text, not a dark overlay.

---

## 17. Tables

`DataTable` for record lists. Header in `--text-label` at `--muted`, rows separated by `--line`,
no zebra striping, no vertical rules. Numeric columns are tabular and end-aligned; text columns
start-aligned. Row hover is a `--surface-soft` wash. `Pagination` sits below at page size 20.

A table is for comparing records across shared columns. A board or card list is for working
records one at a time. Do not use a table because the data has fields. A single record's own
fields are neither: they are `DetailList`.

**Row actions.** A management row ends with a quiet action cluster — `IconButton`s in a fixed-width
final column, transparent until row hover. Edit sits before the open chevron, and the chevron
points along the reading direction. The whole row is also clickable to open.

`EmptyState` for no results, `Skeleton` for loading. An empty region always says it is empty —
never a bare frame.

---

## 18. Responsive rules

**The Production Board requirement.** All production-stage columns are visible simultaneously on
desktop, large landscape tablets, and approximately 11-inch landscape tablets — no horizontal
scrolling. The board is a fluid grid: columns share the width equally
(`--board-column-width: auto`, `--board-column-min-width: 0`, `--board-gap` 8px) and compress.

Compression order, as width decreases: column width → gaps → card padding → metadata layout →
typography within the floor (11px). Card content never overflows; text ellipsizes.

Below `--board-single-below` (820px of board area) the multi-column board stops being usable and
an intentional alternative takes over: a stage tab rail with one column at full width. This is a
different presentation, not a shrunken desktop, and no stage is hidden.

The layout decision is measured **before first paint** — seeding it from a post-paint observer
flashes a broken six-column board on tablets.

Chrome compresses too: gutters drop to `--gutter-compact`, filters narrow, the top bar tightens.
Controls never fall below 44px on touch surfaces. Never solve a width problem by hiding a control
without a deliberate alternative.

---

## 19. RTL rules

Hebrew is the authoring direction. RTL is not a mirrored patch applied at the end.

- **Author with logical properties.** `margin-inline-start`, `padding-inline-end`,
  `inset-inline-start`, `border-inline-start-width`, `text-align: start`. Never `left`/`right` for
  layout.
- **Direction lives at the root.** `dir` is set on the screen container; components inherit it.
- **Sidebar** sits at the inline-start edge — the right side in Hebrew.
- **Icons** sit at the inline-start of their label; the gap is a flex `gap`, never a margin.
- **Chevrons and carets** point along the reading direction: a disclosure chevron points
  inline-end, and a "next" affordance points left in Hebrew.
- **Input icons** (search, calendar) sit inline-start of the field.
- **Tables** run start-aligned; numeric columns end-aligned. Column order mirrors.
- **Drawers** open from the inline-start edge.
- **Tabs** run start to end, so the first tab is rightmost in Hebrew.
- **Stage progress** flows in the reading direction: the first stage is inline-start, and the
  connecting line and completion fill run the same way.
- **Numbers, codes, dates and times stay LTR** inside RTL text. Use tabular numerals and let the
  bidi algorithm handle the run; do not force direction on the surrounding text.
- Test both directions. A layout that only works in one is a layout bug.

---

## 20. Tenant branding

Three identities, kept separate:

1. **Wiggy product identity** — this design system. Plum, Rubik/Heebo, the component language.
   Not configurable by tenants.
2. **Salon / tenant identity** — the salon's name and logo. Configurable per tenant.
3. **User identity** — the signed-in person: avatar, name, role.

The shell already separates them: `Wordmark` renders the product mark and accepts a `subtitle`;
`SideNav` takes `brandSubtitle` and a `user` object. A tenant logo drops into the `Wordmark` slot
and a tenant name into the subtitle without structural change.

Never hardcode a salon name, logo or colour into a reusable component. Tenant branding does not
extend to overriding system colours — a tenant configures identity, not the design system.

`WiggyMark` is a hairline stand-in, not a final mark.

---

## 21. Interaction states and micro-interactions

Every interactive component defines: **default, hover, focus, selected, active, disabled**, plus
**error** and **loading** where relevant.

| State | Treatment |
| --- | --- |
| Hover | A tone shift — `--surface-soft` wash, or a border darkening. Never a size or shadow change. |
| Focus | `--border-focus` plus `--focus-ring`. Always visible; never removed. |
| Selected | Plum text with a 2px underline (tabs), a plum-wash row, or a plum border. Not a large filled block. |
| Active / pressed | One step deeper: `--mauve-700` on primary. |
| Disabled | `--disabled` text, `--line` border, no hover, `aria-disabled`. |
| Error | `--danger-500` border, `FormMessage` below, `aria-invalid`. |
| Loading | `Skeleton` for regions; an inline spinner only in a button that triggered work. |

Motion: `--motion-fast` (150ms) for state changes, `--motion-slow` (200ms) for surfaces entering.
Easing `--motion-ease`. Transition colour, opacity and transform — never layout. Wiggy is not
animated for decoration.

Established behaviours, to be reused rather than reinvented: a short **undo** window after a
sensitive action; a **drawer** for contextual work information; a **modal** for a contained
decision; a **popover** for compact selection; hover and selected states on production cards; a
subtle focus treatment everywhere.

---

## 22. Multi-step creation flows

A creation wizard is a normal management page: `AppShell` + `TopBar` + `PageHeader`, content capped
at a comfortable operational width (~980px, inline-start aligned — not a centred checkout column).
There is no separate full-screen wizard shell.

**Orientation.** `WizardStepper` sits in a hairline strip directly under the `PageHeader`:
18px nodes, 12.5px labels, a 1px connecting line. Completed is sage, current is plum with a
`--mauve-100` focus halo, upcoming is `--line-strong` on `--surface`. Completed nodes are
clickable; upcoming ones are not. `Stepper` remains the production-stage tracker for an order that
already exists — the two are siblings, not variants of each other.

**Choosing.** Configuration-driven lists of choices — customer search results, intake templates,
configured options — render as `SelectableOption`: a 44px row, identity line plus quiet metadata,
selected as a plum outline on a `--mauve-100` wash. Never a filled plum block, never a marketing
card, never a circular avatar for a customer.

**Dynamic sections.** A configured section is `SectionHeading` + optional helper line + a two-column
`FormField` grid (one column under ~860px). Long text and multi-choice fields span both columns.
Fields are grouped by space and hairlines, not by one card per group.

**Generated work.** What the template will create is shown *after* a hairline break from the intake
data, as compact hairline rows inside one `Card` — group name, its tasks, a count. Not `WorkCard`s:
nothing is in production yet.

**Review.** A summary, not the form again: `SectionHeading` per block with a ghost `עריכה` action
that returns to the owning step with data intact, and `DetailList` for the values. A field left
empty reads `לא הוזן` in `--faint`.

**Validation and feedback.** Required-field errors are `FormField error` plus one `InlineAlert`
`tone="danger"` at the top of the step. A non-blocking gap is `tone="peach"`; a failed submission is
`tone="danger"` with a retry action; success is `tone="sage"`. Never a filled red banner or a
red-washed form section.

**Footer.** `PrimaryActionBar sticky`: one plum action (`המשך` / `יצירת הזמנה`), an outline back
action, and cancel pushed to the inline end. Moving back never clears entered data and never asks
for confirmation.

---

## 23. Adding to the system

Reuse first. Then a variant of an existing component. Only then something new.

If a new component is genuinely necessary:

1. State why the existing components and variants are insufficient.
2. Build it from existing tokens — no new colours, radii, shadows or spacing values.
3. Add it to `components/` with a `.d.ts` and a `.prompt.md`, and to `COMPONENT_INVENTORY.md`.
4. Document the pattern here if it establishes a new rule.

Never solve a screen-specific problem with one-off styling inside the screen. If a screen needs a
visual treatment, either the system already has it or the system should gain it.

---

## 24. Do / Don't

**DO** use fine borders and restrained whitespace.
**DON'T** wrap every piece of information in a floating card.

**DO** use plum selectively — CTA, active state, current stage, focus.
**DON'T** turn the interface purple by filling every interactive element.

**DO** use circular avatars for employees.
**DON'T** give customer or wig imagery the same circular treatment.

**DO** establish hierarchy with type size and weight.
**DON'T** make every label bold — weight is scarce.

**DO** reuse existing components and variants.
**DON'T** invent a new button, card or dropdown because a new screen "looks different".

**DO** let dense surfaces use quiet chips so a filled chip still means something.
**DON'T** put a filled status chip on every row.

**DO** compress the board — width, gaps, padding, metadata.
**DON'T** solve a narrow viewport with horizontal scrolling or by hiding a stage.

**DO** author with logical properties so RTL is native.
**DON'T** mirror a finished LTR layout at the end.

**DO** say a region is empty.
**DON'T** render a bare frame.

**DO** keep numbers tabular and LTR inside Hebrew text.
**DON'T** force direction onto the surrounding copy.
