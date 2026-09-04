The action primitive — plum `primary` for the one accent per view, `soft` for a secondary in-context action, `danger` only inside a confirming dialog.

```jsx
<Button variant="primary" iconStart={<Icon name="plus" size={16} />}>הזמנה חדשה</Button>
<Button variant="outline">ביטול</Button>
<Button variant="danger-soft">מחיקה</Button>
```

Done = primary, Start = secondary (`outline`). Use `lg` (44px) on any worker-facing or tablet surface. `danger-soft` is the trigger in context; solid `danger` is the confirm inside an AlertDialog.