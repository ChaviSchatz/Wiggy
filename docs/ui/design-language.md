# WigFlow — Design Language ("warm operational studio")

> Direction for the look, feel, and identity patterns. Hebrew-first / RTL. This file fixes the
> **intent**; `docs/ui/design-system.md` fixes the **values**; `docs/ui/screen-designs.md` fixes the
> **per-screen composition**. Where the three disagree, the more specific file wins.

## Intent

WigFlow is the operations surface of a premium wig salon. The people using it are working — a
manager triaging the day, a worker at a station with a wig in one hand. The interface should feel
like a well-kept studio: calm, warm, precise, unhurried.

Human, calm, professional, refined. Information-dense but never noisy. The restraint is the point:
colour and weight are budgeted, so when something _is_ coloured or bold it means something.

**Explicitly not:** a generic SaaS dashboard. Not an AI-generated purple-gradient interface. Not
childish, overly feminine, decorative, or luxury-for-luxury's-sake. Never sterile.

## Palette roles

The brand is a single **deep plum**. It is the only saturated colour that appears at full strength,
and it is reserved for identity and primary action — never for decoration.

- **Plum** — brand, primary actions, active navigation, focus rings.
- **Deep plum surface** — the desktop side navigation, which is a dark surface rather than a white
  panel. This is the most recognisable single element of the interface.
- **Near-white** — app background and card surfaces. Faintly plum-tinted, not pure `#fff`.
- **Cream** — reserved for helper, tip, and explanatory surfaces. This is where the warmth lives.
- **Soft status colours** — green, amber, red, blue, plum, grey, each as a soft background paired
  with a deepened foreground. Status is a scanning aid, not decoration.
- **Soft neutrals** — three text tiers, two border tiers, one hairline accent.

Contrast must meet WCAG AA. Warmth comes from hue, never from low contrast — this is a rule with
teeth, and it is why the status foregrounds in `design-system.md` are deeper than a comp might
suggest.

**One accent per view.** A screen has one primary action rendered in plum. Everything else is
quiet: outline, ghost, or text.

## Typography

Two families, each with a clear job:

- **Rubik** — page titles, section headings, and numerals. Set tight (negative tracking) at large
  sizes. This carries the character.
- **Heebo** — everything else: body, labels, metadata, controls, tables.

Hebrew-first, so line-height stays comfortable and never cramps. Numerals are tabular wherever they
line up in columns or compare — codes, dates, counts, times.

Text never goes below 12px. Dense comps are read as _hierarchy_ guidance, not as a licence to
shrink past legibility on a production floor.

## Shape, depth, and motion

- **Radius scales with the element.** Controls and small cards are tighter; panels, sheets, and
  modals are softer. Nothing is fully square, nothing is a pill except chips.
- **Almost no shadow.** Resting surfaces are defined by a hairline border on a near-white ground,
  not by elevation. Shadow is reserved for things that genuinely float above the page: modals,
  drawers, toasts. A card that lifts on hover does so with a border-colour change and a 1px
  translate, not a shadow bloom.
- **The hairline tick** — a short 2px plum-tinted rule at the leading edge of a panel or board
  column header. It is the one piece of pure ornament in the system, and it is what stops panels
  reading as generic white boxes.
- **Motion is functional.** 150–200ms ease-out, transform and opacity only, and it respects
  `prefers-reduced-motion`. No entrance animation on content that was already there.

## Action hierarchy

**Done = primary. Start = secondary.** Every state change offers a short **Undo** rather than a
confirmation prompt, because the common case is correct and interrupting it is expensive.

Destructive and irreversible actions are the exception: those confirm in a dialog, and the
confirming button inside that dialog is solid, not soft.

Everyday actions live inline on the card or row. Opening an overlay to change a status is a
failure of the design.

## Identity & media rules

**Identity text leads with the customer name** on every surface, with the order code as secondary
metadata beside it. Work-order IDs and technical codes are how the system refers to work; names are
how people do.

There are **two visually distinct media types that must never be conflated:**

### Worker avatars — circular

- **Circular, profile-style**, with a thin light ring so they read cleanly on both the white content
  area and the dark side navigation.
- Show the **assigned worker** on task cards and task lists.
- **Tap a board avatar → reassign** the task.
- Fallback: deterministic **monogram** (initials, stable calm colour). Workers always render an
  avatar, since we always know the worker.

### Client identity — text only (no avatar)

- **No client avatar and no initials fallback.** Most clients have no photo, so an avatar circle
  would only add empty space and imply a picture that will never arrive.
- Client identity = **name (+ order code) as text**.
- Customer-less orders (internal / display wig): identity = **order kind + code**, still no avatar.

### Reference / work photos — squared, only when present

- Style, colour, and reference images live on the order as **attachments**. Their purpose is work
  reference — "what am I making" — _not_ personal identity.
- Rendered as **squared / rounded-rect thumbnails**, **only when they exist** (no placeholder, no
  reserved empty slot), and **clearly distinct in shape** from the circular worker avatars so the
  two are never mistaken.
- **Never on a production-board card.** The board is for triage and its cards stay textual; photos
  appear in the quick-view peek, the full work-order hub, and on My Work cards where they help a
  worker recognise the job in front of them.

## Device posture

**Desktop is the primary management experience** — the manager's board, planning, and lists assume
a wide screen and a mouse.

**Worker-facing surfaces are tablet-first**: large touch targets (≥44px), minimal chrome, and only
the information needed to do the task in hand.

**Mobile preserves hierarchy rather than stacking.** A narrow screen drops chrome and secondary
metadata; it does not simply reflow every desktop element into one column. The same thing stays
most important at every width.

## RTL

Hebrew is the default and RTL is the native reading direction, not a mirrored afterthought.

- **Logical CSS only** — `ps/pe`, `ms/me`, `start/end`, `text-start/end`. Never `left`/`right`.
- Never force a container to `ltr` and re-flip its children. If a comp does this, it is a drawing
  shortcut, not a pattern to reproduce.
- Icons that encode direction (back, next, chevrons) flip with the writing direction. Icons that
  encode a thing (clock, paperclip, bell) do not.
- All copy comes from `next-intl` catalogs (`he` default). Tenant-entered content is stored as
  entered and never translated (ADR 0005).
