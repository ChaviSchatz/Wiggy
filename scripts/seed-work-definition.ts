/**
 * Idempotent Slice 2 seed: work stages, staff, task types/groups, and one
 * "New Wig" intake template with items (fields + task/group selections).
 *
 * Called from `scripts/seed-dev.ts`. Uses the service-role admin client
 * (bypasses RLS) — matches its pattern of "select existing, else insert" for
 * tables with no natural unique key to upsert on.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../src/lib/supabase/database.types.ts";

type AdminClient = SupabaseClient<Database>;

const STAGES = [
  { key: "intake", name: "קליטה", sortOrder: 0 },
  { key: "planning", name: "תכנון", sortOrder: 1 },
  { key: "sewing", name: "תפירה", sortOrder: 2 },
  { key: "hand_tying", name: "קשירה ידנית", sortOrder: 3 },
  { key: "color", name: "צבע", sortOrder: 4 },
  { key: "wash_styling", name: "חפיפה / עיצוב", sortOrder: 5 },
  { key: "final_review", name: "ביקורת סופית", sortOrder: 6 },
  { key: "pickup", name: "איסוף / מסירה", sortOrder: 7 },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

const STAFF = [
  {
    key: "hand_tying_lead",
    fullName: "דנה כהן",
    title: "קשירה ידנית",
    stageKey: "hand_tying" as StageKey,
  },
  {
    key: "sewing_lead",
    fullName: "יוסי לוי",
    title: "תפירה",
    stageKey: "sewing" as StageKey,
  },
  {
    key: "color_lead",
    fullName: "מיכל בר",
    title: "צבע",
    stageKey: "color" as StageKey,
  },
] as const;
type StaffKey = (typeof STAFF)[number]["key"];

const TASK_TYPES = [
  {
    key: "wash",
    name: "שטיפה",
    stageKey: "wash_styling" as StageKey,
    staffKey: null as StaffKey | null,
    durationMinutes: 20,
    requiresApproval: false,
  },
  {
    key: "styling",
    name: "עיצוב",
    stageKey: "wash_styling" as StageKey,
    staffKey: null as StaffKey | null,
    durationMinutes: 30,
    requiresApproval: false,
  },
  {
    key: "full_color",
    name: "צבע מלא",
    stageKey: "color" as StageKey,
    staffKey: "color_lead" as StaffKey | null,
    durationMinutes: 90,
    requiresApproval: true,
  },
  {
    key: "roots",
    name: "שורשים",
    stageKey: "color" as StageKey,
    staffKey: "color_lead" as StaffKey | null,
    durationMinutes: 45,
    requiresApproval: false,
  },
  {
    key: "highlights",
    name: "הדגשות",
    stageKey: "color" as StageKey,
    staffKey: "color_lead" as StaffKey | null,
    durationMinutes: 60,
    requiresApproval: false,
  },
  {
    key: "hand_tying",
    name: "קשירה ידנית",
    stageKey: "hand_tying" as StageKey,
    staffKey: "hand_tying_lead" as StaffKey | null,
    durationMinutes: 240,
    requiresApproval: true,
  },
  {
    key: "base_sewing",
    name: "תפירת בסיס",
    stageKey: "sewing" as StageKey,
    staffKey: "sewing_lead" as StaffKey | null,
    durationMinutes: 120,
    requiresApproval: false,
  },
  {
    key: "final_review",
    name: "ביקורת סופית",
    stageKey: "final_review" as StageKey,
    staffKey: null as StaffKey | null,
    durationMinutes: 15,
    requiresApproval: true,
  },
] as const;
type TaskTypeKey = (typeof TASK_TYPES)[number]["key"];

const TASK_GROUPS = [
  {
    key: "color_group",
    name: "צבע",
    taskTypeKeys: ["full_color", "roots", "highlights"] as TaskTypeKey[],
  },
  {
    key: "wash_and_styling_group",
    name: "חפיפה ועיצוב",
    taskTypeKeys: ["wash", "styling"] as TaskTypeKey[],
  },
] as const;
type TaskGroupKey = (typeof TASK_GROUPS)[number]["key"];

/**
 * The "no top / no skin" intake flags (architecture §4.4, §6.5): boolean
 * fields whose `config.missing_item_kind` makes confirming the intake create a
 * tracked `missing_items` row.
 */
const MISSING_STOCK_FIELDS = [
  { fieldKey: "no_top", fieldLabel: "אין טופ במלאי", missingItemKind: "top" },
  { fieldKey: "no_skin", fieldLabel: "אין עור במלאי", missingItemKind: "skin" },
] as const;

