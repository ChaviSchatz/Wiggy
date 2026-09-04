The single mapping from domain status to colour: `-100` ground, `-600` label, `-500` dot, `radius-full`, 12px.

```jsx
<StatusChip status="awaiting_approval">ממתין לאישור</StatusChip>
<StatusChip status="in_progress">בעבודה</StatusChip>
```

Never pass a colour from a call site, and never render a chip for "normal" urgency — two levels plus blocked, and the default renders nothing (ADR 0012).