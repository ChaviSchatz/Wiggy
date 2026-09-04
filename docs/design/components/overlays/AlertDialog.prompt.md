Only for destructive or irreversible actions. The confirm button is solid `danger`, and the copy names the consequence.

```jsx
<AlertDialog open={open} title="לבטל את ההזמנה?" description="המשימות שטרם הושלמו יבוטלו. לא ניתן לשחזר." confirmLabel="ביטול הזמנה" onConfirm={cancelOrder} />
```

Everything reversible uses an inline action plus `UndoToast` instead.