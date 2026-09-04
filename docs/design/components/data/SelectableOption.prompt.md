# SelectableOption

One operational choice in a list of choices: a customer search result, an intake template, any
configuration-driven option list.

```jsx
<SelectableOption
  selected={id === picked}
  onSelect={() => pick(id)}
  title="רבקה כהן"
  meta="052-555-0148"
  description="בני ברק"
  trailing="6 הזמנות"
/>
```

Selected is a `--mauve-600` outline on a `--mauve-100` wash with a plum radio mark — the same
selected state `RadioGroup` uses. It is never a filled plum block; §23 holds here too.

**Not `RadioGroup`.** That is a compact single-line control for a small fixed set written into the
markup. This carries an identity line, quiet metadata and a trailing value, and it is what a list
that comes from configuration or from search results renders into. Stack them with an 8px gap in a
`role="listbox"` container.

**Not a card.** No shadow, `--radius-xs`, one border. If an option needs an image, a status chip and
three metrics, the screen is browsing products, not making an operational selection — rethink that
before reaching for a bigger option.

`indicator="check"` for multi-select. `minHeight: 44` is deliberate: these lists are used on tablets.
