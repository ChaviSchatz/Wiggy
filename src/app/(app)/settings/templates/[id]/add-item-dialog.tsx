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
import { cn } from "@/lib/utils";
import { FIELD_TYPES } from "@/lib/work-definition/field-types";
import { addTemplateItemAction } from "@/lib/work-definition/item-actions";
import type { CatalogOption } from "@/lib/work-definition/template-items";
import type {
  IntakeItemKind,
  ItemFieldErrors,
} from "@/lib/work-definition/validation";

const SELECT_CLASS =
  "h-[39px] w-full rounded-xs border border-line-strong bg-surface px-3 text-body text-ink focus-visible:border-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100";

const ITEM_KINDS: IntakeItemKind[] = [
  "task_type",
  "task_group",
  "field",
  "section",
];

/**
 * Adds one item to a template's ordered list. The kind is chosen first,
 * because it decides what the rest of the form asks for: a catalog referent
 * for task_type/task_group, field details for field, a title for section.
 */
export function AddItemDialog({
  templateId,
  taskTypes,
  taskGroups,
}: {
  templateId: string;
  taskTypes: CatalogOption[];
  taskGroups: CatalogOption[];
}) {
  const t = useTranslations("pages.settings.templates");
  const tItem = useTranslations("pages.settings.templates.item");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<IntakeItemKind>("field");
  const [fieldType, setFieldType] = useState<string>("text");
  const [errors, setErrors] = useState<ItemFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setKind("field");
      setFieldType("text");
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
      const result = await addTemplateItemAction(templateId, formData);
      if (!result.success) {
        setErrors(result.errors);
        setFormError(result.formError);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  const referents = kind === "task_type" ? taskTypes : taskGroups;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" aria-hidden />
          {t("builder.addItem")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("builder.add.title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="itemKind" value={kind} />

          {/* Radio cards rather than a select: all four kinds and their
              explanations are visible at the moment the choice is made,
              which is the only place a non-technical manager gets taught
              what they mean. */}
          <fieldset>
            <legend className="mb-1.5 text-label text-ink">
              {t("builder.add.chooseKind")}
            </legend>
            <div className="space-y-2">
              {ITEM_KINDS.map((option) => (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-control border p-3 transition-colors",
                    kind === option
                      ? "border-mauve-600 bg-mauve-100"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="item-kind-choice"
                    value={option}
                    checked={kind === option}
                    onChange={() => setKind(option)}
                    className="mt-1 shrink-0 accent-mauve-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-identity text-ink">
                      {t(`builder.kind.${option}`)}
                    </span>
                    <span className="mt-0.5 block text-meta text-muted">
                      {t(`builder.kindHelp.${option}`)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {kind === "task_type" || kind === "task_group" ? (
            <div className="space-y-1.5">
              <Label htmlFor="add-item-referent">
                {t("builder.add.referent")}
              </Label>
              <select
                id="add-item-referent"
                name="referentId"
                className={SELECT_CLASS}
                required
              >
                {referents.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {kind === "field" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="add-item-label">{tItem("fieldLabel")}</Label>
                <Input id="add-item-label" name="fieldLabel" required />
                {errors.fieldLabel ? (
                  <FormMessage variant="error">
                    {tItem(`errors.${errors.fieldLabel}`)}
                  </FormMessage>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-item-key">{tItem("fieldKey")}</Label>
                <Input id="add-item-key" name="fieldKey" />
                <p className="text-meta text-muted">{tItem("fieldKeyHelp")}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-item-type">{tItem("fieldType")}</Label>
                <select
                  id="add-item-type"
                  name="fieldType"
                  value={fieldType}
                  onChange={(event) => setFieldType(event.target.value)}
                  className={SELECT_CLASS}
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {tItem(`fieldTypes.${type}`)}
                    </option>
                  ))}
                </select>
              </div>

              {fieldType === "select" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="add-item-options">{tItem("options")}</Label>
                  <Textarea id="add-item-options" name="optionsText" />
                  <p className="text-meta text-muted">{tItem("optionsHelp")}</p>
                  {errors.options ? (
                    <FormMessage variant="error">
                      {tItem(`errors.${errors.options}`)}
                    </FormMessage>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {kind === "section" ? (
            <div className="space-y-1.5">
              <Label htmlFor="add-item-section">{tItem("sectionTitle")}</Label>
              <Input id="add-item-section" name="sectionTitle" required />
              {errors.sectionTitle ? (
                <FormMessage variant="error">
                  {tItem(`errors.${errors.sectionTitle}`)}
                </FormMessage>
              ) : null}
            </div>
          ) : null}

          {formError ? (
            <FormMessage variant="error">
              {tItem(`errors.${formError}`)}
            </FormMessage>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("builder.add.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? t("builder.add.submitting") : t("builder.add.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
