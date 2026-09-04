36px transparent icon-only control with a plum glyph and a `mauve-100` hover ground — top-bar and row-level actions.

```jsx
<IconButton icon={<Icon name="message-square" />} label="משוב" />
```

`label` is not optional: every icon-only control is labelled. On tablet surfaces use `Button size="lg"` instead, since 36px is below the 44px touch floor.