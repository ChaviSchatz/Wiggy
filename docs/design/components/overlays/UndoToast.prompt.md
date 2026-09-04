The counterpart to every optimistic inline action: state changed, here is one short window to undo it.

```jsx
<UndoToast open={!!lastAction} message="המשימה סומנה כהושלמה" onAction={undo} />
```

This is what replaces a confirmation prompt on everyday actions.