`h1` at `text-page` with an optional `text-meta` subtitle and an inline-end actions slot.

```jsx
<PageHeader title="לוח ייצור" subtitle="24 משימות פעילות" actions={<Button variant="soft">סינון</Button>} />
```

**Every** page title goes through this — including the sprint board and the work-order hub. A hand-rolled `<h1>` is a bug.