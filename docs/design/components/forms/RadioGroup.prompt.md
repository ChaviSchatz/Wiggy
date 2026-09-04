Two to four mutually exclusive choices, one per row at 44px — safe on a tablet. Selected row gets the plum border and `mauve-100` ground.

```jsx
<RadioGroup name="urgency" options={urgencyOptions} value={urgency} onChange={setUrgency} />
```