Tablet/mobile navigation — the worker's shell. Active item is a soft `mauve-100` ground with a `mauve-600` label.

```jsx
<BottomNav items={[{id:"my-work",label:"העבודה שלי",icon:"list-checks"},{id:"board",label:"לוח ייצור",icon:"columns-3"}]} activeId="my-work" />
```

Targets never drop below 44px and the bar respects `safe-area-inset-bottom`.