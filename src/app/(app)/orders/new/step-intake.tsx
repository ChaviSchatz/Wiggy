"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ItemResponse, ResolvedIntakeItem } from "@/lib/work-orders/types";

/**
 * Screen inventory #18 / architecture §6: dynamic render of one intake
 * template's items, driving the same `ItemResponse[]` shape the generator
 * (`src/lib/work-orders/generate.ts`) consumes directly.
 */
export function StepIntake({
  items,
  responses,
  onChange,
  onNext,
  onBack,
}: {
  items: ResolvedIntakeItem[];
  responses: Record<string, ItemResponse>;
  onChange: (responses: Record<string, ItemResponse>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("pages.orders.wizard.intake");

  // Pre-select mandatory/default_selected task_type items the first time
  // this template's items are shown (config keys per architecture §4.3).
  useEffect(() => {
    const missingDefaults = items.filter(
      (item) =>
        item.itemKind === "task_type" &&
        (item.config.mandatory || item.config.default_selected) &&
        responses[item.id] === undefined,
    );
    if (missingDefaults.length === 0) return;

    const next = { ...responses };
    for (const item of missingDefaults) {
      next[item.id] = { itemId: item.id, taskTypeSelected: true };
    }
    onChange(next);
    // Only re-run when the item set itself changes (a new template).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function setResponse(itemId: string, patch: Partial<ItemResponse>) {
    onChange({
      ...responses,
      [itemId]: { ...responses[itemId], itemId, ...patch },
    });
  }

  const visibleItems = items.filter((item) => item.config.visible !== false);

  return (
    <div className="space-y-5">
      {visibleItems.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        visibleItems.map((item) => (
          <IntakeItemField
            key={item.id}
            item={item}
            response={responses[item.id]}
            onFieldValue={(value) =>
              setResponse(item.id, { fieldValue: value })
            }
            onOtherText={(value) => setResponse(item.id, { otherText: value })}
            onTaskTypeSelected={(selected) =>
              setResponse(item.id, { taskTypeSelected: selected })
            }
            onGroupSelectionChange={(ids) =>
              setResponse(item.id, { selectedGroupTaskTypeIds: ids })
            }
          />
        ))
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {t("back")}
        </Button>
        <Button onClick={onNext}>{t("next")}</Button>
      </div>
    </div>
  );
}

function IntakeItemField({
  item,
  response,
  onFieldValue,
  onOtherText,
  onTaskTypeSelected,
  onGroupSelectionChange,
}: {
  item: ResolvedIntakeItem;
  response: ItemResponse | undefined;
  onFieldValue: (value: string) => void;
  onOtherText: (value: string) => void;
  onTaskTypeSelected: (selected: boolean) => void;
  onGroupSelectionChange: (ids: string[]) => void;
}) {
  const t = useTranslations("pages.orders.wizard.intake");

  return (
    <div className="space-y-3 rounded-control border border-line p-4">
      {item.itemKind === "section" ? (
        <div className="space-y-1">
          {item.config.section_title ? (
            <p className="font-medium text-ink">{item.config.section_title}</p>
          ) : null}
          {item.config.help_text ? (
            <p className="text-sm text-muted">{item.config.help_text}</p>
          ) : null}
        </div>
      ) : null}

      {item.itemKind === "field" ? (
        <div className="space-y-1.5">
          <Label htmlFor={`field-${item.id}`}>
            {item.fieldLabel ?? item.fieldKey}
          </Label>
          {item.config.help_text ? (
            <p className="text-sm text-muted">{item.config.help_text}</p>
          ) : null}
          <FieldInput
            id={`field-${item.id}`}
            fieldType={item.fieldType}
            value={response?.fieldValue ?? ""}
            onChange={onFieldValue}
          />
        </div>
      ) : null}

      {item.itemKind === "task_type" && item.taskType ? (
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="accent-mauve-600"
            checked={
              item.config.mandatory
                ? true
                : (response?.taskTypeSelected ?? false)
            }
            disabled={item.config.mandatory}
            onChange={(event) => onTaskTypeSelected(event.target.checked)}
          />
          <span className="text-sm text-ink">
            {item.taskType.name}
            {item.config.mandatory ? (
              <span className="text-muted"> ({t("required")})</span>
            ) : null}
          </span>
        </label>
      ) : null}

      {item.itemKind === "task_group" && item.taskGroupTaskTypes ? (
        <TaskGroupField
          item={item}
          selectedIds={response?.selectedGroupTaskTypeIds ?? []}
          onChange={onGroupSelectionChange}
        />
      ) : null}

      {item.config.allow_other ? (
        <div className="space-y-1.5">
          <Label htmlFor={`other-${item.id}`}>{t("otherLabel")}</Label>
          <Textarea
            id={`other-${item.id}`}
            value={response?.otherText ?? ""}
            onChange={(event) => onOtherText(event.target.value)}
            placeholder={t("otherPlaceholder")}
          />
        </div>
      ) : null}
    </div>
  );
}

function FieldInput({
  id,
  fieldType,
  value,
  onChange,
}: {
  id: string;
  fieldType: string | null;
  value: string;
  onChange: (value: string) => void;
}) {
  if (fieldType === "textarea") {
    return (
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  return (
    <Input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function TaskGroupField({
  item,
  selectedIds,
  onChange,
}: {
  item: ResolvedIntakeItem;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const t = useTranslations("pages.orders.wizard.intake");
  const taskTypes = item.taskGroupTaskTypes ?? [];

  if (item.config.selection_mode === "all") {
    return (
      <p className="text-sm text-muted">
        {t("groupAll", { names: taskTypes.map((tt) => tt.name).join(", ") })}
      </p>
    );
  }

  const isSingle = item.config.selection_mode === "single";

  return (
    <div className="space-y-1.5">
      {taskTypes.map((taskType) => (
        <label
          key={taskType.id}
          className="flex cursor-pointer items-center gap-2"
        >
          <input
            type={isSingle ? "radio" : "checkbox"}
            name={isSingle ? `group-${item.id}` : undefined}
            className="accent-mauve-600"
            checked={selectedIds.includes(taskType.id)}
            onChange={(event) => {
              if (isSingle) {
                onChange(event.target.checked ? [taskType.id] : []);
              } else if (event.target.checked) {
                onChange([...selectedIds, taskType.id]);
              } else {
                onChange(selectedIds.filter((id) => id !== taskType.id));
              }
            }}
          />
          <span className="text-sm text-ink">{taskType.name}</span>
        </label>
      ))}
    </div>
  );
}
