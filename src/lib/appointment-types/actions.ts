"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hasAppointmentTypeErrors,
  validateAppointmentTypeInput,
  type AppointmentTypeFieldErrors,
  type AppointmentTypeInput,
} from "./validation";

export type AppointmentTypeActionResult =
  | { success: true }
  | { success: false; errors: AppointmentTypeFieldErrors; formError?: string };

function readInput(formData: FormData): AppointmentTypeInput {
  return {
    name: String(formData.get("name") ?? ""),
    defaultDurationMinutes: String(
      formData.get("defaultDurationMinutes") ?? "",
    ),
  };
}

/** The authoritative permission check (RLS only enforces tenant isolation). */
async function requireWorkDefinitionEditor() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "editWorkDefinition")) return null;
  return user;
}

function revalidateAppointmentTypeSurfaces() {
  revalidatePath("/settings/appointment-types");
  // The calendar's booking popover lists active types.
  revalidatePath("/calendar");
}

export async function createAppointmentTypeAction(
  formData: FormData,
): Promise<AppointmentTypeActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const input = readInput(formData);
  const errors = validateAppointmentTypeInput(input);
  if (hasAppointmentTypeErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("appointment_types").insert({
    business_id: user.businessId,
    name: input.name.trim(),
    default_duration_minutes: input.defaultDurationMinutes.trim()
      ? Number(input.defaultDurationMinutes)
      : null,
  });
  if (error) return { success: false, errors: {}, formError: "generic" };

  revalidateAppointmentTypeSurfaces();
  return { success: true };
}

export async function updateAppointmentTypeAction(
  id: string,
  formData: FormData,
): Promise<AppointmentTypeActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const input = readInput(formData);
  const errors = validateAppointmentTypeInput(input);
  if (hasAppointmentTypeErrors(errors)) return { success: false, errors };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("appointment_types")
    .update({
      name: input.name.trim(),
      default_duration_minutes: input.defaultDurationMinutes.trim()
        ? Number(input.defaultDurationMinutes)
        : null,
    })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidateAppointmentTypeSurfaces();
  return { success: true };
}

export async function setAppointmentTypeActiveAction(
  id: string,
  isActive: boolean,
): Promise<AppointmentTypeActionResult> {
  const user = await requireWorkDefinitionEditor();
  if (!user) return { success: false, errors: {}, formError: "forbidden" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("appointment_types")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("business_id", user.businessId)
    .select("id");
  if (error) return { success: false, errors: {}, formError: "generic" };
  if (!data || data.length === 0) {
    return { success: false, errors: {}, formError: "notFound" };
  }

  revalidateAppointmentTypeSurfaces();
  return { success: true };
}
