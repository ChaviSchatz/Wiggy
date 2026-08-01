# WigFlow — Work-Order Hub (the central screen)

> The unified screen for a single order. Presentation is **hybrid**: inline board actions +
> quick-view peek + a full-page route. Identity/media rules per `docs/ui/design-language.md`.

## Presentation (hybrid)
1. **Board card (inline):** the common **primary action (Done/Start)** is on the card itself — no
   drawer needed for the everyday action. Worker avatar (circular) → reassign.
2. **Quick-view peek:** tapping the card body opens a **drawer/popup** — compact: identity (text),
   progress stepper, **reference photos (squared)**, key details, and quick actions. Dismissible
   (tap-away / Esc) → back to the board with zero navigation cost.
3. **Full-page hub:** "open full order" navigates to a **full-page route** (deep-linkable,
   printable) with the complete content below.

## Navigation (least-clicks)
- **One-click return to the board** from the full page: explicit **"← back to production board"**,
  plus the persistent nav (Board) always returns in one click. The peek is dismissible.
- Optimize for non-technical users: minimal clicks, obvious back paths.

## Full-page content (from the reference comp)
- **Header / identity:** customer **name** (large, text — no avatar), order code, dates, contact
  actions (phone/WhatsApp/email), status chip (e.g. urgent), **back-to-board**.
- **Progress stepper:** the order's stages, current stage highlighted.
- **Next-action card:** the single primary action for the current step (e.g. `סיום צביעה`) +
  update-status.
- **Reference photos:** **squared** thumbnails (style/color), only when present; "+N" overflow.
- **Tasks & stages:** task list with **circular worker avatars**, status, dates; add task.
- **Notes:** per-stage/order notes; add note.
- **Files & photos:** attachments (squared); add file.
- **Audio recordings:** intake voice notes player.
- **Warnings / missing:** e.g. missing top/skin alerts (links to `missing_items`).
- **History / activity:** from the unified `activity` stream.
- **General details:** status, dates, price, key fields.
- **Utilities:** quick-actions menu (⋮), print, edit (incl. edit-intake, audited).

## Notes
- The board/queue remain **task-centric** (ADR 0010); the hub is the **order-level** unification.
- The "next action" reflects the current active/available task; with a manual availability override
  more than one task may be active — surface each active task's action in context.