function missingStockFieldRow(
  templateId: string,
  field: (typeof MISSING_STOCK_FIELDS)[number],
  sortOrder: number,
) {
  return {
    intake_template_id: templateId,
    sort_order: sortOrder,
    item_kind: "field",
    field_key: field.fieldKey,
    field_label: field.fieldLabel,
    field_type: "boolean",
    config: {
      mandatory: false,
      visible: true,
      missing_item_kind: field.missingItemKind,
    },
  };
}

export async function seedWorkDefinition(
  supabase: AdminClient,
  businessId: string,
) {
  const stageIds = await seedWorkStages(supabase, businessId);
  const staffIds = await seedStaffMembers(supabase, businessId, stageIds);
  const taskTypeIds = await seedTaskTypes(
    supabase,
    businessId,
    stageIds,
    staffIds,
  );
  const taskGroupIds = await seedTaskGroups(supabase, businessId, taskTypeIds);
  await seedNewWigIntakeTemplate(
    supabase,
    businessId,
    stageIds,
    taskTypeIds,
    taskGroupIds,
  );
}

async function seedWorkStages(
  supabase: AdminClient,
  businessId: string,
): Promise<Record<StageKey, string>> {
  const rows = STAGES.map((stage) => ({
    business_id: businessId,
    key: stage.key,
    name: stage.name,
    sort_order: stage.sortOrder,
  }));

  const { data, error } = await supabase
    .from("work_stages")
    .upsert(rows, { onConflict: "business_id,key" })
    .select("id, key");
  if (error) throw error;

  console.log(`Ensured ${data.length} work stages.`);
  return Object.fromEntries(data.map((row) => [row.key, row.id])) as Record<
    StageKey,
    string
  >;
}

