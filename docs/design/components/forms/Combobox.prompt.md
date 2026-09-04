Type-ahead single choice for long lists — the customer picker in the New Order wizard.

```jsx
<Combobox options={customers} value={customerId} onChange={setCustomerId} placeholder="חיפוש לקוחה" />
```

Search is debounced by the caller; the list never goes blank without an empty label.