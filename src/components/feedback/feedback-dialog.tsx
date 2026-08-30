"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedbackAction } from "@/lib/feedback/actions";
import {
  FEEDBACK_KINDS,
  type FeedbackFieldErrors,
} from "@/lib/feedback/validation";

/**
 * Submit feedback (screen inventory #58): a global dialog, available to every
 * role from the top bar (and the tablet bottom bar). The current path travels
 * with the submission as triage context.
 */
export function FeedbackDialog({ trigger }: { trigger: React.ReactNode }) {
  const t = useTranslations("pages.feedback");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setErrors({});
      setFormError(undefined);
      setSubmitted(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrors({});
    setFormError(undefined);

    startTransition(async () => {
      const result = await submitFeedbackAction(formData);
      if (!result.success) {
        setErrors(result.errors);
        setFormError(result.formError);
        return;
      }
      setSubmitted(true);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4">
            <FormMessage variant="success">{t("thanks")}</FormMessage>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">{t("close")}</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {formError ? (
              <FormMessage variant="error">
                {t(`errors.${formError}`)}
              </FormMessage>
            ) : null}
            <input type="hidden" name="pagePath" value={pathname} />

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">
                {t("kindLabel")}
              </legend>
              <div className="flex flex-wrap gap-4">
                {FEEDBACK_KINDS.map((kind, index) => (
                  <label
                    key={kind}
                    className="flex cursor-pointer items-center gap-2 text-sm text-ink"
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={kind}
                      defaultChecked={index === 0}
                      className="accent-mauve-600"
                    />
                    {t(`kind.${kind}`)}
                  </label>
                ))}
              </div>
              {errors.kind ? (
                <p className="text-sm text-danger-600">
                  {t("errors.kindInvalid")}
                </p>
              ) : null}
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="feedback-message">{t("messageLabel")}</Label>
              <Textarea
                id="feedback-message"
                name="message"
                rows={5}
                placeholder={t("messagePlaceholder")}
                required
              />
              {errors.message ? (
                <p className="text-sm text-danger-600">
                  {t(
                    errors.message === "tooLong"
                      ? "errors.messageTooLong"
                      : "errors.messageRequired",
                  )}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? t("sending") : t("send")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