async function seedStaffMembers(
  supabase: AdminClient,
  businessId: string,
  stageIds: Record<StageKey, string>,
): Promise<Record<StaffKey, string>> {
  const ids: Partial<Record<StaffKey, string>> = {};

  for (const staff of STAFF) {
    const existing = await supabase
      .from("staff_members")
      .select("id")
      .eq("business_id", businessId)
      .eq("full_name", staff.fullName)
      .maybeSingle();
    if (existing.error) throw existing.error;

    if (existing.data) {
      ids[staff.key] = existing.data.id;
      continue;
    }

    const inserted = await supabase
      .from("staff_members")
      .insert({
        business_id: businessId,
        full_name: staff.fullName,
        title: staff.title,
        default_work_stage_id: stageIds[staff.stageKey],
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    ids[staff.key] = inserted.data.id;
  }

  console.log(`Ensured ${STAFF.length} staff members.`);
  return ids as Record<StaffKey, string>;
}

async function seedTaskTypes(
  supabase: AdminClient,
  businessId: string,
  stageIds: Record<StageKey, string>,
  staffIds: Record<StaffKey, string>,
): Promise<Record<TaskTypeKey, string>> {
  const ids: Partial<Record<TaskTypeKey, string>> = {};

  for (const taskType of TASK_TYPES) {
    const existing = await supabase
      .from("task_types")
      .select("id")
      .eq("business_id", businessId)
      .eq("name", taskType.name)
      .maybeSingle();
    if (existing.error) throw existing.error;

    if (existing.data) {
      ids[taskType.key] = existing.data.id;
      continue;
    }

    const inserted = await supabase
      .from("task_types")
      .insert({
        business_id: businessId,
        name: taskType.name,
        default_work_stage_id: stageIds[taskType.stageKey],
        default_staff_member_id: taskType.staffKey
          ? staffIds[taskType.staffKey]
          : null,
        default_duration_minutes: taskType.durationMinutes,
        requires_approval_default: taskType.requiresApproval,
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    ids[taskType.key] = inserted.data.id;
  }

  console.log(`Ensured ${TASK_TYPES.length} task types.`);
  return ids as Record<TaskTypeKey, string>;
}

async function seedTaskGroups(
  supabase: AdminClient,
  businessId: string,
  taskTypeIds: Record<TaskTypeKey, string>,
): Promise<Record<TaskGroupKey, string>> {
  const ids: Partial<Record<TaskGroupKey, string>> = {};

  for (const group of TASK_GROUPS) {
    const existing = await supabase
      .from("task_groups")
      .select("id")
      .eq("business_id", businessId)
      .eq("name", group.name)
      .maybeSingle();
    if (existing.error) throw existing.error;

    let groupId = existing.data?.id;
    if (!groupId) {
      const inserted = await supabase
        .from("task_groups")
        .insert({ business_id: businessId, name: group.name })
        .select("id")
        .single();
      if (inserted.error) throw inserted.error;
      groupId = inserted.data.id;
    }
    ids[group.key] = groupId;

    const items = group.taskTypeKeys.map((taskTypeKey, index) => ({
      task_group_id: groupId,
      task_type_id: taskTypeIds[taskTypeKey],
      sort_order: index,
    }));
    const itemsResult = await supabase
      .from("task_group_items")
      .upsert(items, { onConflict: "task_group_id,task_type_id" });
    if (itemsResult.error) throw itemsResult.error;
  }

  console.log(`Ensured ${TASK_GROUPS.length} task groups.`);
  return ids as Record<TaskGroupKey, string>;
}

async function seedNewWigIntakeTemplate(
  supabase: AdminClient,
  businessId: string,
  stageIds: Record<StageKey, string>,
  taskTypeIds: Record<TaskTypeKey, string>,
  taskGroupIds: Record<TaskGroupKey, string>,
) {
  const templateName = "פאה חדשה";

  const existing = await supabase
    .from("intake_templates")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", templateName)
    .maybeSingle();
  if (existing.error) throw existing.error;

  let templateId = existing.data?.id;
  if (!templateId) {
    const inserted = await supabase
      .from("intake_templates")
      .insert({
        business_id: businessId,
        name: templateName,
        work_order_kind: "customer",
        description: "טופס קליטה להזמנת פאה חדשה",
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    templateId = inserted.data.id;
    console.log(`Created intake template "${templateName}".`);
  } else {
    console.log(`Intake template "${templateName}" already exists.`);
  }

  const existingItems = await supabase
    .from("intake_template_items")
    .select("id, field_key, sort_order")
    .eq("intake_template_id", templateId);
  if (existingItems.error) throw existingItems.error;

  if ((existingItems.data ?? []).length > 0) {
    console.log(`Intake template "${templateName}" already has items.`);
    await ensureMissingStockFields(supabase, templateId, existingItems.data);
    return;
  }

  const items = [
    {
      intake_template_id: templateId,
      sort_order: 0,
      item_kind: "section",
      config: { section_title: "פרטי ההזמנה" },
    },
    {
      intake_template_id: templateId,
      sort_order: 1,
      item_kind: "field",
      field_key: "desired_style",
      field_label: "סטייל רצוי",
      field_type: "text",
      config: { mandatory: false, visible: true },
    },
    {
      intake_template_id: templateId,
      sort_order: 2,
      item_kind: "field",
      field_key: "special_instructions",
      field_label: "הערות מיוחדות",
      field_type: "textarea",
      config: { mandatory: false, visible: true },
    },
    missingStockFieldRow(templateId, MISSING_STOCK_FIELDS[0], 3),
    missingStockFieldRow(templateId, MISSING_STOCK_FIELDS[1], 4),
    {
      intake_template_id: templateId,
      sort_order: 5,
      item_kind: "task_group",
      task_group_id: taskGroupIds.color_group,
      config: {
        mandatory: false,
        selection_mode: "multi",
        display_style: "checklist",
        generates_runtime_tasks: true,
      },
    },
    {
      intake_template_id: templateId,
      sort_order: 6,
      item_kind: "task_type",
      task_type_id: taskTypeIds.hand_tying,
      config: {
        mandatory: true,
        default_selected: true,
        generates_runtime_tasks: true,
      },
    },
    {
      intake_template_id: templateId,
      sort_order: 7,
      item_kind: "task_group",
      task_group_id: taskGroupIds.wash_and_styling_group,
      config: {
        mandatory: false,
        selection_mode: "multi",
        display_style: "checklist",
        generates_runtime_tasks: true,
      },
    },
    {
      intake_template_id: templateId,
      sort_order: 8,
      item_kind: "section",
      config: {
        section_title: "עבודה נוספת",
        help_text: "תארו כל עבודה נוספת שלא מופיעה ברשימה",
        allow_other: true,
        other_default_work_stage_id: stageIds.planning,
      },
    },
  ];

  const inserted = await supabase.from("intake_template_items").insert(items);
  if (inserted.error) throw inserted.error;
  console.log(`Seeded ${items.length} intake template items.`);
}

/**
 * Appends the missing-stock flags to a template that was seeded before they
 * existed, so an already-seeded dev database picks them up without a reset.
 */
async function ensureMissingStockFields(
  supabase: AdminClient,
  templateId: string,
  existingItems: { field_key: string | null; sort_order: number }[],
) {
  const existingKeys = new Set(
    existingItems.map((item) => item.field_key).filter(Boolean),
  );
  const absent = MISSING_STOCK_FIELDS.filter(
    (field) => !existingKeys.has(field.fieldKey),
  );
  if (absent.length === 0) return;

  const maxSortOrder = Math.max(
    ...existingItems.map((item) => item.sort_order),
    -1,
  );
  const rows = absent.map((field, index) =>
    missingStockFieldRow(templateId, field, maxSortOrder + 1 + index),
  );

  const inserted = await supabase.from("intake_template_items").insert(rows);
  if (inserted.error) throw inserted.error;
  console.log(`Added ${rows.length} missing-stock intake fields.`);
}
