# WizardStepper

Orientation for a multi-step creation workflow — the New Work Order wizard is the reference.

```jsx
<WizardStepper steps={["לקוחה", "סוג הזמנה", "פרטי הזמנה", "סיכום ואישור"]} current={2} onStepClick={goTo} />
```

Completed steps carry a sage check and are clickable; the current step is a filled plum node with the
plum halo; upcoming steps are a `--line-strong` outline on `--surface`. Same colour logic as
`Stepper`, so the two read as one family.

**Not `Stepper`.** `Stepper` tracks the production stages of an order that already exists: 10px
labels under dot-only nodes, never interactive, tuned to sit inside a drawer. A wizard needs a
legible label, an explicit completed mark, and navigation back into a finished step. Widening
`Stepper` to do both would have made the drawer tracker interactive, which it must not be.

**Placement.** Directly under `PageHeader`, above the step content, full content width. It is one
line tall — do not wrap it in a card, do not give it a background, and never let it grow into a
progress banner.

Only completed steps navigate. Forward jumps are a validation decision the screen owns, not the
stepper.
