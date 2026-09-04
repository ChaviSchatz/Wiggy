The authenticated frame: side nav, then a main column holding the top bar, the page, and (on tablet) the bottom nav.

```jsx
<AppShell sideNav={<SideNav …/>} topBar={<TopBar …/>}><PageHeader …/>…</AppShell>
```

Auth screens do not use this shell — they are a centred card on `bg` (archetype I).