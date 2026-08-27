/**
 * Pure helpers for the in-device voice recorder (screen inventory #27,
 * "Record/upload voice note"). Framework- and browser-agnostic on purpose:
 * the React dialog owns the `MediaRecorder` lifecycle, these own the
 * decisions, so the decisions stay unit-testable without faking browser
 * media APIs.
 */

export type RecordingFormat = { mimeType: string; extension: string };

/**
 * Container/codec candidates in preference order. Opus-in-WebM is the small,
 * widely-supported default (Chrome, Edge, Firefox, Android). Safari and iOS
 * record no WebM at all and only offer MP4/AAC, which is why the fallback
 * chain exists rather than a single hardcoded type.
 */
const CANDIDATES: readonly RecordingFormat[] = [
  { mimeType: "audio/webm;codecs=opus", extension: "webm" },
  { mimeType: "audio/webm", extension: "webm" },
  // AAC in an MP4 container; `.m4a` is its audio-only extension, so players
  // and mobile OSes treat the result as a voice note rather than a video.
  { mimeType: "audio/mp4", extension: "m4a" },
  { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
];

/**
 * The first candidate this browser can actually record, or `null` when it can
 * record none of them — in which case the dialog falls back to file upload.
 * Takes `MediaRecorder.isTypeSupported` as an argument instead of reaching
 * for the global, so the choice is testable per-browser.
 */
export function pickRecordingFormat(
  isTypeSupported: (type: string) => boolean,
): RecordingFormat | null {
  return CANDIDATES.find((c) => isTypeSupported(c.mimeType)) ?? null;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * A sortable, sanitizer-safe name for a recording, in the device's local
 * time (see the test for why local rather than UTC). Deliberately contains
 * only `[a-z0-9.-]` so `uploadAttachmentAction`'s sanitizer passes it
 * through unchanged.
 */
export function voiceNoteFileName(now: Date, extension: string): string {
  const date = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-");
  const time = [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
  return `voice-note-${date}-${time}.${extension}`;
}

/** `m:ss` counter for the recording indicator; minutes are not capped. */
export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${pad(seconds)}`;
}
