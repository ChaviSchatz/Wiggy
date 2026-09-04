The single task card. `board` for triage (textual, no photo), `planning` for sprint lanes (reorder buttons instead of Start/Done), `queue` for the tablet (44px targets, larger avatar, reference photo).

```jsx
<WorkCard variant="board" customerName="רבקה כהן" orderCode="#1041" taskName="תפירת בסיס"
          status="in_progress" statusLabel="בביצוע" urgent due="12.09" assignee="שירה לוי" onDone={done} />
```

Slot order is fixed: identity + urgency star + code, task title, then a footer of assignee / due / state. Done is soft-plum and Start is outline, both inline and both paired with an `UndoToast`. The `StatusChip` is the card's state vocabulary: it renders whenever `status` is set and the action sits beside it, because "בביצוע" and "ממתין לאישור" are not recoverable from a button label. Pass no `status` where the card should read as action-only. Urgency is a filled `danger-500` star — never a chip, and never on a normal-urgency card. Blocked tasks come back at reduced opacity with a dashed edge and a Lock chip, and `onUnlock` is passed only for roles that hold the override.

Never render a photo, a template name, a stage name or an overflow menu on `variant="board"`.
