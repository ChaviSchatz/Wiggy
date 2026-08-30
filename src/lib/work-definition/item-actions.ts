"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { IntakeItemConfig } from "@/lib/work-orders/types";
import { serializeOptions } from "./field-types";
import { defaultConfigFor } from "./item-config";
import { renumberItems } from "./reorder";
import {
  hasItemErrors,
  validateItemInput,
  type IntakeItemKind,
  type ItemFieldErrors,
  type ItemInput,
} from "./validation";

export type ItemActionResult =
  | { success: true }
  | { success: false; errors: ItemFieldErrors; formError?: string };

async function requireWorkDefinitionEditor() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "editWorkDefinition")) return null;
  return user;
}

/** Confirms the template belongs to the caller's tenant before touching items. */
async function ownsTemplate(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  templateId: string,
  businessId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("intake_templates")
    .select("id")
    .eq("id", templateId)
    .eq("business_id", businessId)
    .maybeSingle();
  return Boolean(data);
}

function revalidateBuilder(templateId: string) {
  revalidatePath(`/settings/templates/${templateId}`);
  revalidatePath("/settings/templates");
  revalidatePath("/orders/new");
}

function readItemInput(formData: FormData): ItemInput {
  return {
    itemKind: String(formData.get("itemKind") ?? "field") as IntakeItemKind,
    fieldLabel: String(formData.get("fieldLabel") ?? ""),
    fieldKey: String(formData.get("fieldKey") ?? ""),
    fieldType: String(formData.get("fieldType") ?? "text"),
    optionsText: String(formData.get("optionsText") ?? ""),
    sectionTitle: String(formData.get("sectionTitle") ?? ""),
  };
}

/** Reads the config toggles the dialog submits, per item kind. */
function readConfig(
  formData: FormData,
  kind: IntakeItemKind,
): IntakeItemConfig {
  const flag = (name: string) => formData.get(name) === "on";
  const text = (name: string) =>
    String(formData.get(name) ?? "").trim() || undefined;

  if (kind === "field") {
    const missingKind = text("missing_item_kind");
    return {
      visible: flag("visible"),
      mandatory: flag("mandatory"),
      help_text: text("help_text"),
      missing_item_kind:
        missingKind === "top" ||
        missingKind === "skin" ||
        missingKind === "material"
          ? missingKind
          : undefined,
    };
  }
  if (kind === "task_type") {
    return {
      mandatory: flag("mandatory"),
      default_selected: flag("default_selected"),
      generates_runtime_tasks: flag("generates_runtime_tasks"),
    };
  }
  if (kind === "task_group") {
    const selection = text("selection_mode");
    const display = text("display_style");
    return {
      selection_mode:
        selection === "single" || selection === "multi" || selection === "all"
          ? selection
          : undefined,
      display_style:
        display === "checklist" || display === "dropdown" || display === "list"
          ? display
          : undefined,
      generates_runtime_tasks: flag("generates_runtime_tasks"),
    };
  }
  return {
    section_title: text("sectionTitle"),
    help_text: text("help_text"),
    allow_other: flag("allow_other"),
    other_default_work_stage_id: text("other_default_work_stage_id"),
  };
}

