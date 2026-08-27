import { describe, expect, it } from "vitest";

import {
  formatElapsed,
  pickRecordingFormat,
  voiceNoteFileName,
} from "./recording";

/** Stands in for `MediaRecorder.isTypeSupported` on a given browser. */
function supports(...supported: string[]) {
  return (type: string) => supported.includes(type);
}

describe("pickRecordingFormat", () => {
  it("prefers Opus-in-WebM when the browser offers it", () => {
    const format = pickRecordingFormat(
      supports("audio/webm;codecs=opus", "audio/webm", "audio/mp4"),
    );

    expect(format).toEqual({
      mimeType: "audio/webm;codecs=opus",
      extension: "webm",
    });
  });

  it("falls back to mp4 on Safari, which supports no WebM at all", () => {
    const format = pickRecordingFormat(supports("audio/mp4"));

    // Safari records AAC in an MP4 container -- `.m4a` is the audio-only
    // extension for it, so players and the OS treat it as a voice note.
    expect(format).toEqual({ mimeType: "audio/mp4", extension: "m4a" });
  });

  it("returns null when the browser supports none of the candidates", () => {
    expect(pickRecordingFormat(supports())).toBeNull();
  });
});

describe("voiceNoteFileName", () => {
  it("timestamps the recording so a day's notes sort in order", () => {
    // Built and read in local time: the recording happens on the device, so
    // the name should match the clock the person holding it can see. Both
    // sides are local, so this asserts the same thing in any timezone.
    const name = voiceNoteFileName(new Date(2026, 7, 27, 20, 15, 9), "webm");

    expect(name).toBe("voice-note-2026-08-27-201509.webm");
  });

  it("zero-pads every part so names sort lexicographically", () => {
    const name = voiceNoteFileName(new Date(2026, 0, 2, 3, 4, 5), "m4a");

    expect(name).toBe("voice-note-2026-01-02-030405.m4a");
  });

  it("produces a name the upload action's sanitizer leaves intact", () => {
    // uploadAttachmentAction strips anything outside [a-zA-Z0-9._-]; a raw
    // ISO string would lose its colons and shift the characters.
    const name = voiceNoteFileName(new Date(2026, 0, 2, 3, 4, 5), "m4a");

    expect(name).toBe(name.replace(/[^a-zA-Z0-9._-]/g, "_"));
  });
});

describe("formatElapsed", () => {
  it("pads seconds against the minute", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(9)).toBe("0:09");
    expect(formatElapsed(65)).toBe("1:05");
  });

  it("keeps counting past ten minutes without truncating", () => {
    expect(formatElapsed(600)).toBe("10:00");
  });
});
