# SectionHeading

Titles a section on a detail surface — a customer profile, an order hub, a drawer body — where the
content sits directly on the page separated by hairlines rather than inside a `Panel`.

Renders the documented Wiggy signature: the title, then an 18×1.5px `--mauve-600` rule at 40%
opacity beneath it. That rule is what stops a hairline-separated page reading as an undifferentiated
column of text.

```jsx
<SectionHeading title="הזמנות פעילות" meta="2" actions={<Button variant="ghost" size="sm">הכול</Button>} />
```

**Use `size="sm"`** to group fields inside a `Dialog`. It drops to a 13px Heebo label and omits the
hairline — a modal is not a page, and an 18px Rubik heading over a pair of inputs is out of scale.

**Do not** put a hairline under every heading on a screen. Two or three per view; past that it stops
being a signal. **Do not** use it inside a `Panel` — `Panel` already carries its own tick.
