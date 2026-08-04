"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Customer } from "./queries";
import {
  hasFieldErrors,
  validateCustomerInput,
  type CustomerFieldErrors,
  type CustomerInput,
} from "./validation";

export type CustomerActionResult =
  | { success: true; customer: Customer }
  | { success: false; errors: CustomerFieldErrors; formError?: string };

export type DeleteCustomerResult =
  { success: true } | { success: false; error: string };

function readInput(formData: FormData): CustomerInput {
  return {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

/** The authoritative permission check (RLS only enforces tenant isolation). */
async function requireCustomerEditor() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "editCustomers")) {
    return null;
  }
  return user;
}

export async function createCustomerAction(
  formData: FormData,
): Promise<CustomerActionResult> {
  const user = await requireCustomerEditor();
  if (!user) {
    return { success: false, errors: {}, formError: "forbidden" };
  }

  const input = readInput(formData);
  const errors = validateCustomerInput(input);
  if (hasFieldErrors(errors)) {
    return { success: false, errors };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: user.businessId,
      name: input.name.trim(),
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
      notes: input.notes.trim() || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { success: false, errors: {}, formError: "generic" };
  }

  revalidatePath("/customers");
  return { success: true, customer: data };
}

export async function updateCustomerAction(
  id: string,
  formData: FormData,
): Promise<CustomerActionResult> {
  const user = await requireCustomerEditor();
  if (!user) {
    return { success: false, errors: {}, formError: "forbidden" };
  }

  const input = readInput(formData);
  const errors = validateCustomerInput(input);
  if (hasFieldErrors(errors)) {
    return { success: false, errors };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .update({
      name: input.name.trim(),
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
      notes: input.notes.trim() || null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return { success: false, errors: {}, formError: "generic" };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true, customer: data };
}

export async function deleteCustomerAction(
  id: string,
): Promise<DeleteCustomerResult> {
  const user = await requireCustomerEditor();
  if (!user) {
    return { success: false, error: "forbidden" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    return { success: false, error: "generic" };
  }

  revalidatePath("/customers");
  return { success: true };
}
