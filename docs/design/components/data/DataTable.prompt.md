The list surface for orders, customers and missing items — flat, dense, `text-start`, hover tint on `mauve-100`.

```jsx
<DataTable columns={orderColumns} rows={orders} onRowClick={openOrder} />
```

No per-row cards and no vertical rules. Mark numeric columns so codes, dates and counts line up.