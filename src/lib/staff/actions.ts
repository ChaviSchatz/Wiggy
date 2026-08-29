"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hasFieldErrors,
  validateStaffInput,
  type StaffFieldErrors,
  type StaffInput,
} from "./validation";

export type StaffActionResult =
  | { success: true }
  | { success: false; errors: StaffFieldErrors; formError?: string };

function readInput(formData: FormData): StaffInput {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    title: String(formData.get("title") ?? ""),
    defaultWorkStageId: String(formData.get("defaultWorkStageId") ?? ""),
  };
}

/** The authoritative permission check (RLS only enforces tenant isolation). */
async function requireStaffManager() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "manageStaff")) return null;
  return user;
}

export async function createStaffMemberAction(
  formData: FormData,
): Promise<StaffActionResult> {
  const user = await requireStaffManager();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const input = readInput(formData);
  const errors = validateStaffInput(input);
  if (hasFieldErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("staff_members").insert({
    business_id: user.businessId,
    full_name: input.fullName.trim(),
    title: input.title.trim() || null,
    default_work_stage_id: input.defaultWorkStageId || null,
  });
  if (error) return { success: false, errors: {}, formError: "generic" };

  revalidatePath("/settings/staff");
  return { success: true };
}

export async function updateStaffMemberAction(
  id: string,
  formData: FormData,
): Promise<StaffActionResult> {
  const user = await requireStaffManager();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const input = readInput(formData);
  const errors = validateStaffInput(input);
  if (hasFieldErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("staff_members")
    .update({
      full_name: input.fullName.trim(),
      title: input.title.trim() || null,
      default_work_stage_id: input.defaultWorkStageId || null,
    })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  // PostgREST reports no error when a filtered update matches nothing, so the
  // row count is the only signal that anything actually changed.
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidatePath("/settings/staff");
  return { success: true };
}

/**
 * Deactivate / reactivate. There is deliberately no delete: the database
 * withholds the grant (20260830120000_staff_settings_rls.sql) because
 * deleting would null out `assigned_staff_member_id` on completed tasks and
 * erase who did the work.
 *
 * Existing assignments are left untouched -- the staff member simply stops
 * appearing in assignee pickers, which already filter `is_active`. The board
 * and sprint surfaces are revalidated because both render those pickers.
 */
export async function setStaffMemberActiveAction(
  id: string,
  isActive: boolean,
): Promise<StaffActionResult> {
  const user = await requireStaffManager();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("staff_members")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidatePath("/settings/staff");
  revalidatePath("/board");
  revalidatePath("/sprint");
  return { success: true };
}
