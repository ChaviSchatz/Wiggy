"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  handledAtFor,
  hasFieldErrors,
  validateMissingItemInput,
  validateMissingItemStatusInput,
  type MissingItemFieldErrors,
  type MissingItemInput,
  type MissingItemStatus,
  type MissingItemStatusInput,
} from "./validation";

export type MissingItemActionResult =
  | { success: true }
  | { success: false; errors: MissingItemFieldErrors; formError?: string };

function readInput(formData: FormData): MissingItemInput {
  return {
    workOrderId: String(formData.get("workOrderId") ?? ""),
    kind: String(formData.get("kind") ?? ""),
    description: String(formData.get("description") ?? ""),
    responsibleStaffMemberId: String(
      formData.get("responsibleStaffMemberId") ?? "",
    ),
    notes: String(formData.get("notes") ?? ""),
  };
}

function readStatusInput(formData: FormData): MissingItemStatusInput {
  return {
    status: String(formData.get("status") ?? ""),
    responsibleStaffMemberId: String(
      formData.get("responsibleStaffMemberId") ?? "",
    ),
    notes: String(formData.get("notes") ?? ""),
  };
}

/** The authoritative permission check (RLS only enforces tenant isolation). */
async function requireMissingItemManager() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageMissingItems")) {
    return null;
  }
  return user;
}

/**
 * Revalidates every surface a missing item shows up on: its own list, the
 * order hub's warnings section, and the dashboard alert.
 */
function revalidateMissingItemSurfaces(workOrderId: string) {
  revalidatePath("/missing-items");
  revalidatePath(`/orders/${workOrderId}`);
  revalidatePath("/");
}

/** Create missing item manually (screen inventory #31). */
export async function createMissingItemAction(
  formData: FormData,
): Promise<MissingItemActionResult> {
  const user = await requireMissingItemManager();
  if (!user) {
    return { success: false, errors: {}, formError: "forbidden" };
  }

  const input = readInput(formData);
  const errors = validateMissingItemInput(input);
  if (hasFieldErrors(errors)) {
    return { success: false, errors };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("missing_items")
    .insert({
      business_id: user.businessId,
      work_order_id: input.workOrderId,
      kind: input.kind,
      description: input.description.trim() || null,
      responsible_staff_member_id: input.responsibleStaffMemberId || null,
      notes: input.notes.trim() || null,
    })
    .select("id, work_order_id, kind")
    .single();

  if (error || !data) {
    return { success: false, errors: {}, formError: "generic" };
  }

  await logActivity(supabase, {
    businessId: user.businessId,
    actorUserId: user.id,
    verb: "missing_item_created",
    subjectType: "work_order",
    subjectId: data.work_order_id,
    workOrderId: data.work_order_id,
    payload: { kind: data.kind, source: "manual" },
  });

  revalidateMissingItemSurfaces(data.work_order_id);
  return { success: true };
}

/**
 * Handle a missing item (screen inventory #30): move it along the
 * open -> found -> ordered -> handled lifecycle, optionally re-assigning who
 * is chasing it and updating the notes.
 */
export async function updateMissingItemStatusAction(
  id: string,
  formData: FormData,
): Promise<MissingItemActionResult> {
  const user = await requireMissingItemManager();
  if (!user) {
    return { success: false, errors: {}, formError: "forbidden" };
  }

  const input = readStatusInput(formData);
  const errors = validateMissingItemStatusInput(input);
  if (hasFieldErrors(errors)) {
    return { success: false, errors };
  }
  const status = input.status as MissingItemStatus;

  const supabase = await createServerSupabaseClient();
  const { data: existing, error: fetchError } = await supabase
    .from("missing_items")
    .select("id, work_order_id, kind, status, handled_at")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !existing) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  const { error } = await supabase
    .from("missing_items")
    .update({
      status,
      handled_at: handledAtFor(status, existing.handled_at, new Date()),
      responsible_staff_member_id: input.responsibleStaffMemberId || null,
      notes: input.notes.trim() || null,
    })
    .eq("id", id);
  if (error) {
    return { success: false, errors: {}, formError: "generic" };
  }

  if (existing.status !== status) {
    await logActivity(supabase, {
      businessId: user.businessId,
      actorUserId: user.id,
      verb: "missing_item_status_changed",
      subjectType: "work_order",
      subjectId: existing.work_order_id,
      workOrderId: existing.work_order_id,
      payload: { kind: existing.kind, from: existing.status, to: status },
    });
  }

  revalidateMissingItemSurfaces(existing.work_order_id);
  return { success: true };
}
