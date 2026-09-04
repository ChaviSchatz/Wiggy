## Wiggy conventions

Wiggy is Hebrew-first and RTL-native. **Every screen root must set `dir="rtl" lang="he"`** — components use logical CSS properties (`insetInlineStart`, `marginInlineEnd`, `textAlign: "start"`) and inherit direction from the nearest ancestor; without it, layouts render mirrored wrong. Build screens as `<AppShell sideNav={<SideNav .../>} topBar={<TopBar/>}>{page content}</AppShell>` — `AppShell` is the standard shell (side nav + top bar + scrollable main column); don't hand-roll page chrome.

No theme/context provider is required for normal use — components read CSS custom properties directly from `styles.css` (already loaded for you), and props alone drive variants. The only exception is internal to this sync (a preview-harness-only RTL wrapper), not something you need to add yourself.

**Styling idiom: inline `style` objects referencing `var(--token)`, never Tailwind or CSS classes.** Read a component's source (`components/<group>/<Name>/<Name>.jsx`) before styling around it — the idiom is consistent throughout. Real token families (full list: `tokens/tokens.css`):

| Purpose | Tokens |
|---|---|
| Brand / accent | `--mauve-600` (primary plum, one per view), `--mauve-700` (hover), `--mauve-100`/`--mauve-200` (washes) |
| Surfaces | `--bg`, `--surface`, `--surface-soft` |
| Text | `--ink` (primary), `--muted`, `--faint`, `--disabled` |
| Status triplets | `--sage-*` (success), `--peach-*` (warning), `--danger-*` (destructive), `--info-*`, `--idle-*` — each has `-100` ground / `-500` dot / `-600` text |
| Borders | `--line`, `--line-strong`, `--border-focus` |
| Radius | `--radius-xs` (controls), `--radius-sm` (cards), `--radius-md` (panels/dialogs), `--radius-full` (chips/avatars only) |
| Spacing | `--space-1`…`--space-12` (4/8/12/16/24/32/48px scale) |
| Type | `--font-display` (Rubik: page titles only), `--font-sans` (Heebo: everything else), `--text-page`/`--text-section`/`--text-body`/`--text-label`/`--text-meta`/`--text-micro` |
| Elevation | `--elevation-0/1/2` — a component picks one, never invents a shadow |

Never hardcode a color, radius, or shadow — always the token. Icons are `<Icon name="plus" size={16} strokeWidth={1.6}/>` (lucide, kebab-case names) — never a raw SVG or another icon set.

**One plum `Button variant="primary"` per view.** Everything else is `outline`/`ghost`/`soft`/`danger`/`danger-soft`/`link`. `StatusChip` is the only place domain status maps to color — pass `status="awaiting_approval"` (meaning), never a color prop. Borders and spacing carry structure; shadows are reserved for genuinely floating surfaces (drawers, popovers, dropdowns).

**Where to look before building:** `WIGGY_DESIGN_SYSTEM.md` (companion to this bundle) is the full rationale — colour/type/spacing scales, per-component conventions, RTL rules, and interaction states. Each `<Name>.prompt.md` has real usage examples for that component specifically; read it before composing something novel.

Idiomatic snippet — a page-shaped composition using real tokens and no raw styling:

```jsx
<PageHeader title="הזמנות" actions={<Button variant="primary" iconStart={<Icon name="plus" size={16}/>}>הזמנה חדשה</Button>} />
<div style={{ display: "grid", gap: "var(--space-4)", padding: "var(--space-6) 0" }}>
  <Card>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "var(--text-identity)", fontWeight: 600, color: "var(--ink)" }}>רבקה כהן</span>
      <StatusChip status="awaiting_approval">ממתין לאישור</StatusChip>
    </div>
  </Card>
</div>
```
