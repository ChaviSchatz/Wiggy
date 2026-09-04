Striped squared placeholder marking where a real photo would go — **design-system scaffolding, not a product component.**

```jsx
<ImageSlot label="reference photo" size={72} />
```

In the product, a missing image renders nothing (`WorkImage` returns `null`). Use this only in kits and specimens where the shape needs to be legible.