# Intake Templates and Template Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the tenant define their own order types — create, duplicate and edit intake templates and the ordered items that make up each form — so adding "תיקון פאה" no longer requires a developer.

**Architecture:** Two routes under `/settings/templates`, both gated by the existing `editWorkDefinition`. Every change persists immediately through a Server Action plus `router.refresh()`, the idiom sprint planning established for ordered lists. Pure logic (field-type vocabulary, reordering, validation) lives in `src/lib/work-definition/` and is unit-tested without a database; actions are thin adapters, per architecture §1.3.

**Tech Stack:** Next.js App Router (RSC + Server Actions), TypeScript, Supabase (Postgres + RLS), Tailwind + shadcn/ui, next-intl (locale `he`, `dir="rtl"`), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-30-intake-templates-builder-design.md`

---

## File Structure

**Create:**

| File                                                                | Responsibility                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/lib/work-definition/field-types.ts`                            | Field-type vocabulary + options parsing. Pure.              |
| `src/lib/work-definition/field-types.test.ts`                       | Unit tests.                                                 |
| `src/lib/work-definition/reorder.ts`                                | `renumberItems`. Pure.                                      |
| `src/lib/work-definition/reorder.test.ts`                           | Unit tests.                                                 |
| `src/lib/work-definition/validation.ts`                             | Template + item input validation, `WORK_ORDER_KINDS`. Pure. |
| `src/lib/work-definition/validation.test.ts`                        | Unit tests.                                                 |
| `src/lib/work-definition/templates.ts`                              | Template queries.                                           |
| `src/lib/work-definition/template-items.ts`                         | Item queries.                                               |
| `src/lib/work-definition/actions.ts`                                | Template create / update / duplicate / set-active.          |
| `src/lib/work-definition/item-actions.ts`                           | Item add / update / remove / move.                          |
| `src/app/(app)/settings/templates/page.tsx`                         | Template list (#50).                                        |
| `src/app/(app)/settings/templates/template-form-dialog.tsx`         | Create/edit details dialog.                                 |
| `src/app/(app)/settings/templates/template-row-actions.tsx`         | Duplicate + activate/deactivate.                            |
| `src/app/(app)/settings/templates/[id]/page.tsx`                    | Builder (#51).                                              |
| `src/app/(app)/settings/templates/[id]/item-list.tsx`               | Ordered rows + move/remove.                                 |
| `src/app/(app)/settings/templates/[id]/add-item-dialog.tsx`         | Add an item of a chosen kind.                               |
| `src/app/(app)/settings/templates/[id]/item-config-dialog.tsx`      | Per-item config (#52).                                      |
| `supabase/migrations/20260830140000_intake_template_editor_rls.sql` | Write grants + policies.                                    |
| `tests/integration/intake-templates.integration.test.ts`            | RLS + duplicate + delete-restrict.                          |

**Modify:** `src/app/(app)/settings/sections.ts` (third card), `src/lib/work-orders/types.ts` (`options` on `ResolvedIntakeItem`), `src/lib/work-orders/queries.ts` (map `options`), `src/app/(app)/orders/new/step-intake.tsx` (select renderer), `messages/he.json`, docs.

---

## Task 1: Field-type vocabulary

**Files:**

- Create: `src/lib/work-definition/field-types.ts`
- Test: `src/lib/work-definition/field-types.test.ts`

This is the module `20260803210000_work_definition_schema.sql` anticipated: `field_type` has no database enum because "the fixed set is code-defined, to be validated in the app layer once the work-definition domain module (and its [config] editors) is built."

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import {
  FIELD_TYPES,
  isFieldType,
  parseOptions,
  requiresOptions,
  serializeOptions,
} from "./field-types";

describe("FIELD_TYPES", () => {
  it("is the whole vocabulary the intake form can render", () => {
    expect([...FIELD_TYPES]).toEqual(["text", "textarea", "boolean", "select"]);
  });
});

describe("isFieldType", () => {
  it("accepts every member", () => {
    for (const type of FIELD_TYPES) expect(isFieldType(type)).toBe(true);
  });

  it("rejects anything else, including null from the nullable column", () => {
    expect(isFieldType("number")).toBe(false);
    expect(isFieldType("")).toBe(false);
    expect(isFieldType(null)).toBe(false);
    expect(isFieldType(undefined)).toBe(false);
  });
});

describe("requiresOptions", () => {
  it("is true only for select", () => {
    expect(requiresOptions("select")).toBe(true);
    expect(requiresOptions("text")).toBe(false);
    expect(requiresOptions("textarea")).toBe(false);
    expect(requiresOptions("boolean")).toBe(false);
  });
});

describe("parseOptions", () => {
  it("reads a string array out of the options jsonb", () => {
    expect(parseOptions(["קצר", "בינוני"])).toEqual(["קצר", "בינוני"]);
  });

  it("returns empty for anything that is not a string array", () => {
    // `options` is untyped jsonb, so tenant data can be any shape.
    expect(parseOptions(null)).toEqual([]);
    expect(parseOptions(undefined)).toEqual([]);
    expect(parseOptions("קצר")).toEqual([]);
    expect(parseOptions({ a: 1 })).toEqual([]);
  });

  it("drops non-string and blank entries rather than rendering them", () => {
    expect(parseOptions(["קצר", 3, "", "  ", "ארוך"])).toEqual(["קצר", "ארוך"]);
  });
});

describe("serializeOptions", () => {
  it("turns one-per-line textarea input into a trimmed array", () => {
    expect(serializeOptions("קצר\nבינוני\nארוך")).toEqual([
      "קצר",
      "בינוני",
      "ארוך",
    ]);
  });

  it("drops blank lines and trims whitespace", () => {
    expect(serializeOptions("  קצר  \n\n\n ארוך \n")).toEqual(["קצר", "ארוך"]);
  });

  it("returns empty for empty input", () => {
    expect(serializeOptions("")).toEqual([]);
    expect(serializeOptions("   \n  ")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/work-definition/field-types.test.ts`
Expected: FAIL — cannot resolve `./field-types`.

- [ ] **Step 3: Write the implementation**

```ts
/**
 * The field types an intake form can render (screen inventory #52).
 *
 * `intake_template_items.field_type` has no database enum on purpose --
 * 20260803210000_work_definition_schema.sql says the fixed set is
 * "code-defined, to be validated in the app layer once the work-definition
 * domain module (and its [config] editors) is built". This is that module.
 *
 * Two consumers: the builder validates against it on write, and the intake
 * wizard (`src/app/(app)/orders/new/step-intake.tsx`) renders from it on
 * read. One source, so the two cannot drift.
 */

export const FIELD_TYPES = ["text", "textarea", "boolean", "select"] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** What an item falls back to when `field_type` is null or unrecognised. */
export const DEFAULT_FIELD_TYPE: FieldType = "text";

export function isFieldType(
  value: string | null | undefined,
): value is FieldType {
  return (
    typeof value === "string" &&
    (FIELD_TYPES as readonly string[]).includes(value)
  );
}

/** Only `select` needs a value list; the others are free input. */
export function requiresOptions(type: FieldType): boolean {
  return type === "select";
}

/**
 * Reads the `options` jsonb column. It is untyped and tenant-owned, so
 * anything that is not a list of non-blank strings yields an empty list
 * rather than rendering junk into the form.
 */
export function parseOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Turns the config dialog's one-per-line textarea into the stored array. */
export function serializeOptions(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/work-definition/field-types.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/work-definition/field-types.ts src/lib/work-definition/field-types.test.ts
git commit -m "feat(work-definition): code-defined field-type vocabulary"
```

---

## Task 2: Reordering

**Files:**

- Create: `src/lib/work-definition/reorder.ts`
- Test: `src/lib/work-definition/reorder.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { renumberItems } from "./reorder";

const list = ["a", "b", "c", "d"];

describe("renumberItems", () => {
  it("moves an item one place towards the start", () => {
    expect(renumberItems(list, 2, "up")).toEqual(["a", "c", "b", "d"]);
  });

  it("moves an item one place towards the end", () => {
    expect(renumberItems(list, 1, "down")).toEqual(["a", "c", "b", "d"]);
  });

  it("is a no-op at the first position moving up", () => {
    expect(renumberItems(list, 0, "up")).toEqual(list);
  });

  it("is a no-op at the last position moving down", () => {
    expect(renumberItems(list, 3, "down")).toEqual(list);
  });

  it("is a no-op for an index outside the list", () => {
    expect(renumberItems(list, -1, "up")).toEqual(list);
    expect(renumberItems(list, 9, "down")).toEqual(list);
  });

  it("does not mutate the input", () => {
    const original = [...list];
    renumberItems(list, 2, "up");
    expect(list).toEqual(original);
  });

  it("handles a single-item list", () => {
    expect(renumberItems(["only"], 0, "up")).toEqual(["only"]);
    expect(renumberItems(["only"], 0, "down")).toEqual(["only"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/work-definition/reorder.test.ts`
Expected: FAIL — cannot resolve `./reorder`.

- [ ] **Step 3: Write the implementation**

```ts
/**
 * Moving an item within an intake template's ordered list (screen inventory
 * #51).
 *
 * The caller writes `sort_order = index` for the whole returned list, i.e. a
 * move renumbers everything rather than swapping two rows. That is the
 * opposite trade-off to sprint planning's fractional `queue_rank`, and
 * deliberately so: a lane there spans many rows per assignee, while a
 * template holds roughly ten items. `sort_order` also defaults to 0, so a
 * template can hold duplicates -- a swap would silently do nothing in that
 * case, whereas renumbering is idempotent and self-healing.
 *
 * Pure, so the ordering is unit-testable without a database.
 */
export function renumberItems<T>(
  items: T[],
  fromIndex: number,
  direction: "up" | "down",
): T[] {
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  const outOfRange =
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex >= items.length;
  if (outOfRange) return items;

  const next = [...items];
  [next[fromIndex], next[toIndex]] = [next[toIndex]!, next[fromIndex]!];
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/work-definition/reorder.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/work-definition/reorder.ts src/lib/work-definition/reorder.test.ts
git commit -m "feat(work-definition): pure item reordering"
```

---

## Task 3: Validation

**Files:**

- Create: `src/lib/work-definition/validation.ts`
- Test: `src/lib/work-definition/validation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import {
  WORK_ORDER_KINDS,
  hasTemplateErrors,
  isWorkOrderKind,
  validateItemInput,
  validateTemplateInput,
  type ItemInput,
  type TemplateInput,
} from "./validation";

function template(overrides: Partial<TemplateInput> = {}): TemplateInput {
  return {
    name: "תיקון פאה",
    workOrderKind: "repair",
    description: "",
    ...overrides,
  };
}

function item(overrides: Partial<ItemInput> = {}): ItemInput {
  return {
    itemKind: "field",
    fieldLabel: "אורך",
    fieldKey: "",
    fieldType: "text",
    optionsText: "",
    sectionTitle: "",
    ...overrides,
  };
}

describe("WORK_ORDER_KINDS", () => {
  it("matches the five values the schema and message catalog define", () => {
    expect([...WORK_ORDER_KINDS]).toEqual([
      "customer",
      "display_wig",
      "internal",
      "missing_item",
      "repair",
    ]);
  });
});

describe("isWorkOrderKind", () => {
  it("rejects a tenant-invented kind, which would render as a raw key", () => {
    expect(isWorkOrderKind("repair")).toBe(true);
    expect(isWorkOrderKind("wig_repair")).toBe(false);
  });
});

describe("validateTemplateInput", () => {
  it("accepts a name and a known kind", () => {
    expect(validateTemplateInput(template())).toEqual({});
  });

  it("requires a name", () => {
    expect(validateTemplateInput(template({ name: "  " })).name).toBe(
      "required",
    );
  });

  it("rejects an unknown kind", () => {
    expect(
      validateTemplateInput(template({ workOrderKind: "nope" })).workOrderKind,
    ).toBe("invalid");
  });
});

describe("validateItemInput", () => {
  it("requires a label on a field, but not a key", () => {
    expect(validateItemInput(item())).toEqual({});
    expect(validateItemInput(item({ fieldLabel: " " })).fieldLabel).toBe(
      "required",
    );
  });

  it("rejects an unknown field type", () => {
    expect(validateItemInput(item({ fieldType: "number" })).fieldType).toBe(
      "invalid",
    );
  });

  it("requires at least one option for a select", () => {
    expect(validateItemInput(item({ fieldType: "select" })).options).toBe(
      "required",
    );
    expect(
      validateItemInput(item({ fieldType: "select", optionsText: "  \n " }))
        .options,
    ).toBe("required");
    expect(
      validateItemInput(item({ fieldType: "select", optionsText: "קצר" })),
    ).toEqual({});
  });

  it("ignores options for non-select types", () => {
    expect(
      validateItemInput(item({ fieldType: "text", optionsText: "" })),
    ).toEqual({});
  });

  it("requires a title on a section", () => {
    expect(
      validateItemInput(item({ itemKind: "section", sectionTitle: "פרטים" })),
    ).toEqual({});
    expect(
      validateItemInput(item({ itemKind: "section", sectionTitle: "" }))
        .sectionTitle,
    ).toBe("required");
  });

  it("has nothing to validate on task_type and task_group items", () => {
    // The referent is picked from the catalog, not typed in.
    expect(validateItemInput(item({ itemKind: "task_type" }))).toEqual({});
    expect(validateItemInput(item({ itemKind: "task_group" }))).toEqual({});
  });
});

describe("hasTemplateErrors", () => {
  it("is false when clean and true once any field failed", () => {
    expect(hasTemplateErrors({})).toBe(false);
    expect(hasTemplateErrors({ name: "required" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/work-definition/validation.test.ts`
Expected: FAIL — cannot resolve `./validation`.

- [ ] **Step 3: Write the implementation**

```ts
/**
 * Pure validation for the intake-template editor (screen inventory #50-52),
 * mirroring `src/lib/staff/validation.ts`.
 */

import { isFieldType, requiresOptions, serializeOptions } from "./field-types";

/**
 * The five order kinds. Fixed rather than tenant-defined: the value renders
 * through `t("kind.<value>")` and is the identity shown wherever an order has
 * no customer (board cards, My Work, approvals, the hub header), so an
 * invented value would surface as a raw message key. The tenant's free text
 * is the template *name*.
 */
export const WORK_ORDER_KINDS = [
  "customer",
  "display_wig",
  "internal",
  "missing_item",
  "repair",
] as const;

export type WorkOrderKind = (typeof WORK_ORDER_KINDS)[number];

export type IntakeItemKind = "task_type" | "task_group" | "field" | "section";

export function isWorkOrderKind(value: string): value is WorkOrderKind {
  return (WORK_ORDER_KINDS as readonly string[]).includes(value);
}

export type TemplateInput = {
  name: string;
  workOrderKind: string;
  description: string;
};

export type TemplateFieldErrors = Partial<
  Record<keyof TemplateInput, "required" | "invalid">
>;

export function validateTemplateInput(
  input: TemplateInput,
): TemplateFieldErrors {
  const errors: TemplateFieldErrors = {};
  if (!input.name.trim()) errors.name = "required";
  if (!isWorkOrderKind(input.workOrderKind)) errors.workOrderKind = "invalid";
  return errors;
}

export function hasTemplateErrors(errors: TemplateFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export type ItemInput = {
  itemKind: IntakeItemKind;
  fieldLabel: string;
  /** Optional: the generator falls back `fieldLabel ?? fieldKey ?? id`. */
  fieldKey: string;
  fieldType: string;
  /** One value per line, as typed into the config dialog. */
  optionsText: string;
  sectionTitle: string;
};

export type ItemFieldErrors = Partial<
  Record<
    "fieldLabel" | "fieldType" | "options" | "sectionTitle",
    "required" | "invalid"
  >
>;

export function validateItemInput(input: ItemInput): ItemFieldErrors {
  const errors: ItemFieldErrors = {};

  if (input.itemKind === "field") {
    if (!input.fieldLabel.trim()) errors.fieldLabel = "required";

    if (!isFieldType(input.fieldType)) {
      errors.fieldType = "invalid";
    } else if (
      requiresOptions(input.fieldType) &&
      serializeOptions(input.optionsText).length === 0
    ) {
      errors.options = "required";
    }
  }

  if (input.itemKind === "section" && !input.sectionTitle.trim()) {
    errors.sectionTitle = "required";
  }

  // task_type / task_group carry no typed input -- the referent is chosen
  // from the catalog, and its config has only boolean/enum toggles.
  return errors;
}

export function hasItemErrors(errors: ItemFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/work-definition/validation.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/work-definition/validation.ts src/lib/work-definition/validation.test.ts
git commit -m "feat(work-definition): template and item input validation"
```

---

## Task 4: Migration — editor grants and policies

**Files:**

- Create: `supabase/migrations/20260830140000_intake_template_editor_rls.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Settings slice 2 (screen inventory #50-52) -- the intake-template editor.
-- 20260803210100_work_definition_rls.sql granted SELECT only, noting write
-- policies land "alongside that editor slice". This is that slice, for the
-- two template tables; task_types/task_groups stay read-only until #46-49.
--
-- Note the asymmetry between the two tables:
--
--   intake_templates      INSERT, UPDATE      -- no DELETE
--   intake_template_items INSERT, UPDATE, DELETE
--
-- A template cannot be deleted because `work_orders.intake_template_id` is
-- `on delete restrict` -- Postgres refuses outright for any template an order
-- has ever used, so the UI removes templates by deactivating them
-- (`is_active = false`), which also drops them from the New Order wizard.
-- Items *can* be deleted: `runtime_tasks.origin_item_id` is
-- `on delete set null`, that column is written but never read, and runtime
-- tasks snapshot their title/stage/approval at generation (architecture
-- §5.1), so removing an item cannot damage an existing order.
--
-- `intake_template_items` has no `business_id` -- tenancy derives from its
-- parent -- so its policies join through `intake_templates`, the same shape
-- `task_group_items_select_members` already uses.
--
-- As everywhere since Slice 4, RLS enforces tenant isolation only; *who* may
-- edit is enforced in the app layer (`editWorkDefinition` in src/lib/roles.ts).

grant insert, update on public.intake_templates to authenticated;
grant insert, update, delete on public.intake_template_items to authenticated;

create policy "intake_templates_insert_members"
  on public.intake_templates
  for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "intake_templates_update_members"
  on public.intake_templates
  for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "intake_template_items_insert_members"
  on public.intake_template_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.intake_templates t
      where t.id = intake_template_items.intake_template_id
        and public.is_business_member(t.business_id)
    )
  );

create policy "intake_template_items_update_members"
  on public.intake_template_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.intake_templates t
      where t.id = intake_template_items.intake_template_id
        and public.is_business_member(t.business_id)
    )
  )
  with check (
    exists (
      select 1
      from public.intake_templates t
      where t.id = intake_template_items.intake_template_id
        and public.is_business_member(t.business_id)
    )
  );

create policy "intake_template_items_delete_members"
  on public.intake_template_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.intake_templates t
      where t.id = intake_template_items.intake_template_id
        and public.is_business_member(t.business_id)
    )
  );
```

- [ ] **Step 2: Apply it**

Requires local Supabase (`colima start`, then `npx supabase start`).

Run:

```bash
npx supabase migration up --local
npm run gen:types
```

Expected: "Migrations applied". `src/lib/supabase/database.types.ts` may be unchanged — grants and policies are not part of the generated types.

- [ ] **Step 3: Confirm it registered**

Run: `npx supabase migration list --local`
Expected: `20260830140000` appears in both the local and remote columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260830140000_intake_template_editor_rls.sql src/lib/supabase/database.types.ts
git commit -m "feat(db): intake template editor grants and policies"
```

---

## Task 5: Queries

**Files:**

- Create: `src/lib/work-definition/templates.ts`, `src/lib/work-definition/template-items.ts`

Thin Supabase reads, covered by the integration test in Task 13 — the same boundary `src/lib/staff/queries.ts` draws.

- [ ] **Step 1: Write `templates.ts`**

```ts
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
```

- [ ] **Step 2: Write `template-items.ts`**

```ts
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
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/work-definition/templates.ts src/lib/work-definition/template-items.ts
git commit -m "feat(work-definition): template and item queries"
```

---

## Task 6: Template actions

**Files:**

- Create: `src/lib/work-definition/actions.ts`

- [ ] **Step 1: Write the actions**

```ts
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
  if (error || !data)
    return { success: false, errors: {}, formError: "generic" };

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
 * order has used, and the migration withholds the grant to match. Deactivating
 * drops it from the New Order wizard (`createWorkOrderAction` rejects
 * `!template.is_active`) while every existing order keeps working, because
 * orders snapshot their intake at generation time.
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
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/work-definition/actions.ts
git commit -m "feat(work-definition): template create/update/duplicate/set-active"
```

---

## Task 7: Item actions

**Files:**

- Create: `src/lib/work-definition/item-actions.ts`

- [ ] **Step 1: Write the actions**

```ts
"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { IntakeItemConfig } from "@/lib/work-orders/types";
import { serializeOptions } from "./field-types";
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
    config: readConfig(formData, input.itemKind),
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

  for (const [index, item] of next.entries()) {
    const { error: updateError } = await supabase
      .from("intake_template_items")
      .update({ sort_order: index })
      .eq("id", item.id)
      .eq("intake_template_id", templateId);
    if (updateError)
      return { success: false, errors: {}, formError: "generic" };
  }

  revalidateBuilder(templateId);
  return { success: true };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. If `next.entries()` trips the `downlevelIteration` rule (it did once in `scripts/seed-screens.ts`), replace the loop with an indexed `for (let index = 0; index < next.length; index++)`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/work-definition/item-actions.ts
git commit -m "feat(work-definition): item add/update/remove/move actions"
```

---

## Task 8: i18n messages

**Files:**

- Modify: `messages/he.json`

Every string Tasks 9–12 need. `src/i18n/messages.test.ts` guards against duplicate keys, so run the unit suite after.

- [ ] **Step 1: Add a `templates` block inside `pages.settings`**

Insert as a sibling of the existing `staff` and `business` keys:

```json
"templates": {
  "title": "תבניות קליטה",
  "subtitle": "סוגי ההזמנות והטפסים שלהן",
  "add": "תבנית חדשה",
  "emptyTitle": "אין עדיין תבניות",
  "emptyDescription": "צרו תבנית כדי להוסיף סוג הזמנה חדש.",
  "columns": {
    "name": "שם",
    "kind": "סוג הזמנה",
    "items": "פריטים",
    "status": "סטטוס",
    "actions": "פעולות"
  },
  "status": { "active": "פעילה", "inactive": "לא פעילה" },
  "edit": "עריכה",
  "openBuilder": "עריכת הטופס",
  "duplicate": "שכפול",
  "activate": "הפעלה",
  "deactivate": "השבתה",
  "form": {
    "createTitle": "תבנית קליטה חדשה",
    "editTitle": "עריכת פרטי התבנית",
    "name": "שם התבנית",
    "kind": "סוג הזמנה",
    "description": "תיאור",
    "cancel": "ביטול",
    "save": "שמירה",
    "saving": "שומר/ת...",
    "errors": {
      "required": "שדה חובה.",
      "invalid": "ערך לא תקין.",
      "forbidden": "אין לכם הרשאה לפעולה זו.",
      "notFound": "התבנית לא נמצאה.",
      "generic": "משהו השתבש. נסו שוב."
    }
  },
  "builder": {
    "back": "חזרה לרשימת התבניות",
    "addItem": "הוספת פריט",
    "emptyTitle": "הטופס ריק",
    "emptyDescription": "הוסיפו פריטים כדי להרכיב את טופס הקליטה.",
    "moveUp": "העברה למעלה",
    "moveDown": "העברה למטה",
    "remove": "הסרה",
    "removeTitle": "הסרת פריט מהטופס",
    "removeConfirm": "הפריט יוסר מהטופס. הזמנות קיימות לא יושפעו.",
    "removeCancel": "ביטול",
    "removeSubmit": "הסרה",
    "kind": {
      "task_type": "סוג משימה",
      "task_group": "קבוצת משימות",
      "field": "שדה",
      "section": "מקטע"
    },
    "add": {
      "title": "הוספת פריט לטופס",
      "chooseKind": "סוג הפריט",
      "referent": "בחירה מהקטלוג",
      "cancel": "ביטול",
      "submit": "הוספה",
      "submitting": "מוסיף/ה..."
    }
  },
  "item": {
    "title": "הגדרות הפריט",
    "fieldLabel": "תווית",
    "fieldKey": "מזהה (אופציונלי)",
    "fieldKeyHelp": "מזהה קבוע לשימוש פנימי. אפשר להשאיר ריק.",
    "fieldType": "סוג שדה",
    "options": "אפשרויות",
    "optionsHelp": "אפשרות אחת בכל שורה.",
    "sectionTitle": "כותרת המקטע",
    "helpText": "טקסט עזרה",
    "visible": "מוצג בטופס",
    "mandatory": "חובה",
    "defaultSelected": "מסומן כברירת מחדל",
    "generatesTasks": "יוצר משימות",
    "generatesTasksHelp": "אם לא מסומן, הבחירה לא תיצור משימה כלל.",
    "selectionMode": "אופן הבחירה",
    "displayStyle": "תצוגה",
    "allowOther": "מאפשר \"אחר\" (טקסט חופשי)",
    "otherStage": "שלב ברירת מחדל ל\"אחר\"",
    "missingItemKind": "סימון חוסר במלאי",
    "missingItemKindHelp": "מענה על השדה ייצור פריט חסר וידווח בדשבורד.",
    "missingItemKindNone": "ללא",
    "fieldTypes": {
      "text": "טקסט קצר",
      "textarea": "טקסט ארוך",
      "boolean": "כן/לא",
      "select": "בחירה מרשימה"
    },
    "selectionModes": { "single": "בחירה אחת", "multi": "בחירה מרובה", "all": "הכל" },
    "displayStyles": { "checklist": "רשימת סימון", "dropdown": "נפתח", "list": "רשימה" },
    "noStage": "ללא שלב",
    "cancel": "ביטול",
    "save": "שמירה",
    "saving": "שומר/ת...",
    "errors": {
      "required": "שדה חובה.",
      "invalid": "ערך לא תקין.",
      "forbidden": "אין לכם הרשאה לפעולה זו.",
      "notFound": "הפריט לא נמצא.",
      "generic": "משהו השתבש. נסו שוב."
    }
  }
}
```

- [ ] **Step 2: Add the hub card copy**

Inside the existing `pages.settings.sections` object, alongside `staff` and `business`:

```json
"templates": {
  "title": "תבניות קליטה",
  "description": "סוגי ההזמנות והטפסים שהלקוחה ממלאת."
}
```

- [ ] **Step 3: Verify the catalog**

Run: `npx vitest run src/i18n/messages.test.ts`
Expected: PASS — no duplicate keys.

- [ ] **Step 4: Commit**

```bash
git add messages/he.json
git commit -m "feat(i18n): Hebrew copy for the intake-template editor"
```

---

## Task 9: Template list screen (#50)

**Files:**

- Create: `src/app/(app)/settings/templates/page.tsx`, `template-form-dialog.tsx`, `template-row-actions.tsx`
- Modify: `src/app/(app)/settings/sections.ts`

- [ ] **Step 1: Add the hub card**

In `src/app/(app)/settings/sections.ts`, extend the union and append to `SETTINGS_SECTIONS`:

```ts
export type SettingsSection = {
  key: "staff" | "business" | "templates";
  href: string;
  icon: LucideIcon;
  permissions: Permission[];
};
```

```ts
  {
    key: "templates",
    href: "/settings/templates",
    icon: FileText,
    permissions: ["editWorkDefinition"],
  },
```

Add `FileText` to the existing `lucide-react` import.

- [ ] **Step 2: Extend the sections test**

In `src/app/(app)/settings/sections.test.ts`, update the expectations — admin and manager both hold `editWorkDefinition`:

```ts
it("gives an admin every section", () => {
  expect(keys("admin")).toEqual(["staff", "business", "templates"]);
});

it("gives a manager every section too", () => {
  expect(keys("manager")).toEqual(["staff", "business", "templates"]);
});
```

Run: `npx vitest run "src/app/(app)/settings/sections.test.ts"`
Expected: PASS.

- [ ] **Step 3: Build the list page**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listIntakeTemplates } from "@/lib/work-definition/templates";
import { TemplateFormDialog } from "./template-form-dialog";
import { TemplateRowActions } from "./template-row-actions";

export default async function TemplatesSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "editWorkDefinition")) redirect("/");

  const supabase = await createServerSupabaseClient();
  const templates = await listIntakeTemplates(supabase, user.businessId);

  const t = await getTranslations("pages.settings.templates");
  const tKind = await getTranslations("pages.orders.kind");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mb-4">
        <TemplateFormDialog />
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.kind")}</TableHead>
              <TableHead>{t("columns.items")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow
                key={template.id}
                className={template.is_active ? undefined : "opacity-60"}
              >
                <TableCell>{template.name}</TableCell>
                <TableCell>{tKind(template.work_order_kind)}</TableCell>
                <TableCell>{template.itemCount}</TableCell>
                <TableCell>
                  {template.is_active
                    ? t("status.active")
                    : t("status.inactive")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/settings/templates/${template.id}`}>
                        {t("openBuilder")}
                      </Link>
                    </Button>
                    <TemplateRowActions template={template} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build the details dialog**

`template-form-dialog.tsx` — a `"use client"` component. Read `src/app/(app)/settings/staff/staff-form-dialog.tsx` first and mirror it exactly: `useState` for open, `useTransition` for pending, `FormData` submit, errors keyed to `t("form.errors.<code>")`, `router.refresh()` on success.

Props: optional `template?: TemplateListItem` (present = edit, calls `updateTemplateAction(template.id, formData)`; absent = create, calls `createTemplateAction(formData)`) and optional `trigger?: React.ReactNode` defaulting to a primary button reading `t("add")`.

Fields: `name` (`Input`, required), `workOrderKind` (`select` over `WORK_ORDER_KINDS` from `@/lib/work-definition/validation`, each option labelled with `useTranslations("pages.orders.kind")`), `description` (`Textarea`).

On a successful **create**, push to the new builder: `router.push(\`/settings/templates/${result.templateId}\`)`.

- [ ] **Step 5: Build the row actions**

`template-row-actions.tsx` — `"use client"`. Three controls:

- **Edit** — reuses `TemplateFormDialog` in edit mode with an outline trigger reading `t("edit")`.
- **Duplicate** — a button calling `duplicateTemplateAction(template.id)`, then `router.refresh()`.
- **Activate / deactivate** — a button calling `setTemplateActiveAction(template.id, !template.is_active)`, labelled `t("activate")` or `t("deactivate")`, then `router.refresh()`. Deactivating needs no confirm dialog: it is reversible and does not touch existing orders.

Each uses its own `useTransition` and surfaces failures with `t("form.errors.<code>")`.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: clean, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/settings/templates" "src/app/(app)/settings/sections.ts" "src/app/(app)/settings/sections.test.ts"
git commit -m "feat(settings): intake template list (screen #50)"
```

---

## Task 10: Builder page and item list (#51)

**Files:**

- Create: `src/app/(app)/settings/templates/[id]/page.tsx`, `item-list.tsx`, `add-item-dialog.tsx`

- [ ] **Step 1: Build the page**

```tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  listCatalogOptions,
  listTemplateItems,
} from "@/lib/work-definition/template-items";
import { getIntakeTemplate } from "@/lib/work-definition/templates";
import { fetchActiveWorkStages } from "@/lib/work-orders/queries";
import { AddItemDialog } from "./add-item-dialog";
import { ItemList } from "./item-list";

export default async function TemplateBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "editWorkDefinition")) redirect("/");

  const supabase = await createServerSupabaseClient();
  const template = await getIntakeTemplate(
    supabase,
    params.id,
    user.businessId,
  );
  if (!template) notFound();

  const [items, catalog, stages] = await Promise.all([
    listTemplateItems(supabase, template.id),
    listCatalogOptions(supabase, user.businessId),
    fetchActiveWorkStages(supabase, user.businessId),
  ]);

  const t = await getTranslations("pages.settings.templates");
  const tKind = await getTranslations("pages.orders.kind");
  const stageOptions = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
  }));

  return (
    <div>
      <Link
        href="/settings/templates"
        className="text-body text-muted underline-offset-4 hover:underline"
      >
        {t("builder.back")}
      </Link>

      <PageHeader
        title={template.name}
        subtitle={tKind(template.work_order_kind)}
      />

      <div className="mb-4">
        <AddItemDialog
          templateId={template.id}
          taskTypes={catalog.taskTypes}
          taskGroups={catalog.taskGroups}
        />
      </div>

      <ItemList templateId={template.id} items={items} stages={stageOptions} />
    </div>
  );
}
```

- [ ] **Step 2: Build the item list**

`item-list.tsx` — `"use client"`. Renders one row per item in order. Each row shows:

- a kind badge from `t("builder.kind.<item_kind>")`
- the identity: `referentName` for `task_type`/`task_group`, `field_label` for `field`, `config.section_title` for `section`
- a muted summary line built from the item's own config (for example a field shows its field-type label plus "חובה" when `config.mandatory`)
- actions: edit (opens `ItemConfigDialog` from Task 11), **↑** `moveTemplateItemAction(templateId, id, "up")`, **↓** `…"down"`, and remove

Remove opens a confirm `Dialog` using `t("builder.removeTitle")`, `t("builder.removeConfirm")` — which states that existing orders are unaffected — then calls `removeTemplateItemAction`.

Each action runs in its own `useTransition` and calls `router.refresh()` on success. Empty list renders `EmptyState` with `t("builder.emptyTitle")` / `t("builder.emptyDescription")`.

- [ ] **Step 3: Build the add dialog**

`add-item-dialog.tsx` — `"use client"`. Step one picks the kind (`task_type` / `task_group` / `field` / `section`) from a `select` labelled `t("builder.add.chooseKind")`.

The rest of the form depends on that choice:

- `task_type` / `task_group` → a `select` named `referentId` over `taskTypes` or `taskGroups`
- `field` → `fieldLabel`, `fieldKey`, `fieldType` (over `FIELD_TYPES`, labelled via `t("item.fieldTypes.<type>")`), and an `optionsText` `Textarea` shown only when the chosen type is `select`
- `section` → `sectionTitle`

Submits `FormData` to `addTemplateItemAction(templateId, formData)`, surfaces field errors from `result.errors` via `t("item.errors.<code>")`, closes and `router.refresh()` on success.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: clean; `/settings/templates` and `/settings/templates/[id]` appear in the route list.

**Do not run `npm run build` while a dev server is running** — they share `.next`, and deleting or overwriting it kills the running server.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/settings/templates/[id]"
git commit -m "feat(settings): intake template builder (screen #51)"
```

---

## Task 11: Item config dialog (#52)

**Files:**

- Create: `src/app/(app)/settings/templates/[id]/item-config-dialog.tsx`

- [ ] **Step 1: Build the dialog**

`"use client"`. Props: `templateId`, `item: BuilderItem`, `stages: { id: string; name: string }[]`, `trigger`.

Renders **only the keys valid for `item.item_kind`**, submitting `FormData` to `updateTemplateItemAction(templateId, item.id, formData)`. Checkbox inputs must be `name`d exactly as `readConfig` expects, since it reads `formData.get(name) === "on"`.

**`field`** — `fieldLabel` (`Input`, required), `fieldKey` (`Input`, optional, help `t("item.fieldKeyHelp")`), `fieldType` (`select` over `FIELD_TYPES`), `optionsText` (`Textarea`, **only when `fieldType === "select"`**, help `t("item.optionsHelp")`, prefilled from `parseOptions(item.options).join("\n")`), then checkboxes `visible` and `mandatory`, an `help_text` `Input`, and a `missing_item_kind` `select` of none/top/skin/material with help `t("item.missingItemKindHelp")`.

**`task_type`** — checkboxes `mandatory`, `default_selected`, `generates_runtime_tasks` (help `t("item.generatesTasksHelp")`).

**`task_group`** — `selection_mode` select (single/multi/all), `display_style` select (checklist/dropdown/list), checkbox `generates_runtime_tasks`.

**`section`** — `sectionTitle` (`Input`, required), `help_text` (`Input`), checkbox `allow_other`, and an `other_default_work_stage_id` select over `stages` shown **only when `allow_other` is checked**.

The form must also submit a hidden `itemKind` input set to `item.item_kind`, because `readItemInput` reads it to decide which branch to validate.

Two fields carry explanatory copy because their effect is invisible from the label: `missing_item_kind` (answering the field creates a `missing_items` row) and `generates_runtime_tasks` (unchecked means the selection produces nothing).

- [ ] **Step 2: Wire it into the item list**

In `item-list.tsx`, the row's edit control renders `ItemConfigDialog` with that row's item and the `stages` prop.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/settings/templates/[id]/item-config-dialog.tsx" "src/app/(app)/settings/templates/[id]/item-list.tsx"
git commit -m "feat(settings): per-item intake config dialog (screen #52)"
```

---

## Task 12: Render `select` in the intake wizard

**Files:**

- Modify: `src/lib/work-orders/types.ts`, `src/lib/work-orders/queries.ts`, `src/app/(app)/orders/new/step-intake.tsx`

`fetchResolvedIntakeItems` already does `.select("*")`, so `options` is fetched — it is simply never mapped onto `ResolvedIntakeItem`.

- [ ] **Step 1: Carry `options` through the type**

In `src/lib/work-orders/types.ts`, add to `ResolvedIntakeItem` after `fieldType`:

```ts
  fieldType: string | null;
  /** Values for a `select` field; empty for every other type. */
  options: string[];
```

- [ ] **Step 2: Map it in the query**

In `src/lib/work-orders/queries.ts`, add the import and the mapped field:

```ts
import { parseOptions } from "@/lib/work-definition/field-types";
```

In the `map((row): ResolvedIntakeItem => ({ ... }))`, after `fieldType: row.field_type,`:

```ts
    options: parseOptions(row.options),
```

- [ ] **Step 3: Render the select**

In `src/app/(app)/orders/new/step-intake.tsx`, the field component currently branches on `boolean` then `textarea` and falls through to `Input`. Change its props to accept `options: string[]` and add a branch **before** the `textarea` one:

```tsx
if (fieldType === "select") {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-[39px] w-full rounded-xs border border-line-strong bg-surface px-3 text-body text-ink focus-visible:border-mauve-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mauve-100"
    >
      <option value="">{t("selectNone")}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
```

Pass `options={item.options}` at the call site alongside the existing `fieldType={item.fieldType}`.

**Keep the final `Input` fallback.** The editor can no longer create an unrecognised `field_type`, but a pre-existing row must still render rather than crash.

- [ ] **Step 4: Add the placeholder string**

In `messages/he.json`, inside `pages.orders.wizard.intake`, add:

```json
"selectNone": "בחרו אפשרות"
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run test`
Expected: clean, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/work-orders/types.ts src/lib/work-orders/queries.ts "src/app/(app)/orders/new/step-intake.tsx" messages/he.json
git commit -m "feat(orders): render select fields in the intake wizard"
```

---

## Task 13: Integration tests

**Files:**

- Create: `tests/integration/intake-templates.integration.test.ts`

Requires local Supabase. Read `tests/integration/staff.integration.test.ts` first and reuse its tenant-seeding shape — including the `afterAll` that deletes auth users, which the older files omit.

- [ ] **Step 1: Write the tests**

Seed two tenants as `staff.integration.test.ts` does, then cover exactly these behaviours:

```ts
it("lets a member create a template and its items", async () => {
  const template = await a.client
    .from("intake_templates")
    .insert({
      business_id: a.businessId,
      name: `T ${runId}`,
      work_order_kind: "repair",
    })
    .select("id")
    .single();
  expect(template.error).toBeNull();

  const item = await a.client.from("intake_template_items").insert({
    intake_template_id: template.data!.id,
    item_kind: "field",
    field_label: "אורך",
    sort_order: 0,
  });
  expect(item.error).toBeNull();
});

it("rejects creating a template in another tenant", async () => {
  const { error } = await a.client.from("intake_templates").insert({
    business_id: b.businessId,
    name: "cross",
    work_order_kind: "repair",
  });
  expect(error).not.toBeNull();
});

it("rejects adding an item to another tenant's template", async () => {
  // The item table has no business_id -- its policy joins through the parent.
  const { error } = await a.client.from("intake_template_items").insert({
    intake_template_id: bTemplateId,
    item_kind: "section",
    sort_order: 0,
  });
  expect(error).not.toBeNull();
});

it("cannot update or delete another tenant's item", async () => {
  const updated = await a.client
    .from("intake_template_items")
    .update({ field_label: "hijacked" })
    .eq("id", bItemId)
    .select("id");
  expect(updated.data ?? []).toHaveLength(0);

  const deleted = await a.client
    .from("intake_template_items")
    .delete()
    .eq("id", bItemId)
    .select("id");
  expect(deleted.data ?? []).toHaveLength(0);
});

it("does not grant delete on templates", async () => {
  const { error } = await a.client
    .from("intake_templates")
    .delete()
    .eq("id", aTemplateId);

  // Removal is deactivation: work_orders.intake_template_id is
  // `on delete restrict`, so the grant is withheld on purpose.
  expect(error).not.toBeNull();
});

it("refuses to delete a template a work order uses, even as service_role", async () => {
  // Proves the restrict constraint, not just the missing grant.
  const { error } = await admin
    .from("intake_templates")
    .delete()
    .eq("id", templateUsedByAnOrder);
  expect(error).not.toBeNull();
});
```

For the last test, seed a `work_orders` row referencing the template via `admin` (it needs `business_id`, `intake_template_id`, `work_order_kind`, `number`; `status` and `order_received_date` have defaults).

- [ ] **Step 2: Run them**

Run: `npm run test:integration`
Expected: all pass, including the pre-existing 64.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/intake-templates.integration.test.ts
git commit -m "test(work-definition): template editor RLS and delete-restrict"
```

---

## Task 14: Documentation and final verification

**Files:**

- Modify: `docs/domains/work-definition.md`, `docs/architecture.md`, `docs/ui/screen-inventory.md`, `AGENTS.md`

- [ ] **Step 1: Update `docs/domains/work-definition.md`**

Replace the line "Field types are a fixed, code-defined set." with:

```markdown
- Field types are a fixed, code-defined set: `text`, `textarea`, `boolean`, `select`
  (`src/lib/work-definition/field-types.ts`). `select` reads its values from the item's `options`
  column. The builder validates against this set on write and the intake wizard renders from it on
  read, so the two cannot drift.
- **Templates deactivate, never delete** — `work_orders.intake_template_id` is `on delete restrict`.
  Template _items_ can be deleted: `runtime_tasks.origin_item_id` is `on delete set null` and is
  written but never read.
```

- [ ] **Step 2: Update `docs/architecture.md` §4.3**

The `intake_template_items` bullet says `field_type?` without a set. Add after the `config` bullet:

```markdown
- `field_type` ∈ `{text, textarea, boolean, select}` — code-defined and validated in the app layer
  (`src/lib/work-definition/field-types.ts`), not by a DB enum. `options` holds a `select`'s values.
```

- [ ] **Step 3: Update `docs/ui/screen-inventory.md`**

Mark the three screens built, keeping their `[config]` tag:

```
50. Intake templates — list **[config]** — **built**
51. **Intake template builder** (ordered items: task type / task group / field / section; add/remove/reorder) **[config]** — **built**
52. Intake item config (per-item dialog: mandatory, visible, default-selected, selection mode, display style, help text, allow "Other", generates-tasks) **[config]** — **built**
```

- [ ] **Step 4: Update `AGENTS.md`**

Add to the repo-state block: the second `[config]` slice shipped (#50–52); the tenant now defines their own order types; `intake_templates` has `insert`/`update` but no `delete` (`on delete restrict` from `work_orders`) while `intake_template_items` has all three; `field_type` is now a code-defined set of four validated in `src/lib/work-definition/field-types.ts` and shared with the intake wizard, which renders `select` for the first time.

- [ ] **Step 5: Full verification**

Run:

```bash
npx tsc --noEmit
npm run lint
npm run test
npm run test:integration
npm run build
```

Expected: all green.

- [ ] **Step 6: Manual end-to-end check**

Start the dev server (`npm run dev`), sign in as `admin@wiggy.local` / `wiggy-dev-password`, then:

1. `/settings/templates` — "פאה חדשה" is listed with 9 items.
2. Duplicate it. A second row appears, named "פאה חדשה — עותק", **inactive**, also 9 items.
3. Rename the copy to "תיקון פאה" and set its kind to `repair`.
4. Open its builder, remove two items, reorder one, and add a `select` field with three options.
5. Activate it.
6. `/orders/new` — step 2 now offers **two** templates. Pick "תיקון פאה", confirm the select renders its options, complete the wizard, and confirm the generated tasks match the trimmed item list.
7. Confirm "פאה חדשה" and its existing orders are untouched.

This is the path the whole slice exists for.

- [ ] **Step 7: Commit**

```bash
git add docs AGENTS.md
git commit -m "docs: record the intake-template editor slice"
```

---

## Self-review notes

**Spec coverage.** Template list #50 → Tasks 5, 6, 9. Builder #51 → Tasks 2, 7, 10. Item config #52 → Tasks 3, 7, 11. Field types + wizard → Tasks 1, 12. Migration → Task 4. i18n → Task 8. Integration → Task 13. Docs → Task 14. Duplicate-lands-inactive, deactivate-not-delete, renumber-not-swap, and `field_key` optional are each implemented in the task that owns them.

**One spec correction.** The spec says `fetchResolvedIntakeItems` "must select the `options` column — it currently does not". It uses `.select("*")`, so the column _is_ fetched; only the type and the mapping need changing. Task 12 reflects the smaller true change.

**Naming consistency.** `FIELD_TYPES`, `isFieldType`, `requiresOptions`, `parseOptions`, `serializeOptions`, `renumberItems`, `WORK_ORDER_KINDS`, `isWorkOrderKind`, `validateTemplateInput`, `hasTemplateErrors`, `validateItemInput`, `hasItemErrors`, `listIntakeTemplates`, `getIntakeTemplate`, `listTemplateItems`, `listCatalogOptions`, `createTemplateAction`, `updateTemplateAction`, `setTemplateActiveAction`, `duplicateTemplateAction`, `addTemplateItemAction`, `updateTemplateItemAction`, `removeTemplateItemAction`, `moveTemplateItemAction` are each defined once and referenced consistently.

**Deliberately out of scope.** Task types #46–47, task groups #48–49, users and roles #54, branding #55, feedback triage #57.
