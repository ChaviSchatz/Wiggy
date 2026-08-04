"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { TemplateOption } from "./wizard-types";

export function StepTemplate({
  templates,
  value,
  onChange,
  onNext,
  onBack,
}: {
  templates: TemplateOption[];
  value: string | null;
  onChange: (templateId: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("pages.orders.wizard");

  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <p className="text-sm text-muted">{t("template.none")}</p>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <label
              key={template.id}
              className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-3 hover:bg-mauve-100"
            >
              <input
                type="radio"
                name="template-choice"
                checked={value === template.id}
                onChange={() => onChange(template.id)}
                className="mt-1 accent-mauve-600"
              />
              <span>
                <span className="block text-sm font-medium text-ink">
                  {template.name}
                </span>
                {template.description ? (
                  <span className="block text-sm text-muted">
                    {template.description}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {t("back")}
        </Button>
        <Button onClick={onNext} disabled={!value}>
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
