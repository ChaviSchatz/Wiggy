"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import type { IntakeItemConfig } from "@/lib/work-orders/types";
import { isFieldType } from "@/lib/work-definition/field-types";
import {
  moveTemplateItemAction,
  removeTemplateItemAction,
} from "@/lib/work-definition/item-actions";
import type { BuilderItem } from "@/lib/work-definition/template-items";
import { ItemConfigDialog } from "./item-config-dialog";

export function ItemList({
  templateId,
  items,
  stages,
}: {
  templateId: string;
  items: BuilderItem[];
  stages: { id: string; name: string }[];
}) {
  const t = useTranslations("pages.settings.templates");

  if (items.length === 0) {
    return (
      <EmptyState
        title={t("builder.emptyTitle")}
        description={t("builder.emptyDescription")}
      />
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <ItemRow
          key={item.id}
          templateId={templateId}
          item={item}
          stages={stages}
          isFirst={index === 0}
          isLast={index === items.length - 1}
        />
      ))}
    </ul>
  );
}

/** What the row shows as the item's identity, per kind. */
function identityOf(item: BuilderItem, config: IntakeItemConfig): string {
  if (item.item_kind === "field") return item.field_label ?? "";
  if (item.item_kind === "section") return config.section_title ?? "";
  return item.referentName ?? "";
}

function ItemRow({
  templateId,
  item,
  stages,
  isFirst,
  isLast,
}: {
  templateId: string;
  item: BuilderItem;
  stages: { id: string; name: string }[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("pages.settings.templates");
  const tItem = useTranslations("pages.settings.templates.item");
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const config = (item.config ?? {}) as IntakeItemConfig;

  function move(direction: "up" | "down") {
    setFormError(undefined);
    startTransition(async () => {
      const result = await moveTemplateItemAction(
        templateId,
        item.id,
        direction,
      );
      if (!result.success) {
        setFormError(result.formError ?? "generic");
        return;
      }
      router.refresh();
    });
  }

  // A short, human summary of the settings that are actually on.
  const summary = [
    item.item_kind === "field" && isFieldType(item.field_type)
      ? tItem(`fieldTypes.${item.field_type}`)
      : null,
    config.mandatory ? tItem("mandatory") : null,
    config.default_selected ? tItem("defaultSelected") : null,
    config.selection_mode
      ? tItem(`selectionModes.${config.selection_mode}`)
      : null,
    config.display_style
      ? tItem(`displayStyles.${config.display_style}`)
      : null,
    config.allow_other ? tItem("allowOther") : null,
    config.missing_item_kind ? tItem("missingItemKind") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="rounded-card border border-line bg-surface p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="neutral">
              {t(`builder.kind.${item.item_kind}`)}
            </Badge>
            <span className="text-identity text-ink">
              {identityOf(item, config)}
            </span>
          </div>
          {summary ? (
            <p className="mt-1 text-meta text-muted">{summary}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ItemConfigDialog
            templateId={templateId}
            item={item}
            stages={stages}
            trigger={
              <Button size="sm" variant="outline">
                {t("edit")}
              </Button>
            }
          />
          <Button
            size="sm"
            variant="outline"
            aria-label={t("builder.moveUp")}
            disabled={isFirst || pending}
            onClick={() => move("up")}
          >
            <ChevronUp className="size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={t("builder.moveDown")}
            disabled={isLast || pending}
            onClick={() => move("down")}
          >
            <ChevronDown className="size-4" aria-hidden />
          </Button>
          <RemoveItemDialog templateId={templateId} itemId={item.id} />
        </div>
      </div>

      {formError ? (
        <div className="mt-2">
          <FormMessage variant="error">
            {tItem(`errors.${formError}`)}
          </FormMessage>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Removing an item changes the *template*, so it confirms -- but the dialog
 * says plainly that existing orders are unaffected, because runtime tasks
 * snapshot everything they need at generation time.
 */
function RemoveItemDialog({
  templateId,
  itemId,
}: {
  templateId: string;
  itemId: string;
}) {
  const t = useTranslations("pages.settings.templates");
  const tItem = useTranslations("pages.settings.templates.item");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function confirm() {
    setFormError(undefined);
    startTransition(async () => {
      const result = await removeTemplateItemAction(templateId, itemId);
      if (!result.success) {
        setFormError(result.formError ?? "generic");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFormError(undefined);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="danger-soft">
          {t("builder.remove")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("builder.removeTitle")}</DialogTitle>
        </DialogHeader>

        <p className="text-body text-ink">{t("builder.removeConfirm")}</p>

        {formError ? (
          <FormMessage variant="error">
            {tItem(`errors.${formError}`)}
          </FormMessage>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("builder.removeCancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            onClick={confirm}
            disabled={pending}
          >
            {t("builder.removeSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
