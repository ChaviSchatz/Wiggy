# design-sync notes — Wiggy design system

## Source shape

`docs/design/` is documentation-authored source, not an npm-published package:
no build tooling, no dist/, no Storybook. The converter runs in **synth-entry
mode** (`cfg.shape: "package"`, no `cfg.buildCmd` — there is no build to run;
re-sync just re-copies the staged scripts and re-runs `package-build.mjs`
directly against `docs/design/components/**/*.jsx`).

Scaffolding added to make this syncable (not part of the original docs/design
drop — added by design-sync):
- `docs/design/package.json` — minimal `{name: "wiggy-design-system"}` so the
  converter can resolve a package root. `cfg.entry` points at a
  `docs/design/dist/index.js` that deliberately does not exist, purely so the
  PKG_DIR walk-up lands on `docs/design/`.
- `docs/design/tokens/tokens.css` — reconstructed from
  `WIGGY_DESIGN_SYSTEM.md` §2–§7 (colors/typography/spacing/radius/
  borders/shadows) plus every `var(--*)` actually referenced across
  `components/**/*.jsx` (grep'd — the doc alone didn't cover all of them:
  `--shadow-card`, `--shadow-overlay`, `--sidebar-active/hover/line/fg-dim`,
  `--z-*`, `--touch-target-min`, `--bottomnav-height`, `--drawer-width`,
  `--stage-*`, the `-200`/`-300` status steps). Values not tabled in the doc
  were inferred to match documented intent — flagged for the user to confirm
  against the real Figma/brand source if one exists.
- `docs/design/components/chrome/RtlRoot.jsx` + `cfg.provider` — Wiggy is
  Hebrew-first ("direction lives at the root," §19) but no shipped component
  sets `dir="rtl"`; without a provider every preview card defaulted to LTR
  and rendered mirrored wrong (columns/buttons on the wrong side). RtlRoot is
  preview-harness-only, excluded from the component cards via
  `componentSrcMap: {"RtlRoot": null}`.
- `.design-sync/config.json` `dtsPropsFor` — every component's hand-written
  `<Name>.d.ts` prop interface was extracted verbatim (script:
  `.design-sync/build-config.mjs`, one-off, safe to re-run) since the .jsx
  source has no type annotations for ts-morph to extract from. One manual
  fix: `DataTable`'s `DataTableColumn<T>` generic aux-interface doesn't
  auto-inline (the extractor only inlines non-generic aux interfaces) — its
  `dtsPropsFor` entry was hand-written with `T` monomorphized to `any`.
- `.design-sync/config.json` `docsMap` — the existing `<Name>.prompt.md`
  files don't match design-sync's sibling-doc naming convention
  (`<Name>.md`/`.mdx`), so every component needed an explicit `docsMap`
  entry rather than relying on discovery. This is a deliberate exception to
  "docsMap is exceptions only" — discovery structurally cannot match this
  repo's naming.

## Ignored: docs/design/components/*/*.card.html

Each group folder has a pre-existing `<group>.card.html` — a hand-built demo
page (Babel-standalone + unpkg CDN React, one file per GROUP not per
component) that predates this sync and doesn't match the design-sync output
contract (no `_ds_bundle.js`, no per-component `.html`, CDN-loaded React
instead of vendored). **Not uploaded and not read by the converter** — but
used as a curated composition source when authoring `.design-sync/previews/`
(the demo JSX is realistic, DS-author-quality composition data worth porting
rather than re-inventing).

## Fixed: Icon.jsx depended on a UMD global that nothing ever loaded

`Icon.jsx` originally read glyph data off `window.lucide` — a stand-in written
to match how the old `<group>.card.html` demos loaded lucide via a CDN
`<script>` tag, with a comment noting "in the product this is `lucide-react`".
Nothing in the design-sync bundle/preview pipeline ever loads that UMD script
(`_vendor/` only vendors react/react-dom), so **every** `Icon` — and anything
composing it (`IconButton`, `Button` iconStart/End, `SideNav`, `EmptyState`,
`WorkCard`, etc.) — rendered with a fully invisible glyph. All 6 preview-
authoring subagents independently hit and correctly diagnosed this as one
shared root cause rather than a per-component bug.

