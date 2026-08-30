"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ItemResponse, ResolvedIntakeItem } from "@/lib/work-orders/types";

/**
 * Renders one intake-template item as the customer-facing form control
 * (architecture §6, screen inventory #18).
 *
 * Shared by two screens on purpose:
 *  - the New Order wizard renders it live, with responses and handlers;
 *  - the template builder (screen #51) renders it `readOnly`, so the
 *    "preview" *is* the form rather than a second drawing of it.
 *
 * Keeping one component is what makes the builder's preview truthful. A
 * separate preview renderer would drift from the real form the moment either
 * side changed -- the same failure mode `field-types.ts` exists to prevent.
 *
 * In `readOnly` mode every control is disabled and no handler fires; callers
 * may omit the handlers entirely.
 */

const SELECT_CLASS =
  "h-[39px] w-full rounded-xs border border-line-strong bg-surface px-3 text-body text-ink focus-visible:border-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100 disabled:cursor-not-allowed disabled:opacity-70";

export type IntakeItemFieldProps = {
  item: ResolvedIntakeItem;
  response?: ItemResponse | undefined;
  /** Inert preview: controls render but never change (builder). */
  readOnly?: boolean;
  /** Omit the frame when the caller supplies its own (builder row). */
  bare?: boolean;
  onFieldValue?: (value: string) => void;
  onOtherText?: (value: string) => void;
  onTaskTypeSelected?: (selected: boolean) => void;
  onGroupSelectionChange?: (ids: string[]) => void;
};

export function IntakeItemField({
  item,
  response,
  readOnly = false,
  bare = false,
  onFieldValue,
  onOtherText,
  onTaskTypeSelected,
  onGroupSelectionChange,
}: IntakeItemFieldProps) {
  const t = useTranslations("pages.orders.wizard.intake");

  const body = (
    <>
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
            options={item.options}
            value={response?.fieldValue ?? ""}
            readOnly={readOnly}
            onChange={(value) => onFieldValue?.(value)}
          />
        </div>
      ) : null}

      {item.itemKind === "task_type" && item.taskType ? (
        <label
          className={cn(
            "flex items-center gap-2",
            !readOnly && !item.config.mandatory && "cursor-pointer",
          )}
        >
          <input
            type="checkbox"
            className="accent-mauve-600"
            checked={
              item.config.mandatory
                ? true
                : (response?.taskTypeSelected ?? false)
            }
            disabled={readOnly || item.config.mandatory}
            onChange={(event) => onTaskTypeSelected?.(event.target.checked)}
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
          readOnly={readOnly}
          onChange={(ids) => onGroupSelectionChange?.(ids)}
        />
      ) : null}

      {item.config.allow_other ? (
        <div className="space-y-1.5">
          <Label htmlFor={`other-${item.id}`}>{t("otherLabel")}</Label>
          <Textarea
            id={`other-${item.id}`}
            value={response?.otherText ?? ""}
            disabled={readOnly}
            onChange={(event) => onOtherText?.(event.target.value)}
            placeholder={t("otherPlaceholder")}
          />
        </div>
      ) : null}
    </>
  );

  if (bare) return <div className="space-y-3">{body}</div>;
  return (
    <div className="space-y-3 rounded-control border border-line p-4">
      {body}
    </div>
  );
}

function FieldInput({
  id,
  fieldType,
  options,
  value,
  readOnly,
  onChange,
}: {
  id: string;
  fieldType: string | null;
  options: string[];
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("pages.orders.wizard.intake");

  // A boolean field stores the affirmative *label* rather than "true": the
  // value is snapshotted verbatim into `intake_responses` and shown on the hub
  // (and the generator only cares whether it's non-empty -- §6.5).
  if (fieldType === "boolean") {
    return (
      <label
        className={cn("flex items-center gap-2", !readOnly && "cursor-pointer")}
      >
        <input
          id={id}
          type="checkbox"
          className="accent-mauve-600"
          checked={value.trim().length > 0}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.checked ? t("yes") : "")}
        />
        <span className="text-sm text-ink">{t("yes")}</span>
      </label>
    );
  }

  if (fieldType === "select") {
    // The chosen label snapshots into `intake_responses` verbatim, the same
    // way a boolean stores its affirmative label rather than `true`.
    return (
      <select
        id={id}
        value={value}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">{t("selectNone")}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (fieldType === "textarea") {
    return (
      <Textarea
        id={id}
        value={value}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  // Deliberate fallback: the builder can no longer create an unrecognised
  // field_type, but a pre-existing row must still render rather than crash.
  return (
    <Input
      id={id}
      value={value}
      disabled={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function TaskGroupField({
  item,
  selectedIds,
  readOnly,
  onChange,
}: {
  item: ResolvedIntakeItem;
  selectedIds: string[];
  readOnly: boolean;
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
          className={cn(
            "flex items-center gap-2",
            !readOnly && "cursor-pointer",
          )}
        >
          <input
            type={isSingle ? "radio" : "checkbox"}
            name={isSingle ? `group-${item.id}` : undefined}
            className="accent-mauve-600"
            checked={selectedIds.includes(taskType.id)}
            disabled={readOnly}
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