export async function addTemplateItemAction(
  templateId: string,
  formData: FormData,
): Promise<ItemActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const supabase = await createServerSupabaseClient();
  if (!(await ownsTemplate(supabase, templateId, user.businessId))) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  const input = readItemInput(formData);
  const errors = validateItemInput(input);
  if (hasItemErrors(errors)) return { success: false, errors };

  const { data: existing, error: existingError } = await supabase
    .from("intake_template_items")
    .select("sort_order")
    .eq("intake_template_id", templateId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError)
    return { success: false, errors: {}, formError: "generic" };

  const isField = input.itemKind === "field";
  const { error } = await supabase.from("intake_template_items").insert({
    intake_template_id: templateId,
    sort_order: (existing?.sort_order ?? -1) + 1,
    item_kind: input.itemKind,
    task_type_id:
      input.itemKind === "task_type"
        ? String(formData.get("referentId") ?? "")
        : null,
    task_group_id:
      input.itemKind === "task_group"
        ? String(formData.get("referentId") ?? "")
        : null,
    field_key: isField ? input.fieldKey.trim() || null : null,
    field_label: isField ? input.fieldLabel.trim() : null,
    field_type: isField ? input.fieldType : null,
    options: isField ? serializeOptions(input.optionsText) : null,
    // Defaults, not `readConfig`: the add dialog only identifies the item,
    // and reading absent checkboxes would write `visible: false`, which the
    // intake wizard treats as "hide this field" -- so a newly added field
    // would never appear. Tuning happens in the config dialog (#52).
    config: {
      ...defaultConfigFor(input.itemKind),
      ...(input.itemKind === "section"
        ? { section_title: input.sectionTitle.trim() }
        : {}),
    },
  });
  if (error) return { success: false, errors: {}, formError: "generic" };

  revalidateBuilder(templateId);
  return { success: true };
}

export async function updateTemplateItemAction(
  templateId: string,
  itemId: string,
  formData: FormData,
): Promise<ItemActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const supabase = await createServerSupabaseClient();
  if (!(await ownsTemplate(supabase, templateId, user.businessId))) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  const input = readItemInput(formData);
  const errors = validateItemInput(input);
  if (hasItemErrors(errors)) return { success: false, errors };

  const isField = input.itemKind === "field";
  const { data, error } = await supabase
    .from("intake_template_items")
    .update({
      field_key: isField ? input.fieldKey.trim() || null : null,
      field_label: isField ? input.fieldLabel.trim() : null,
      field_type: isField ? input.fieldType : null,
      options: isField ? serializeOptions(input.optionsText) : null,
      config: readConfig(formData, input.itemKind),
    })
    .eq("id", itemId)
    .eq("intake_template_id", templateId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidateBuilder(templateId);
  return { success: true };
}

/**
 * Removes an item. Safe for existing orders: `runtime_tasks.origin_item_id`
 * is `on delete set null` and is written but never read, and runtime tasks
 * snapshot their title/stage/approval at generation (architecture §5.1).
 */
export async function removeTemplateItemAction(
  templateId: string,
  itemId: string,
): Promise<ItemActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const supabase = await createServerSupabaseClient();
  if (!(await ownsTemplate(supabase, templateId, user.businessId))) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  const { data, error } = await supabase
    .from("intake_template_items")
    .delete()
    .eq("id", itemId)
    .eq("intake_template_id", templateId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidateBuilder(templateId);
  return { success: true };
}

/**
 * Moves an item one place. Renumbers the whole list rather than swapping two
 * rows -- see `reorder.ts` for why.
 */
export async function moveTemplateItemAction(
  templateId: string,
  itemId: string,
  direction: "up" | "down",
): Promise<ItemActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const supabase = await createServerSupabaseClient();
  if (!(await ownsTemplate(supabase, templateId, user.businessId))) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  const { data: items, error } = await supabase
    .from("intake_template_items")
    .select("id")
    .eq("intake_template_id", templateId)
    .order("sort_order", { ascending: true });
  if (error) return { success: false, errors: {}, formError: "generic" };

  const ordered = items ?? [];
  const fromIndex = ordered.findIndex((item) => item.id === itemId);
  if (fromIndex === -1) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  const next = renumberItems(ordered, fromIndex, direction);
  // At an edge the list is unchanged; nothing to write.
  if (next === ordered) return { success: true };

  for (let index = 0; index < next.length; index++) {
    const { error: updateError } = await supabase
      .from("intake_template_items")
      .update({ sort_order: index })
      .eq("id", next[index]!.id)
      .eq("intake_template_id", templateId);
    if (updateError) {
      return { success: false, errors: {}, formError: "generic" };
    }
  }

  revalidateBuilder(templateId);
  return { success: true };
}
