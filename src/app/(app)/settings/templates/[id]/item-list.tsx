"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Heading,
  HelpCircle,
  ListChecks,
  SquareCheck,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { IntakeItemField } from "@/components/intake/intake-item-field";
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
import type {
  IntakeItemConfig,
  ResolvedIntakeItem,
} from "@/lib/work-orders/types";
import { parseOptions } from "@/lib/work-definition/field-types";
import {
  moveTemplateItemAction,
  removeTemplateItemAction,
} from "@/lib/work-definition/item-actions";
import { itemSummary } from "@/lib/work-definition/item-summary";
import type { BuilderItem } from "@/lib/work-definition/template-items";
import type { IntakeItemKind } from "@/lib/work-definition/validation";
import { ItemConfigDialog } from "./item-config-dialog";

const KIND_ICONS: Record<IntakeItemKind, LucideIcon> = {
  section: Heading,
  field: HelpCircle,
  task_type: SquareCheck,
  task_group: ListChecks,
};

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
    <>
      <p className="mb-3 text-meta text-muted">{t("builder.previewNote")}</p>
      <ul className="space-y-3">
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
    </>
  );
}

/**
 * Adapts a builder row to the shape the shared intake renderer expects, so the
 * preview is literally the customer-facing component rather than a redraw of
 * it. `taskType`/`taskGroupTaskTypes` carry only what the control displays --
 * the name -- since nothing else is rendered.
 */
function toResolvedItem(item: BuilderItem): ResolvedIntakeItem {
  const config = (item.config ?? {}) as IntakeItemConfig;
  const name = item.referentName ?? "";

  return {
    id: item.id,
    sortOrder: item.sort_order,
    itemKind: item.item_kind as ResolvedIntakeItem["itemKind"],
    fieldKey: item.field_key,
    fieldLabel: item.field_label,
    fieldType: item.field_type,
    options: parseOptions(item.options),
    // A hidden field still previews here: the builder's job is to show what
    // the template contains, and the meta line says it won't appear.
    config: { ...config, visible: true },
    taskType: item.task_type_id
      ? ({ id: item.task_type_id, name } as ResolvedIntakeItem["taskType"])
      : null,
    taskGroupTaskTypes: item.task_group_id
      ? (item.groupTaskTypes ?? []).map(
          (tt) => ({ id: tt.id, name: tt.name }) as never,
        )
      : null,
  };
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
  const tSummary = useTranslations("pages.settings.templates.summary");
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const config = (item.config ?? {}) as IntakeItemConfig;
  const kind = item.item_kind as IntakeItemKind;
  const Icon = KIND_ICONS[kind];
  const summary = itemSummary(kind, config);

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

  return (
    <li className="rounded-card border border-line bg-surface p-4">
      {/* Wraps rather than clipping: on a tablet the four controls do not fit
          beside the chip, and the salon works on tablets. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-meta text-muted">
          <Icon className="size-4 shrink-0" aria-hidden />
          {t(`builder.kind.${kind}`)}
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
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

      {/* The preview *is* the customer-facing component, rendered inert. */}
      <IntakeItemField item={toResolvedItem(item)} readOnly bare />

      {summary.length > 0 ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta">
          {summary.map((entry) => (
            <span
              key={entry.messageKey}
              className={
                entry.tone === "warning"
                  ? "flex items-center gap-1 text-peach-500"
                  : "text-muted"
              }
            >
              {entry.tone === "warning" ? (
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              ) : null}
              {tSummary(entry.messageKey)}
            </span>
          ))}
        </p>
      ) : null}

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
