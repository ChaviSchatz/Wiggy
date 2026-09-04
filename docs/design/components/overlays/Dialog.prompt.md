Focused form or confirm — `radius-md`, floating shadow, `rgba(45,24,43,.30)` scrim, Esc and scrim-click to dismiss.

```jsx
<Dialog open={open} onClose={close} title="טיפול בפריט חסר" footer={<><Button>שמירה</Button><Button variant="outline" onClick={close}>ביטול</Button></>}>…</Dialog>
```

A quick glance or a single action belongs in a `Drawer` instead; deep-linkable content belongs on a page.