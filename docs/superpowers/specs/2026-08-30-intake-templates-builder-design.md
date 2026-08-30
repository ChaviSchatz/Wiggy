# Intake templates and the template builder (design)

> **Status:** approved design, not yet implemented.
> **Covers:** screen inventory #50 (intake templates list), #51 (intake template builder),
> #52 (intake item config).
> **Follows:** the settings slice that shipped #44/#53/#56
> (`2026-08-30-settings-hub-staff-business-design.md`).

## Why now

The New Order wizard's step 2 is **already a multi-template picker** — it renders one radio per
active template. Only one template is seeded ("פאה חדשה", kind `customer`), which is why the salon
sees a single option. Adding a row to `intake_templates` produces a second choice with no code
change at all.

What is missing is the editor. Today, adding "תיקון פאה" means a developer edits
`scripts/seed-work-definition.ts` and reseeds. ADR 0002 makes this the mechanism that makes resale
viable ("onboarding a new salon is configuration, not a code fork"), and the legacy system Fradi
and Tzipi use already has `WorkOrderTypesSettings.tsx` and `IntakeFormsSettings.tsx`. So this is
both the ADR's stated purpose and a parity gap.

Task types and groups already exist (8 and 2, seeded), so the builder can compose the current
catalog without the task-type editor (#46–49) being built first. Those remain deferred.

## Scope

**In:** template list with create/edit/duplicate/deactivate (#50); the builder's ordered item list
with add/remove/reorder (#51); the per-item config dialog (#52); a code-defined field-type
vocabulary including a working `select`; the intake wizard changes that `select` requires.

**Out:** task types (#46–47), task groups (#48–49), users and roles (#54), branding (#55), feedback
triage (#57). Tenant-defined `work_order_kind` values — see below.

## Routes and permissions

```
/settings/templates          list
/settings/templates/[id]     builder
```

Both gated by the existing **`editWorkDefinition`** (manager + admin). No new permission. A third
card joins the settings hub through `sections.ts`, which already filters by role.

## Template list (#50)

`DataTable`: name, order kind, item count, status. Active first, then by name — matching the staff
list.

Row actions:

- **Edit details** — dialog for `name`, `work_order_kind`, `description`.
- **Duplicate** — clones the template row and all its items, named `"<name> — עותק"`, created
  **inactive** so a half-finished copy cannot appear in the New Order wizard. Items reference shared
  catalog rows (`task_type_id`, `task_group_id`), so nothing needs remapping. Template names are not
  unique-constrained and this does not add one: duplicating twice yields two identically-named
  drafts, which is visible in the list and fixed by renaming. Enforcing uniqueness would be a new
  product rule, not something this slice should decide.
- **Activate / deactivate** — the only removal path.

**Create** opens the same details dialog, then lands in the builder with an empty item list.

### Deactivation, not deletion

`work_orders.intake_template_id` is `on delete restrict`: the database refuses to delete a template
any order has ever used, and attempting it would surface a foreign-key error rather than a clean
message. The migration therefore grants `insert, update` only.

An inactive template disappears from the wizard (`createWorkOrderAction` already rejects
`!template.is_active`) while every existing order keeps working, because orders snapshot their
intake at generation time (§5.1).

### `work_order_kind` is chosen, not invented

The kind renders through `t("kind.<value>")` and is the identity shown wherever an order has no
customer — board cards, My Work, approvals, the hub header. All five values
(`customer`, `display_wig`, `internal`, `missing_item`, `repair`) have Hebrew labels in the message
catalog; a tenant-invented value would render as a raw key.

So the tenant's free text is the template **name**; the kind is a category picked from five.
"תיקון פאה" is a template named that, with kind `repair`.

## The builder (#51)

Header with the template's name and kind, then the ordered item list, then **Add item**.

Each row shows what the item _is_, resolved per kind:

| `item_kind`  | Identity shown                    | Summary line                        |
| ------------ | --------------------------------- | ----------------------------------- |
| `task_type`  | task type's name from the catalog | mandatory · pre-selected            |
| `task_group` | group's name                      | multi-select · checklist            |
| `field`      | `field_label`                     | text · required · flags missing top |
| `section`    | `config.section_title`            | allows "other"                      |

Row actions: edit, up, down, remove. Adding asks for the kind first, then either picks a referent
from the catalog (task type / group) or collects the field/section details.

**Every change persists immediately** via a Server Action plus `router.refresh()` — the idiom sprint
planning already established for an ordered list, which `screen-designs.md` asks these screens to
reuse "rather than introducing a second reordering idiom". A client-side draft with an explicit save
was rejected: it introduces a dirty-state paradigm nothing else in the app has, requires diffing an
ordered list against the database, and opens a lost-work window — a lot of machinery for a screen
edited a few times a year.

### Reordering renumbers rather than swaps

Sprint planning uses fractional ranks specifically to _avoid_ renumbering, because its lanes span
many rows per assignee. A template holds roughly ten items, so the opposite trade-off applies: each
move renumbers the whole list `0..n-1` in one bulk update.

This is deliberate. `sort_order` defaults to `0`, so a template can hold duplicate values, and a
swap-based move would silently do nothing in that case. Renumbering is idempotent, self-heals
duplicates, and is obviously correct at this size.

The ordering itself is a pure function:

```ts
renumberItems<T>(items: T[], fromIndex: number, direction: "up" | "down"): T[]
```

It returns the list in its new order; the action writes `sort_order = index`. Same pure-core /
thin-adapter split as `availability.ts` and `queue/derive.ts`.

### Removing an item is safe

`runtime_tasks.origin_item_id` references `intake_template_items` `on delete set null`, and that
column is **written but never read** — it is provenance only. Combined with snapshot-on-use (title,
description, stage and approval are all copied onto the task) and `intake_responses` storing label
and value alongside the item id, an existing order stays fully readable after the item that produced
it is gone. The only loss is a back-link nothing follows.

Removal still asks for confirmation, because the change to the _template_ is real.

## Item config (#52)

Only keys valid for the item's kind are rendered, so a section never offers `selection_mode`.

**`field`** — `field_label`, `field_key`, `field_type`, `options` _(only when `select`)_; then
`visible`, `mandatory`, `help_text`, `missing_item_kind`.

`field_label` is required — it is what the intake form shows. `field_key` stays **optional**,
matching the schema and the generator, which falls back `fieldLabel ?? fieldKey ?? id` when labelling
`intake_responses`. It is useful as a stable identifier (the seed finds the missing-stock flags by
`field_key === "no_top"`), so the dialog offers it with help text saying so, but does not demand it.

`options` is edited as one value per line in a `Textarea`, trimmed and blank-lines-dropped on save,
and stored as a JSON string array. A repeatable add/remove row control would be more
"form-builder", but it is materially more UI for a list that is typically three or four short
values, and one-per-line is unambiguous in RTL.

**`task_type`** — `mandatory`, `default_selected`, `generates_runtime_tasks`.

**`task_group`** — `selection_mode` (`single` / `multi` / `all`), `display_style`
(`checklist` / `dropdown` / `list`), `generates_runtime_tasks`.

**`section`** — `section_title`, `help_text`, `allow_other`, `other_default_work_stage_id`
_(only when `allow_other`)_.

All eleven config keys from architecture §4.3 are exposed. Two carry explanatory copy because their
effect is not visible from the label:

- **`missing_item_kind`** turns an ordinary field into a stock-shortage flag — answering it creates
  a `missing_items` row and surfaces it on the dashboard (ADR 0011, §6.5).
- **`generates_runtime_tasks`** unchecked means the selection produces nothing. It stays editable
  rather than locked, but the dialog says plainly what it does, since it is the one setting that can
  quietly make an item pointless.

## Field types

`src/lib/work-definition/field-types.ts` defines the vocabulary the schema deliberately left to the
app layer. `intake_template_items.field_type` has no database enum, and the migration comment says
the fixed set is "code-defined, to be validated in the app layer once the work-definition domain
module (and its [config] editors) is built". This is that module.

```ts
export const FIELD_TYPES = ["text", "textarea", "boolean", "select"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export function isFieldType(value: string): value is FieldType;
export function requiresOptions(type: FieldType): boolean; // select only
export function parseOptions(raw: unknown): string[]; // from the options jsonb
```

The builder validates against it on write; the intake wizard renders from it on read. One source,
two consumers, no drift.

### Wizard changes that `select` requires

`step-intake.tsx` handles `boolean` and `textarea` today and falls through to a text input for
everything else. Adding `select` needs four changes:

1. A `<select>` branch rendering from `options`.
2. `fetchResolvedIntakeItems` must select the `options` column — it currently does not.
3. `ResolvedIntakeItem` must carry `options`; it currently carries `fieldType` only.
4. The existing fallback to a text input **stays**. The editor can no longer create an unrecognised
   type, but a legacy row must still render rather than crash.

The chosen option snapshots into `intake_responses` verbatim, consistent with `boolean` storing its
affirmative label rather than `true`.

## Modules

```
src/lib/work-definition/
  field-types.ts        vocabulary + options parsing (pure)
  field-types.test.ts
  reorder.ts            renumberItems (pure)
  reorder.test.ts
  validation.ts         template + item input validation (pure)
  validation.test.ts
  templates.ts          template queries
  template-items.ts     item queries
  actions.ts            template create / update / duplicate / set-active
  item-actions.ts       item add / update-config / remove / move
```

Same shape as `src/lib/staff/` and `src/lib/customers/`: pure logic separated from thin Server
Action adapters, per architecture §1.3. Actions are split across two files because template-level
and item-level operations have distinct inputs and revalidation targets.

## Migration

```sql
grant insert, update on public.intake_templates to authenticated;              -- no DELETE
grant insert, update, delete on public.intake_template_items to authenticated;
```

The asymmetry is intentional: templates cannot be deleted (`on delete restrict` from `work_orders`),
items can (`on delete set null` from `runtime_tasks.origin_item_id`, and nothing reads it).

`intake_templates` policies check `is_business_member(business_id)` directly.
`intake_template_items` has no `business_id` — tenancy derives from its parent — so its policies join
through `intake_templates`, the same shape `task_group_items_select_members` already uses:

```sql
using (
  exists (
    select 1 from public.intake_templates t
    where t.id = intake_template_items.intake_template_id
      and public.is_business_member(t.business_id)
  )
)
```

As everywhere since Slice 4, RLS enforces tenant isolation only; _who_ may edit is enforced in the
app layer (`editWorkDefinition`).

## Error handling

Actions return the existing form-action shape
(`{ success: true } | { success: false; errors; formError? }`), with validation pure and separate.

Every mutation checks the **affected row count**, not just `error`. PostgREST reports no error when
a filtered mutation matches nothing; three bugs of exactly that shape were fixed in `board/actions.ts`
and `work-orders/actions.ts` on 2026-08-29.

## Testing

**Unit (Vitest, no Supabase)**

- `field-types.ts` — the vocabulary, `requiresOptions`, and `parseOptions` against malformed or
  absent jsonb.
- `renumberItems` — move up and down, both edges as no-ops, and a list with duplicate `sort_order`
  values self-healing into `0..n-1`.
- `validation.ts` — required template name; `field_label` required on field items while `field_key`
  stays optional; `select` requiring at least one non-blank option; `section_title` required on
  sections.

**Integration (local Supabase, RLS enforced)**

- Cross-tenant insert and update denied on `intake_templates`.
- Cross-tenant insert, update and delete denied on `intake_template_items` through the parent join.
- Duplicating a template copies its items and lands inactive.
- Deleting a template referenced by a work order is refused.
- Auth users are cleaned up in `afterAll`, unlike the older integration files which leak one per run.

**Manual**
Build "תיקון פאה" by duplicating "פאה חדשה", trim its items, activate it, then confirm it appears as
a second option in the New Order wizard and generates the expected runtime tasks. That end-to-end
path is the reason this slice exists.

## Documentation

Updated in the same change, per AGENTS.md:

- `docs/domains/work-definition.md` — the field-type set is now code-defined and enumerated.
- `docs/architecture.md` §4.3 — drop the "to be validated later" caveat on `field_type`; note
  `options` is now consumed.
- `docs/ui/screen-inventory.md` — #50, #51, #52 built.
- `AGENTS.md` — repo-state note covering the slice and the delete-grant asymmetry.

No ADR. This implements screens the inventory already specifies and fulfils ADR 0002; it makes no
new product decision. The deactivate-vs-delete split is a consequence of existing foreign keys,
recorded here and in the migration comment.
