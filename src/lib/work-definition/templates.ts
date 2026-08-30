import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export type IntakeTemplate = Tables<"intake_templates">;

export type TemplateListItem = IntakeTemplate & { itemCount: number };

/**
 * Templates for the settings list (screen inventory #50), with the item count
 * the table shows. Active first, then by name -- matching the staff list.
 */
export async function listIntakeTemplates(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<TemplateListItem[]> {
  const { data: templates, error } = await supabase
    .from("intake_templates")
    .select("*")
    .eq("business_id", businessId)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;

  const rows = templates ?? [];
  if (rows.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("intake_template_items")
    .select("intake_template_id")
    .in(
      "intake_template_id",
      rows.map((t) => t.id),
    );
  if (itemsError) throw itemsError;

  const countByTemplate = new Map<string, number>();
  for (const item of items ?? []) {
    countByTemplate.set(
      item.intake_template_id,
      (countByTemplate.get(item.intake_template_id) ?? 0) + 1,
    );
  }

  return rows.map((template) => ({
    ...template,
    itemCount: countByTemplate.get(template.id) ?? 0,
  }));
}

export async function getIntakeTemplate(
  supabase: SupabaseClient<Database>,
  id: string,
  businessId: string,
): Promise<IntakeTemplate | null> {
  const { data, error } = await supabase
    .from("intake_templates")
    .select("*")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
