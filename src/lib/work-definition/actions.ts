"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hasTemplateErrors,
  validateTemplateInput,
  type TemplateFieldErrors,
  type TemplateInput,
} from "./validation";

export type TemplateActionResult =
  | { success: true; templateId?: string }
  | { success: false; errors: TemplateFieldErrors; formError?: string };

function readInput(formData: FormData): TemplateInput {
  return {
    name: String(formData.get("name") ?? ""),
    workOrderKind: String(formData.get("workOrderKind") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}

/** The authoritative permission check (RLS only enforces tenant isolation). */
async function requireWorkDefinitionEditor() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "editWorkDefinition")) return null;
  return user;
}

function revalidateTemplateSurfaces(templateId?: string) {
  revalidatePath("/settings/templates");
  if (templateId) revalidatePath(`/settings/templates/${templateId}`);
  // The New Order wizard lists active templates.
  revalidatePath("/orders/new");
}

export async function createTemplateAction(
  formData: FormData,
): Promise<TemplateActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const input = readInput(formData);
  const errors = validateTemplateInput(input);
  if (hasTemplateErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("intake_templates")
    .insert({
      business_id: user.businessId,
      name: input.name.trim(),
      work_order_kind: input.workOrderKind,
      description: input.description.trim() || null,
      // New templates start inactive so a half-built form cannot appear in
      // the New Order wizard before its items exist.
      is_active: false,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { success: false, errors: {}, formError: "generic" };
  }

  revalidateTemplateSurfaces(data.id);
  return { success: true, templateId: data.id };
}

export async function updateTemplateAction(
  id: string,
  formData: FormData,
): Promise<TemplateActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const input = readInput(formData);
  const errors = validateTemplateInput(input);
  if (hasTemplateErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("intake_templates")
    .update({
      name: input.name.trim(),
      work_order_kind: input.workOrderKind,
      description: input.description.trim() || null,
    })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  // PostgREST reports no error when a filtered update matches nothing, so the
  // row count is the only signal that anything changed.
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidateTemplateSurfaces(id);
  return { success: true, templateId: id };
}

/**
 * Activate / deactivate. There is no delete: `work_orders.intake_template_id`
 * is `on delete restrict`, so Postgres refuses to remove any template an
 * order has used, and the migration withholds the grant to match.
 * Deactivating drops it from the New Order wizard (`createWorkOrderAction`
 * rejects `!template.is_active`) while every existing order keeps working,
 * because orders snapshot their intake at generation time.
 */
export async function setTemplateActiveAction(
  id: string,
  isActive: boolean,
): Promise<TemplateActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("intake_templates")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidateTemplateSurfaces(id);
  return { success: true, templateId: id };
}

/**
 * Duplicates a template and all its items. Items reference shared catalog
 * rows (`task_type_id`, `task_group_id`), so nothing needs remapping -- only
 * the parent id changes. The copy lands inactive.
 */
export async function duplicateTemplateAction(
  id: string,
): Promise<TemplateActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data: source, error: sourceError } = await supabase
    .from("intake_templates")
    .select("name, work_order_kind, description")
    .eq("id", id)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (sourceError || !source) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  const { data: copy, error: copyError } = await supabase
    .from("intake_templates")
    .insert({
      business_id: user.businessId,
      name: `${source.name} — עותק`,
      work_order_kind: source.work_order_kind,
      description: source.description,
      is_active: false,
    })
    .select("id")
    .single();
  if (copyError || !copy) {
    return { success: false, errors: {}, formError: "generic" };
  }

  const { data: items, error: itemsError } = await supabase
    .from("intake_template_items")
    .select("*")
    .eq("intake_template_id", id)
    .order("sort_order", { ascending: true });
  if (itemsError) {
    return { success: false, errors: {}, formError: "generic" };
  }

  if (items && items.length > 0) {
    const { error: insertError } = await supabase
      .from("intake_template_items")
      .insert(
        items.map((item, index) => ({
          intake_template_id: copy.id,
          sort_order: index,
          item_kind: item.item_kind,
          task_type_id: item.task_type_id,
          task_group_id: item.task_group_id,
          field_key: item.field_key,
          field_label: item.field_label,
          field_type: item.field_type,
          options: item.options,
          config: item.config,
        })),
      );
    if (insertError) {
      // Don't leave a template whose items only partly copied.
      await supabase.from("intake_templates").delete().eq("id", copy.id);
      return { success: false, errors: {}, formError: "generic" };
    }
  }

  revalidateTemplateSurfaces(copy.id);
  return { success: true, templateId: copy.id };
}
