import * as React from 'react';
import { InlineAlert, Button } from 'wiggy-design-system';

export function Danger() {
  return (
    <InlineAlert tone="danger" title="ההזמנה לא נוצרה" action={<Button variant="ghost" size="sm">ניסיון נוסף</Button>}>
      השרת לא הגיב. הפרטים שהוזנו נשמרו.
    </InlineAlert>
  );
}

export function Sage() {
  return (
    <InlineAlert tone="sage" title="ההזמנה עודכנה בהצלחה">
      כל המשימות סומנו כהושלמו ונשלחה הודעה ללקוחה.
    </InlineAlert>
  );
}

export function Info() {
  return (
    <InlineAlert tone="info" title="שינוי מחיר יחול על הזמנות עתידיות בלבד">
      הזמנות שכבר אושרו לא ישתנו.
    </InlineAlert>
  );
}
