"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createTemplateAction,
  updateTemplateAction,
} from "@/lib/work-definition/actions";
import type { TemplateListItem } from "@/lib/work-definition/templates";
import { type TemplateFieldErrors } from "@/lib/work-definition/validation";

/**
 * Create / edit an intake template's details (screen inventory #50).
 *
 * `work_order_kind` is a picker over the five code-defined kinds, not free
 * text: the value renders through `t("kind.<value>")` wherever an order has
 * no customer, so an invented one would show as a raw key. The tenant's free
 * text is the template *name*.
 */
export function TemplateFormDialog({
  template,
  trigger,
}: {
  template?: TemplateListItem;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations("pages.settings.templates");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<TemplateFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setErrors({});
      setFormError(undefined);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrors({});
    setFormError(undefined);

    startTransition(async () => {
      const result = template
        ? await updateTemplateAction(template.id, formData)
        : await createTemplateAction(formData);

      if (!result.success) {
        setErrors(result.errors);
        setFormError(result.formError);
        return;
      }

      setOpen(false);
      // A brand-new template has no items yet, so go straight to the builder.
      if (!template && result.templateId) {
        router.push(`/settings/templates/${result.templateId}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" aria-hidden />
            {t("add")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {template ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">{t("form.name")}</Label>
            <Input
              id="template-name"
              name="name"
              defaultValue={template?.name ?? ""}
              required
            />
            {errors.name ? (
              <FormMessage variant="error">
                {t(`form.errors.${errors.name}`)}
              </FormMessage>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-description">
              {t("form.description")}
            </Label>
            <Textarea
              id="template-description"
              name="description"
              defaultValue={template?.description ?? ""}
            />
          </div>

          {formError ? (
            <FormMessage variant="error">
              {t(`form.errors.${formError}`)}
            </FormMessage>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("form.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? t("form.saving") : t("form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
