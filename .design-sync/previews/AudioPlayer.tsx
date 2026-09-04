import * as React from 'react';
import { AudioPlayer } from 'wiggy-design-system';

export function Default() {
  return (
    <div style={{ maxWidth: 320 }}>
      <AudioPlayer durationLabel="0:58" />
    </div>
  );
}

export function Named() {
  return (
    <div style={{ maxWidth: 320 }}>
      <AudioPlayer durationLabel="0:42" title="הערה קולית — פראדי" />
    </div>
  );
}
