import * as React from 'react';
import { FileUpload } from 'wiggy-design-system';

export function Default() {
  return (
    <div style={{ maxWidth: 320 }}>
      <FileUpload hint="תמונות, קבצים או הקלטה" />
    </div>
  );
}

export function CustomLabel() {
  return (
    <div style={{ maxWidth: 320 }}>
      <FileUpload label="גרירת תמונת התייחסות" hint="JPG או PNG עד 10MB" accept="image/*" />
    </div>
  );
}
