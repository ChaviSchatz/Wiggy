# DetailList

Read-only label → value pairs describing one record: a customer's contact information, an order's
summary block, a tenant's settings recap.

```jsx
<DetailList
  columns={2}
  items={[
    { label: "טלפון", value: "052-555-0148", numeric: true },
    { label: "עיר", value: "בני ברק" },
    { label: "כתובת", value: "רחוב רבי עקיבא 42" },
    { label: "לקוחה מאז", value: "03.2024", numeric: true },
  ]}
/>
```

Labels are 12px `--muted`, values 14px `--ink`. Anything compared or read in a column — phones,
dates, codes, counts — passes `numeric` so it sets tabular.

**Use it instead of** a two-column `DataTable` with the header hidden, and instead of disabled
`Input`s. A table compares records across shared columns; this describes one record. A disabled
input says "you could edit this but not now", which is not what a summary means.

**Do not** put actions in it. An editable field belongs in the edit dialog behind the section's
Edit action.

`columns={2}` on a desktop detail column, `columns={1}` below the tablet breakpoint.
