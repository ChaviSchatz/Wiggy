The shared filter row for lists and boards: underline tabs (inactive `muted`, active `mauve-600` with a 2px underline) plus optional search.

```jsx
<FilterBar tabs={statusTabs} activeTab={tab} onTabChange={setTab} search={q} onSearchChange={setQ} />
```

Filters are never pills. Sticky it at the top of a long list.