import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export type IntakeTemplateItem = Tables<"intake_template_items">;

export type BuilderItem = IntakeTemplateItem & {
  /** Catalog name for task_type/task_group items; null for field/section. */
  referentName: string | null;
};

/**
 * A template's items in order, each resolved to the catalog name the builder
 * row displays. Batched rather than embedded, matching
 * `src/lib/board/queries.ts`.
 */
export async function listTemplateItems(
  supabase: SupabaseClient<Database>,
  templateId: string,
): Promise<BuilderItem[]> {
  const { data: items, error } = await supabase
    .from("intake_template_items")
    .select("*")
    .eq("intake_template_id", templateId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const rows = items ?? [];
  const taskTypeIds = Array.from(
    new Set(
      rows.map((i) => i.task_type_id).filter((id): id is string => Boolean(id)),
    ),
  );
  const taskGroupIds = Array.from(
    new Set(
      rows
        .map((i) => i.task_group_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [typesResult, groupsResult] = await Promise.all([
    taskTypeIds.length > 0
      ? supabase.from("task_types").select("id, name").in("id", taskTypeIds)
      : Promise.resolve({ data: [], error: null }),
    taskGroupIds.length > 0
      ? supabase.from("task_groups").select("id, name").in("id", taskGroupIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (typesResult.error) throw typesResult.error;
  if (groupsResult.error) throw groupsResult.error;

  const nameById = new Map<string, string>();
  for (const row of typesResult.data ?? []) nameById.set(row.id, row.name);
  for (const row of groupsResult.data ?? []) nameById.set(row.id, row.name);

  return rows.map((item) => ({
    ...item,
    referentName:
      nameById.get(item.task_type_id ?? item.task_group_id ?? "") ?? null,
  }));
}

export type CatalogOption = { id: string; name: string };

/** Task types and groups the "add item" dialog offers. */
export async function listCatalogOptions(
  supabase: SupabaseClient<Database>,
  businessId: string,
): Promise<{ taskTypes: CatalogOption[]; taskGroups: CatalogOption[] }> {
  const [types, groups] = await Promise.all([
    supabase
      .from("task_types")
      .select("id, name")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("task_groups")
      .select("id, name")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);
  if (types.error) throw types.error;
  if (groups.error) throw groups.error;

  return { taskTypes: types.data ?? [], taskGroups: groups.data ?? [] };
}