Fixed at the source rather than worked around: `docs/design/components/core/
Icon.jsx` now imports `{ icons }` from the real `lucide-react` npm package
(already a dependency of the live Wiggy app — `package.json`, and already
used throughout `src/`), which is exactly what the component's own comment
said the production version should do. This is a legitimate fidelity fix, not
a reimplementation — same visual API (`name`/`size`/`strokeWidth`), same
kebab-case lucide names, now backed by the real package instead of an
undefined global. Bundle size grew from ~125KB to ~1.1MB as a result (the
full lucide icon set, since `name` is a runtime string the design agent can
set to anything — a curated subset would silently fail on any icon name
outside it, which is worse). All Icon/IconButton/Tooltip cells previously
graded `needs-work` for this reason were regraded `good` after the fix.

## Preview authoring — fan-out summary

All 54 components (53 authored + 1 floor card) were authored across a solo
calibration pass (Button, DataTable, DetailList) plus 6 parallel subagents,
one per component group (forms, core, overlays, chrome, data, domain).
Compositions were ported from each group's `<group>.card.html` demo (see
above) into `.design-sync/previews/<Name>.tsx`, with realistic Hebrew salon/
order-domain content throughout (customer names, `WO-####` order codes,
Hebrew dates, real status/stage vocabulary) — no placeholder/lorem content.
Every cell graded `good` on the absolute rubric (styled/complete/plausible)
after the lucide fix above; `WiggyMark` is the one component left on the
floor card, matching its documented status ("placeholder — not the real
mark") — not worth authoring a preview for a component that is itself a
placeholder.

Two authoring-time fixes worth knowing about for future re-syncs:
- **Overlay components** (AlertDialog, Dialog, Drawer) render `position:
  fixed; inset:0` scrims. The capture harness's per-story wrapper has no
  explicit height, so a fixed scrim collapsed to zero unless the preview
  itself wraps the composition in a sized, `transform`-bearing container
  (a real CSS containing block). Done in each of those three `.tsx` files
  directly — no `cfg.overrides` needed for that part. `cfg.overrides` WAS
  needed for card presentation: `AlertDialog`/`Dialog`/`Drawer` use
  `cardMode: "single"` (grid can't contain a fixed/portal element at all),
  `Popover`/`Tooltip` use `cardMode: "column"` (their content renders wider
  than a grid cell).
- **`RtlRoot`'s full-width background** means a preview cell using a narrow
  `maxWidth`-capped container leaves a large flat `var(--bg)` void beside it
  under RTL start-alignment — looks like a broken/empty layout even though
  it's technically on-token. Fix is compositional (fill more of the row, or
  use multiple items) — hit once in `Skeleton`'s `KpiCard` cell, fixed by the
  data-group agent.

Interactive-only states were deliberately left unauthored per component,
noted in each group's original learnings (now folded here): dropdown/listbox
open states (Select, Combobox, AssigneePicker), hover-only states (SideNav/
TopBar item hover), and AudioPlayer's playing/progress state — none are
settable via props at mount, so a static screenshot can't demonstrate them
honestly. Tooltip's open state is the one exception shown, via a real
`autoFocus`→`onFocus` bubble rather than a faked prop.

## Re-sync risks

- `docs/design/tokens/tokens.css` is a **reconstruction**, not the original
  source of truth — if the real Wiggy app later ships its own tokens CSS
  (e.g. a Tailwind config or globals.css with these values), reconcile and
  point `cfg.cssEntry` there instead; this file will silently drift
  otherwise.
- The `--stage-*`, sidebar `-active/-hover/-line/-fg-dim`, and status `-200`/
  `-300` steps have no documented hex value anywhere — inferred to be
  visually consistent with the documented tokens. Confirm with design if a
  canonical source exists.
- `docsMap` is a full enumeration (53 entries) rather than exceptions —
  correct today, but if `<Name>.prompt.md` naming ever changes to the
  standard `<Name>.md` sibling convention, the map should be dropped in
  favor of discovery.
- Bidi quirk observed in captured previews (DataTable, DetailList): a plain
  `"8 / 11"`-style string renders visually reversed (`"11 / 8"`) under
  `dir="rtl"` — a genuine text-shaping interaction between the slash and two
  number runs, not a design-sync artifact. Not fixed here (out of scope —
  would mean editing the design system's own components); worth the design
  team's attention if it also shows up in the real app.
