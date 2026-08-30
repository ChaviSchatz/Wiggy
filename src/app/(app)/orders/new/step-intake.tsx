"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { IntakeItemField } from "@/components/intake/intake-item-field";
import { Button } from "@/components/ui/button";
import type { ItemResponse, ResolvedIntakeItem } from "@/lib/work-orders/types";

/**
 * Screen inventory #18 / architecture §6: dynamic render of one intake
 * template's items, driving the same `ItemResponse[]` shape the generator
 * (`src/lib/work-orders/generate.ts`) consumes directly.
 *
 * The per-item rendering lives in `@/components/intake/intake-item-field`
 * because the template builder (screen #51) renders the very same component
 * read-only as its preview -- one definition, so the builder cannot show a
 * form that differs from the one the customer fills in.
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
