A production-board column: 280px (floor 260), `surface-soft` so cards read as `surface` above it, tick in the header.

```jsx
<KanbanColumn title="תפירה" count={6} emptyLabel="אין משימות בשלב זה">
  {tasks.map(t => <WorkCard key={t.id} {...t} />)}
</KanbanColumn>
```

Do not tint the column per stage: a tenant-entered hex carries no contrast guarantee. An empty column states that it is empty — `emptyLabel` renders in place of the cards, so the board never shows a bare frame.
