"use client";

import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IntakeItemConfig } from "@/lib/work-orders/types";
import { FIELD_TYPES, parseOptions } from "@/lib/work-definition/field-types";
import { updateTemplateItemAction } from "@/lib/work-definition/item-actions";
import type { BuilderItem } from "@/lib/work-definition/template-items";
import type {
  IntakeItemKind,
  ItemFieldErrors,
} from "@/lib/work-definition/validation";

const SELECT_CLASS =
  "h-[39px] w-full rounded-xs border border-line-strong bg-surface px-3 text-body text-ink focus-visible:border-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100";

function Checkbox({
  name,
  label,
  defaultChecked,
  help,
  onChange,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  help?: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          onChange={(event) => onChange?.(event.target.checked)}
          className="accent-mauve-600"
        />
        <span className="text-body text-ink">{label}</span>
      </label>
      {help ? <p className="text-meta text-muted">{help}</p> : null}
    </div>
  );
}

/**
 * Per-item intake config (screen inventory #52).
 *
 * Renders only the keys valid for this item's kind, so a section never offers
 * `selection_mode`. Checkbox `name`s must match what `readConfig` in
 * item-actions.ts reads, since it tests `formData.get(name) === "on"`.
 */
export function ItemConfigDialog({
  templateId,
  item,
  stages,
  trigger,
}: {
  templateId: string;
  item: BuilderItem;
  stages: { id: string; name: string }[];
  trigger: React.ReactNode;
}) {
  const t = useTranslations("pages.settings.templates.item");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ItemFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const config = (item.config ?? {}) as IntakeItemConfig;
  const kind = item.item_kind as IntakeItemKind;
  const [fieldType, setFieldType] = useState(item.field_type ?? "text");
  const [allowOther, setAllowOther] = useState(Boolean(config.allow_other));

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setErrors({});
      setFormError(undefined);
      setFieldType(item.field_type ?? "text");
      setAllowOther(Boolean(config.allow_other));
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrors({});
    setFormError(undefined);

    startTransition(async () => {
      const result = await updateTemplateItemAction(
        templateId,
        item.id,
        formData,
      );
      if (!result.success) {
        setErrors(result.errors);
        setFormError(result.formError);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* readItemInput branches on this to decide what to validate. */}
          <input type="hidden" name="itemKind" value={kind} />

          {kind === "field" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="item-label">{t("fieldLabel")}</Label>
                <Input
                  id="item-label"
                  name="fieldLabel"
                  defaultValue={item.field_label ?? ""}
                  required
                />
                {errors.fieldLabel ? (
                  <FormMessage variant="error">
                    {t(`errors.${errors.fieldLabel}`)}
                  </FormMessage>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-key">{t("fieldKey")}</Label>
                <Input
                  id="item-key"
                  name="fieldKey"
                  defaultValue={item.field_key ?? ""}
                />
                <p className="text-meta text-muted">{t("fieldKeyHelp")}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-type">{t("fieldType")}</Label>
                <select
                  id="item-type"
                  name="fieldType"
                  value={fieldType}
                  onChange={(event) => setFieldType(event.target.value)}
                  className={SELECT_CLASS}
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`fieldTypes.${type}`)}
                    </option>
                  ))}
                </select>
              </div>

              {fieldType === "select" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="item-options">{t("options")}</Label>
                  <Textarea
                    id="item-options"
                    name="optionsText"
                    defaultValue={parseOptions(item.options).join("\n")}
                  />
                  <p className="text-meta text-muted">{t("optionsHelp")}</p>
                  {errors.options ? (
                    <FormMessage variant="error">
                      {t(`errors.${errors.options}`)}
                    </FormMessage>
                  ) : null}
                </div>
              ) : null}

              <Checkbox
                name="visible"
                label={t("visible")}
                defaultChecked={config.visible}
              />
              <Checkbox
                name="mandatory"
                label={t("mandatory")}
                defaultChecked={config.mandatory}
              />

              <div className="space-y-1.5">
                <Label htmlFor="item-help">{t("helpText")}</Label>
                <Input
                  id="item-help"
                  name="help_text"
                  defaultValue={config.help_text ?? ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-missing">{t("missingItemKind")}</Label>
                <select
                  id="item-missing"
                  name="missing_item_kind"
                  defaultValue={config.missing_item_kind ?? ""}
                  className={SELECT_CLASS}
                >
                  <option value="">{t("missingItemKindNone")}</option>
                  <option value="top">top</option>
                  <option value="skin">skin</option>
                  <option value="material">material</option>
                </select>
                {/* Not obvious from the label: answering the field creates a
                    tracked missing item and surfaces it on the dashboard. */}
                <p className="text-meta text-muted">
                  {t("missingItemKindHelp")}
                </p>
              </div>
            </>
          ) : null}

          {kind === "task_type" ? (
            <>
              <Checkbox
                name="mandatory"
                label={t("mandatory")}
                defaultChecked={config.mandatory}
              />
              <Checkbox
                name="default_selected"
                label={t("defaultSelected")}
                defaultChecked={config.default_selected}
              />
              <Checkbox
                name="generates_runtime_tasks"
                label={t("generatesTasks")}
                defaultChecked={config.generates_runtime_tasks}
                help={t("generatesTasksHelp")}
              />
            </>
          ) : null}

          {kind === "task_group" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="item-selection">{t("selectionMode")}</Label>
                <select
                  id="item-selection"
                  name="selection_mode"
                  defaultValue={config.selection_mode ?? "multi"}
                  className={SELECT_CLASS}
                >
                  {(["single", "multi", "all"] as const).map((mode) => (
                    <option key={mode} value={mode}>
                      {t(`selectionModes.${mode}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-display">{t("displayStyle")}</Label>
                <select
                  id="item-display"
                  name="display_style"
                  defaultValue={config.display_style ?? "checklist"}
                  className={SELECT_CLASS}
                >
                  {(["checklist", "dropdown", "list"] as const).map((style) => (
                    <option key={style} value={style}>
                      {t(`displayStyles.${style}`)}
                    </option>
                  ))}
                </select>
              </div>

              <Checkbox
                name="generates_runtime_tasks"
                label={t("generatesTasks")}
                defaultChecked={config.generates_runtime_tasks}
                help={t("generatesTasksHelp")}
              />
            </>
          ) : null}

          {kind === "section" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="item-section-title">{t("sectionTitle")}</Label>
                <Input
                  id="item-section-title"
                  name="sectionTitle"
                  defaultValue={config.section_title ?? ""}
                  required
                />
                {errors.sectionTitle ? (
                  <FormMessage variant="error">
                    {t(`errors.${errors.sectionTitle}`)}
                  </FormMessage>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-section-help">{t("helpText")}</Label>
                <Input
                  id="item-section-help"
                  name="help_text"
                  defaultValue={config.help_text ?? ""}
                />
              </div>

              <Checkbox
                name="allow_other"
                label={t("allowOther")}
                defaultChecked={config.allow_other}
                onChange={setAllowOther}
              />

              {allowOther ? (
                <div className="space-y-1.5">
                  <Label htmlFor="item-other-stage">{t("otherStage")}</Label>
                  <select
                    id="item-other-stage"
                    name="other_default_work_stage_id"
                    defaultValue={config.other_default_work_stage_id ?? ""}
                    className={SELECT_CLASS}
                  >
                    <option value="">{t("noStage")}</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </>
          ) : null}

          {formError ? (
            <FormMessage variant="error">
              {t(`errors.${formError}`)}
            </FormMessage>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
