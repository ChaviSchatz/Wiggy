"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import {
  duplicateTemplateAction,
  setTemplateActiveAction,
} from "@/lib/work-definition/actions";
import type { TemplateListItem } from "@/lib/work-definition/templates";
import { TemplateFormDialog } from "./template-form-dialog";

export function TemplateRowActions({
  template,
}: {
  template: TemplateListItem;
}) {
  const t = useTranslations("pages.settings.templates");
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ success: boolean; formError?: string }>,
  ) {
    setFormError(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setFormError(result.formError ?? "generic");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TemplateFormDialog
        template={template}
        trigger={
          <Button size="sm" variant="outline">
            {t("edit")}
          </Button>
        }
      />

      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => duplicateTemplateAction(template.id))}
      >
        {t("duplicate")}
      </Button>

      {/* Deactivating is reversible and never touches existing orders, so it
          needs no confirmation -- unlike removing a builder item. */}
      <Button
        size="sm"
        variant={template.is_active ? "danger-soft" : "outline"}
        disabled={pending}
        onClick={() =>
          run(() => setTemplateActiveAction(template.id, !template.is_active))
        }
      >
        {template.is_active ? t("deactivate") : t("activate")}
      </Button>

      {formError ? (
        <FormMessage variant="error">
          {t(`form.errors.${formError}`)}
        </FormMessage>
      ) : null}
    </div>
  );
}
