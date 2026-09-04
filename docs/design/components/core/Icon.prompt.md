Renders a lucide glyph at 1.5px stroke in currentColor — the only icon primitive; never inline a hand-drawn SVG.

```jsx
<Icon name="plus" size={16} />
```

Direction-encoding names (chevron-left/right, arrow-left/right) must be chosen per writing direction by the caller; thing-encoding names (clock, paperclip, bell) never flip. Icon-only buttons put the label on `IconButton`'s `aria-label`, not here.