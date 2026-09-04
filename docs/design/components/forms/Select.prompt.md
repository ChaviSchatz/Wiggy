The single-choice control — 39px trigger, floating list at `radius-md` with the overlay shadow, selected row on `mauve-100`.

```jsx
<Select options={stages} value={stage} onChange={setStage} />
```

Also renders intake fields of `field_type: "select"`. A native `<select>` with a class string is not acceptable.