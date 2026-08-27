"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import {
  formatElapsed,
  pickRecordingFormat,
  voiceNoteFileName,
  type RecordingFormat,
} from "@/lib/attachments/recording";

/**
 * Record voice note (screen inventory #27). Records on the device via
 * `MediaRecorder` rather than opening a file picker -- a salon worker taps
 * once and talks.
 *
 * `getUserMedia` only exists in a secure context, so over plain HTTP on a
 * LAN address (a tablet pointed at a dev machine) recording is unavailable
 * by browser policy, not by bug. Every unsupported path therefore offers the
 * file-upload route instead of dead-ending -- which is also why the screen
 * is specified as "Record/upload voice note".
 */

/** Keeps a recording comfortably inside the action's 20MB limit. */
const MAX_DURATION_SECONDS = 5 * 60;

type Phase = "idle" | "recording" | "review";

type UnsupportedReason = "insecureContext" | "unsupported";

/** Why this browser cannot record, or `null` when it can. */
function detectUnsupported(): UnsupportedReason | null {
  if (typeof window === "undefined") return null;
  if (typeof MediaRecorder === "undefined") return "unsupported";
  if (!navigator.mediaDevices?.getUserMedia) {
    // The API is hidden rather than failing when the page isn't a secure
    // context, so an insecure origin is the likelier explanation.
    return window.isSecureContext ? "unsupported" : "insecureContext";
  }
  return null;
}

export function VoiceRecorderDialog({
  open,
  onOpenChange,
  onSave,
  onUploadInstead,
  pending,
  uploadError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (file: File) => void;
  onUploadInstead: () => void;
  pending: boolean;
  uploadError?: string;
}) {
  const t = useTranslations("pages.orders.detail.hub.attachments");
  const tr = useTranslations("pages.orders.detail.hub.attachments.record");

  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hitMaxDuration, setHitMaxDuration] = useState(false);
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(
    null,
  );

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const formatRef = useRef<RecordingFormat | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Stops the mic so the browser's recording indicator actually goes away. */
  const releaseStream = useCallback(() => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const resetAll = useCallback(() => {
    releaseStream();
    chunksRef.current = [];
    setPhase("idle");
    setElapsed(0);
    setError(null);
    setHitMaxDuration(false);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }, [releaseStream]);

  // Closing the dialog mid-recording must not leave the mic live.
  useEffect(() => {
    if (!open) resetAll();
  }, [open, resetAll]);

  // Unmounting mid-recording must not either.
  useEffect(() => releaseStream, [releaseStream]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  async function startRecording() {
    setError(null);
    setHitMaxDuration(false);

    const unsupported = detectUnsupported();
    if (unsupported) {
      setError(unsupported);
      return;
    }

    const format = pickRecordingFormat((type) =>
      MediaRecorder.isTypeSupported(type),
    );
    if (!format) {
      setError("unsupported");
      return;
    }
    formatRef.current = format;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "permissionDenied"
          : name === "NotFoundError"
            ? "noMicrophone"
            : "generic",
      );
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType: format.mimeType });
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const chosen = formatRef.current;
      releaseStream();
      if (!chosen || chunksRef.current.length === 0) {
        setPhase("idle");
        return;
      }
      const blob = new Blob(chunksRef.current, { type: chosen.mimeType });
      const file = new File(
        [blob],
        voiceNoteFileName(new Date(), chosen.extension),
        { type: chosen.mimeType },
      );
      setPreview({ url: URL.createObjectURL(blob), file });
      setPhase("review");
    };

    recorder.start();
    setPhase("recording");
    setElapsed(0);
    tickRef.current = setInterval(() => {
      setElapsed((seconds) => {
        const next = seconds + 1;
        if (next >= MAX_DURATION_SECONDS) {
          setHitMaxDuration(true);
          stopRecording();
        }
        return next;
      });
    }, 1000);
  }

  const errorMessage = error
    ? tr(`errors.${error}` as "errors.generic")
    : uploadError
      ? t(
          `errors.${uploadError === "fileTooLarge" ? "fileTooLarge" : "generic"}`,
        )
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tr("title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {phase === "idle" ? (
            <>
              <Button
                type="button"
                size="lg"
                onClick={startRecording}
                className="gap-2"
              >
                <Mic className="size-5" aria-hidden />
                {tr("start")}
              </Button>
              <p className="text-center text-sm text-muted">{tr("idleHint")}</p>
            </>
          ) : null}

          {phase === "recording" ? (
            <>
              <p
                className="flex items-center gap-2 text-sm text-muted"
                role="status"
                aria-live="polite"
              >
                <span
                  className="size-2.5 animate-pulse rounded-full bg-danger-600"
                  aria-hidden
                />
                {tr("recording")}
              </p>
              <p className="font-display text-3xl tabular-nums text-ink">
                {formatElapsed(elapsed)}
              </p>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={stopRecording}
                className="gap-2"
              >
                <Square className="size-4" aria-hidden />
                {tr("stop")}
              </Button>
            </>
          ) : null}

          {phase === "review" && preview ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={preview.url} className="w-full" />
              <p className="text-sm text-muted">{formatElapsed(elapsed)}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetAll}
              >
                {tr("rerecord")}
              </Button>
            </>
          ) : null}

          {/* Informational, not a failure -- the recording is intact and
              ready to save, so this stays quiet rather than using the
              error/success FormMessage colours. */}
          {hitMaxDuration ? (
            <p className="text-center text-sm text-muted" role="status">
              {tr("maxDurationReached")}
            </p>
          ) : null}
          {errorMessage ? (
            <FormMessage variant="error">{errorMessage}</FormMessage>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onUploadInstead}
          >
            {tr("uploadInstead")}
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            disabled={phase !== "review" || !preview || pending}
            onClick={() => preview && onSave(preview.file)}
          >
            {pending ? tr("saving") : tr("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
