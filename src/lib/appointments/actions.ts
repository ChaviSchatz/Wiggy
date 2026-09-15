"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import type { CurrentUser } from "@/lib/auth/types";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canWriteAppointments } from "./guards";
import { listOverlappingAppointments } from "./queries";
import {
  canTransitionStatus,
  validateAppointmentTimes,
} from "./validation";
import type { Appointment, AppointmentStatus } from "./types";

export type BookAppointmentInput = {
  staffMemberId: string;
  customerId: string;
  workOrderId: string | null;
  appointmentTypeId: string;
  startsAt: string;
  endsAt: string;
  notes: string;
};

export type AppointmentActionResult =
  | { success: true; appointmentId: string; hadOverlapWarning: boolean }
  | { success: false; error: string };

/** The authoritative permission check (RLS only enforces tenant isolation). */
async function requireAppointmentManager() {
  const user = await getCurrentUser();
  if (!user || !canWriteAppointments(can(user.role, "manageAppointments"))) {
    return null;
  }
  return user;
}

function revalidateAppointmentSurfaces(workOrderId: string | null) {
  revalidatePath("/calendar");
  revalidatePath("/board");
  if (workOrderId) revalidatePath(`/orders/${workOrderId}`);
}

function readBookInput(formData: FormData): BookAppointmentInput {
  const workOrderId = String(formData.get("workOrderId") ?? "");
  return {
    staffMemberId: String(formData.get("staffMemberId") ?? ""),
    customerId: String(formData.get("customerId") ?? ""),
    workOrderId: workOrderId || null,
    appointmentTypeId: String(formData.get("appointmentTypeId") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

/**
 * Books a new appointment. Double-booking is warn-but-allow (design spec):
 * an overlap never blocks the write, it's only reported back so the UI can
 * show the warning the caller already confirmed past, or show it for the
 * first time on a plain (non-`forceConfirm`) submission.
 */
export async function createAppointmentAction(
  formData: FormData,
  forceConfirm: boolean,
): Promise<AppointmentActionResult> {
  const user = await requireAppointmentManager();
  if (!user) return { success: false, error: "forbidden" };

  const input = readBookInput(formData);
  if (!input.staffMemberId || !input.customerId || !input.appointmentTypeId) {
    return { success: false, error: "required" };
  }
  const timeError = validateAppointmentTimes(input.startsAt, input.endsAt);
  if (timeError) return { success: false, error: timeError };

  const supabase = await createServerSupabaseClient();

  const overlaps = await listOverlappingAppointments(
    supabase,
    user.businessId,
    input.staffMemberId,
    input.startsAt,
    input.endsAt,
  );
  if (overlaps.length > 0 && !forceConfirm) {
    return { success: false, error: "overlap" };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      business_id: user.businessId,
      staff_member_id: input.staffMemberId,
      customer_id: input.customerId,
      work_order_id: input.workOrderId,
      appointment_type_id: input.appointmentTypeId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      notes: input.notes.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { success: false, error: "generic" };

  revalidateAppointmentSurfaces(input.workOrderId);
  return { success: true, appointmentId: data.id, hadOverlapWarning: overlaps.length > 0 };
}

/** Reschedules/edits a `scheduled` appointment. Same overlap-warning shape as create. */
export async function updateAppointmentAction(
  id: string,
  formData: FormData,
  forceConfirm: boolean,
): Promise<AppointmentActionResult> {
  const user = await requireAppointmentManager();
  if (!user) return { success: false, error: "forbidden" };

  const input = readBookInput(formData);
  if (!input.staffMemberId || !input.customerId || !input.appointmentTypeId) {
    return { success: false, error: "required" };
  }
  const timeError = validateAppointmentTimes(input.startsAt, input.endsAt);
  if (timeError) return { success: false, error: timeError };

  const supabase = await createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("appointments")
    .select("id, status, work_order_id")
    .eq("id", id)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (fetchError) return { success: false, error: "generic" };
  if (!existing) return { success: false, error: "notFound" };
  if (!canTransitionStatus(existing.status, "scheduled")) {
    return { success: false, error: "notEditable" };
  }

  const overlaps = await listOverlappingAppointments(
    supabase,
    user.businessId,
    input.staffMemberId,
    input.startsAt,
    input.endsAt,
    id,
  );
  if (overlaps.length > 0 && !forceConfirm) {
    return { success: false, error: "overlap" };
  }

  // Re-assert `status` unchanged at write time, not just at the read above:
  // closes the window where a concurrent cancel/complete could land between
  // this action's status check and its write, which would otherwise let a
  // reschedule silently overwrite a since-cancelled appointment's details.
  const { data: updated, error } = await supabase
    .from("appointments")
    .update({
      staff_member_id: input.staffMemberId,
      customer_id: input.customerId,
      work_order_id: input.workOrderId,
      appointment_type_id: input.appointmentTypeId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      notes: input.notes.trim() || null,
    })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .eq("status", existing.status)
    .select("id");
  if (error) return { success: false, error: "generic" };
  if (!updated || updated.length === 0) {
    return { success: false, error: "notEditable" };
  }

  revalidateAppointmentSurfaces(input.workOrderId || existing.work_order_id);
  return { success: true, appointmentId: id, hadOverlapWarning: overlaps.length > 0 };
}

/** Fields `setStatus` may additionally write alongside `status` -- typed narrowly so a typo'd key fails to compile instead of silently writing the wrong column. */
type StatusExtra = Partial<Pick<Appointment, "cancelled_at" | "cancelled_by">>;

/** Takes the already-resolved `user` rather than re-resolving it, so the three thin wrappers below only pay for one `getCurrentUser()` call each. */
async function setStatus(
  user: CurrentUser,
  id: string,
  status: AppointmentStatus,
  extra: StatusExtra = {},
): Promise<AppointmentActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: existing, error: fetchError } = await supabase
    .from("appointments")
    .select("id, status, work_order_id")
    .eq("id", id)
    .eq("business_id", user.businessId)
    .maybeSingle();
  if (fetchError) return { success: false, error: "generic" };
  if (!existing) return { success: false, error: "notFound" };
  if (!canTransitionStatus(existing.status, status)) {
    return { success: false, error: "notEditable" };
  }

  // Re-assert `status` unchanged at write time (see updateAppointmentAction
  // for the same reasoning): closes the window where a concurrent status
  // change could land between the check above and this write.
  const { data: updated, error } = await supabase
    .from("appointments")
    .update({ status, ...extra })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .eq("status", existing.status)
    .select("id");
  if (error) return { success: false, error: "generic" };
  if (!updated || updated.length === 0) {
    return { success: false, error: "notEditable" };
  }

  revalidateAppointmentSurfaces(existing.work_order_id);
  return { success: true, appointmentId: id, hadOverlapWarning: false };
}

export async function completeAppointmentAction(
  id: string,
): Promise<AppointmentActionResult> {
  const user = await requireAppointmentManager();
  if (!user) return { success: false, error: "forbidden" };
  return setStatus(user, id, "completed");
}

export async function markNoShowAction(
  id: string,
): Promise<AppointmentActionResult> {
  const user = await requireAppointmentManager();
  if (!user) return { success: false, error: "forbidden" };
  return setStatus(user, id, "no_show");
}

export async function cancelAppointmentAction(
  id: string,
): Promise<AppointmentActionResult> {
  const user = await requireAppointmentManager();
  if (!user) return { success: false, error: "forbidden" };
  return setStatus(user, id, "cancelled", {
    cancelled_at: new Date().toISOString(),
    cancelled_by: user.id,
  });
}

/**
 * Populates the booking form's optional work-order picker once a customer
 * is chosen. Read-only, no permission check beyond authentication -- the
 * caller already passed the page-level `manageAppointments` gate to reach
 * the booking form at all.
 */
export async function listWorkOrdersForCustomerAction(
  customerId: string,
): Promise<{ id: string; number: number }[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("work_orders")
    .select("id, number")
    .eq("business_id", user.businessId)
    .eq("customer_id", customerId)
    .order("number", { ascending: false });
  if (error) return [];
  return data ?? [];
}
