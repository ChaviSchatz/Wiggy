# WigFlow — Design Language ("warm operational studio")

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

## Identity & avatar rules (per surface)
Identity text **leads with the customer name** + order code across surfaces. The **avatar** differs
by surface, by intent:

| Surface | Avatar shows | Tap avatar |
|---|---|---|
| **Production board** (task cards) | **Assigned worker** photo | **Reassign** the task |
| **My Work** (worker's own queue) | **Customer** photo *if available* | — |
| **Work-order hub** | **Customer** photo *if available* (+ later CRM profile) | — |

### Seamless avatar fallback (never an empty circle)
- **People without a photo** → deterministic **monogram** (initials) with an auto-picked calm
  palette color (stable per person).
- **Customer-less orders** (internal / display-wig work) → an **order-kind icon** as identity;
  card text = order kind + code.
- The system always renders *something* meaningful — no blank/placeholder circles.

## Notes
- Most customers won't share a photo early; the board therefore centers **worker assignment**, not
  customer faces. Customer photos matter on the hub/CRM, where identity/history is the point.
