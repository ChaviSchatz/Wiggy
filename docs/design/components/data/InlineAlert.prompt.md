# InlineAlert

A statement about the surface as a whole: a submission that failed, a section left incomplete, a
result confirmed.

```jsx
<InlineAlert tone="danger" title="ההזמנה לא נוצרה" action={<Button variant="ghost" size="sm">ניסיון נוסף</Button>}>
  השרת לא הגיב. הפרטים שהוזנו נשמרו.
</InlineAlert>
```

Built from the `StatusChip` triplet at panel scale: `-100` ground, `-200` border, `-600` title,
`--ink` body, `--radius-xs`. It is deliberately quiet — a fine-bordered tinted strip, not a filled
red banner (§23).

**Why not an existing component.** `FormMessage` speaks for exactly one field and sits under it.
`UndoToast` is transient and bottom-anchored, so it cannot carry a blocking statement the user must
read before acting. `StatusChip` is a word, not a sentence.

**Placement.** Immediately above the content it is about — the wizard footer's error sits above the
footer, a failed submission sits at the top of the step. One per region. If a screen wants three,
the screen has a hierarchy problem.

Field-level validation stays field-level: `FormMessage` under the input, `--danger-500` border,
`aria-invalid`. Use `InlineAlert` for the summary only, and only after a submit attempt.
