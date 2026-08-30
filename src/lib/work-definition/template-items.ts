import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export type IntakeTemplateItem = Tables<"intake_template_items">;

export type BuilderItem = IntakeTemplateItem & {
  /** Catalog name for task_type/task_group items; null for field/section. */
  referentName: string | null;
  /**
   * The task types inside a `task_group` item, in group order. The builder
   * previews a group as the real checklist the customer sees, so it needs the
   * members, not just the group's name. Empty for every other kind.
   */
  groupTaskTypes: { id: string; name: string }[];
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

  const membersByGroup = await fetchGroupMembers(supabase, taskGroupIds);

  return rows.map((item) => ({
    ...item,
    referentName:
      nameById.get(item.task_type_id ?? item.task_group_id ?? "") ?? null,
    groupTaskTypes: item.task_group_id
      ? (membersByGroup.get(item.task_group_id) ?? [])
      : [],
  }));
}

/** Task types belonging to each group, in the group's own order. */
async function fetchGroupMembers(
  supabase: SupabaseClient<Database>,
  groupIds: string[],
): Promise<Map<string, { id: string; name: string }[]>> {
  const byGroup = new Map<string, { id: string; name: string }[]>();
  if (groupIds.length === 0) return byGroup;

  const { data: links, error } = await supabase
    .from("task_group_items")
    .select("task_group_id, task_type_id, sort_order")
    .in("task_group_id", groupIds)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const memberIds = Array.from(
    new Set((links ?? []).map((link) => link.task_type_id)),
  );
  if (memberIds.length === 0) return byGroup;

  const { data: types, error: typesError } = await supabase
    .from("task_types")
    .select("id, name")
    .in("id", memberIds);
  if (typesError) throw typesError;

  const nameById = new Map((types ?? []).map((t) => [t.id, t.name]));
  for (const link of links ?? []) {
    const name = nameById.get(link.task_type_id);
    if (!name) continue;
    const list = byGroup.get(link.task_group_id) ?? [];
    list.push({ id: link.task_type_id, name });
    byGroup.set(link.task_group_id, list);
  }
  return byGroup;
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
