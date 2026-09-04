Wraps every control so label, help text and error occupy fixed positions.

```jsx
<FormField label="דוא״ל" error={errors.email} required><Input type="email" invalid={!!errors.email} /></FormField>
```

Validation fires on blur and on submit, and the message appears next to the control that produced it.