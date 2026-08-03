# Wiggy — Design Language ("warm operational studio")

> Direction for the look, feel, and identity patterns. Hebrew-first / RTL. The reference comps are
> **inspiration, not a fixed template**. Final values are tuned in the build (shadcn/ui + Tailwind
> tokens).

## Intent
Human, calm, professional, friendly — a *salon production studio*, not a generic AI/SaaS or
corporate tool. Never childish, decorative, or sterile.

## Palette (roles; exact hex tuned in build)
- **Warm white** — app background / surfaces (not pure `#fff`).
- **Muted mauve** — primary brand + primary actions.
- **Sage** — secondary / positive (e.g. done/complete accents).
- **Peach** — warm accent / gentle attention (urgent, highlights).
- **Soft neutrals** — text, lines, muted chips.
Keep contrast accessible; warmth comes from hue, not low contrast.

## Typography
Hebrew-first stack: **Heebo / Rubik / Assistant**. Clear hierarchy; comfortable line-height for
Hebrew; numerals aligned for codes/times.

## Shape & components
- Generous **rounded corners**, **soft cards**, gentle shadows.
- **Consistent rounded buttons.** Action hierarchy: **Done = primary**, **Start = secondary**, with
  a short **Undo** after state changes.
- Chips for status/stage; calm, low-noise.
- **RTL:** logical CSS only (`ps/pe`, `ms/me`, `text-start/end`).

## Identity & media rules (revised)
**Identity text leads with the customer name + order code** on every surface. There are **two
visually distinct media types that must never be conflated:**

### Worker avatars — circular
- **Circular, profile-style.** Show the **assigned worker** on production-board task cards and task
  lists.
- **Tap a board avatar → reassign** the task.
- Fallback: deterministic **monogram** (initials, stable calm color). Workers always render an
  avatar (photo or monogram), since we always know the worker.

### Client identity — text only (no avatar)
- **No client avatar and no initials fallback.** Most clients have no photo, so an avatar circle
  would just add empty space. Client identity = **name (+ order code) as text**.
- Customer-less orders (internal / display-wig): identity = **order kind + code** (no avatar).

### Reference / work photos — squared, only when present
- Style/color/reference images live on the order as **attachments**; their purpose is **work
  reference** ("what am I making"), *not* personal identity.
- Rendered as **squared / rounded-rect thumbnails**, **only when they exist** (no placeholder), and
  **clearly distinct in shape** from the circular worker avatars so the two are never mistaken.
- Shown on the work-order quick-view peek, the full hub, and — as work reference — on My Work task
  cards when available.
