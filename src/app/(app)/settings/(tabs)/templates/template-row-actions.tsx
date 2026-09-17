"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { FormMessage } from "@/components/ui/form-message";
import { IconButton } from "@/components/ui/icon-button";
import { MenuItem } from "@/components/ui/menu-item";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ success: boolean; formError?: string }>,
  ) {
    setFormError(undefined);
    setMenuOpen(false);
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
    <div className="flex items-center justify-end gap-0.5">
      <TemplateFormDialog
        template={template}
        trigger={
          <IconButton
            dense
            icon={<Pencil className="size-4" aria-hidden />}
            label={t("edit")}
          />
        }
      />

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <IconButton
            dense
            icon={<MoreHorizontal className="size-[18px]" aria-hidden />}
            label={t("moreActions")}
          />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 p-1.5">
          <MenuItem
            disabled={pending}
            onClick={() => run(() => duplicateTemplateAction(template.id))}
          >
            {t("duplicate")}
          </MenuItem>
          {/* Deactivating is reversible and never touches existing orders, so
              it needs no confirmation -- unlike removing a builder item. */}
          <MenuItem
            tone={template.is_active ? "danger" : "default"}
            disabled={pending}
            onClick={() =>
              run(() =>
                setTemplateActiveAction(template.id, !template.is_active),
              )
            }
          >
            {template.is_active ? t("deactivate") : t("activate")}
          </MenuItem>
        </PopoverContent>
      </Popover>

      {formError ? (
        <FormMessage variant="error">
          {t(`form.errors.${formError}`)}
        </FormMessage>
      ) : null}
    </div>
  );
}
