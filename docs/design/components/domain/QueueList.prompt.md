The My Work spine — one section per queue bucket (now, next, up next, blocked, done), each with the hairline tick.

```jsx
<QueueList sections={[{id:"now",title:"עכשיו",children:<QueueItem …/>}]} />
```

The queue is sprint-agnostic: a closed sprint's unfinished tasks keep showing up.