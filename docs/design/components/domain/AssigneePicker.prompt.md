Reassign a task — rows at 44px with the worker's circular avatar, plus an explicit unassigned row.

```jsx
<AssigneePicker staff={staff} value={task.assigneeId} onChange={reassign} />
```

Mount it in a `Popover` from the card avatar or in the peek footer. Reassignment is optimistic with an `UndoToast`.