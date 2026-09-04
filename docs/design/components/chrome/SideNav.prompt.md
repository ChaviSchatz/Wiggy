The dark plum 228px navigation — the most recognisable element of the product. Brand over a divider at the top, current user over a divider at the bottom.

```jsx
<SideNav items={navItems} activeId="board" onSelect={setScreen} user={{ name: "פראדי", role: "מנהלת" }} />
```

Active is a `sidebar-active` ground — no coloured edge bar. Desktop only (`≥lg`); below that the `BottomNav` takes over. In RTL it sits on the right, by writing direction, not by a `right` rule.