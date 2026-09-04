69px white bar over the main column — **not** the full viewport width.

```jsx
<TopBar actions={<><Button iconStart={<Icon name="plus" size={16}/>}>הזמנה חדשה</Button><IconButton icon={<Icon name="message-square"/>} label="משוב" /></>} />
```

Carries actions only: identity is not repeated here. There is no global search — its absence is deliberate.