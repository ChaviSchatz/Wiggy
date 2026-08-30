"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { File as FileIcon, Mic } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { VoiceRecorderDialog } from "@/components/attachments/voice-recorder-dialog";
import { uploadAttachmentAction } from "@/lib/attachments/actions";
import type { AttachmentWithUrl } from "@/lib/attachments/queries";

/** Files & photos, and audio recordings sections (docs/ui/work-order-hub.md). */
export function AttachmentsSection({
  workOrderId,
  attachments,
}: {
  workOrderId: string;
  attachments: AttachmentWithUrl[];
}) {
  const t = useTranslations("pages.orders.detail.hub.attachments");
  const router = useRouter();
  const [uploadKind, setUploadKind] = useState<
    "file" | "photo" | "voice" | null
  >(null);
  // The voice button records on the device (screen inventory #27); the file
  // picker stays reachable from inside the recorder for browsers that can't
  // record (insecure context, no MediaRecorder).
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | undefined>();
  const [savingRecording, startSaving] = useTransition();

  function handleSaveRecording(file: File) {
    setRecordError(undefined);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("parentType", "work_order");
    formData.set("parentId", workOrderId);
    formData.set("workOrderId", workOrderId);
    formData.set("kind", "voice");

    startSaving(async () => {
      const result = await uploadAttachmentAction(formData);
      if (!result.success) {
        setRecordError(result.error);
        return;
      }
      setRecording(false);
      router.refresh();
    });
  }

  const files = attachments.filter(
    (a) => a.kind === "file" || a.kind === "photo",
  );
  const voice = attachments.filter((a) => a.kind === "voice");

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("filesTitle")}</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadKind("photo")}
            >
              {t("addPhoto")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadKind("file")}
            >
              {t("addFile")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted">{t("filesEmpty")}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {files.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-mauve-100/40 flex aspect-square items-center justify-center overflow-hidden rounded-control border border-line"
                  title={attachment.file_name}
                >
                  {attachment.kind === "photo" && attachment.url ? (
                    <Image
                      src={attachment.url}
                      alt={attachment.file_name}
                      width={120}
                      height={120}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <FileIcon className="size-6 text-muted" aria-hidden />
                  )}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("audioTitle")}</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => {
              setRecordError(undefined);
              setRecording(true);
            }}
          >
            <Mic className="size-4" aria-hidden />
            {t("addVoice")}
          </Button>
        </CardHeader>
        <CardContent>
          {voice.length === 0 ? (
            <p className="text-sm text-muted">{t("audioEmpty")}</p>
          ) : (
            <ul className="space-y-3">
              {voice.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Mic className="size-4 shrink-0 text-muted" aria-hidden />
                  {attachment.url ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <audio
                      controls
                      src={attachment.url}
                      className="h-9 max-w-full"
                    />
                  ) : (
                    <span className="text-muted">{attachment.file_name}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <VoiceRecorderDialog
        open={recording}
        onOpenChange={(open) => {
          setRecording(open);
          if (!open) setRecordError(undefined);
        }}
        onSave={handleSaveRecording}
        onUploadInstead={() => {
          setRecording(false);
          setUploadKind("voice");
        }}
        pending={savingRecording}
        uploadError={recordError}
      />

      <UploadAttachmentDialog
        workOrderId={workOrderId}
        kind={uploadKind}
        onOpenChange={(open) => !open && setUploadKind(null)}
      />
    </>
  );
}

function UploadAttachmentDialog({
  workOrderId,
  kind,
  onOpenChange,
}: {
  workOrderId: string;
  kind: "file" | "photo" | "voice" | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.orders.detail.hub.attachments");
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!kind) return;
    const formData = new FormData(event.currentTarget);
    formData.set("parentType", "work_order");
    formData.set("parentId", workOrderId);
    formData.set("workOrderId", workOrderId);
    formData.set("kind", kind);

    startTransition(async () => {
      const result = await uploadAttachmentAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  const accept =
    kind === "photo" ? "image/*" : kind === "voice" ? "audio/*" : undefined;

  return (
    <Dialog open={kind !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {kind === "photo"
              ? t("addPhoto")
              : kind === "voice"
                ? // Not `addVoice` -- that button now opens the recorder. This
                  // dialog is the file-upload fallback reached from inside it.
                  t("record.uploadTitle")
                : t("addFile")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="attachment-file">{t("fileLabel")}</Label>
            <input
              id="attachment-file"
              name="file"
              type="file"
              accept={accept}
              required
              className="block w-full text-sm text-ink"
            />
          </div>
          {error ? (
            <FormMessage variant="error">
              {t(
                `errors.${error === "fileTooLarge" ? "fileTooLarge" : "generic"}`,
              )}
            </FormMessage>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? t("uploading") : t("upload")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
