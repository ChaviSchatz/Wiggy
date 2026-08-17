"use server";

import { getCurrentUser } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hasFieldErrors,
  validateFeedbackInput,
  type FeedbackFieldErrors,
  type FeedbackInput,
} from "./validation";

export type FeedbackActionResult =
  | { success: true }
  | { success: false; errors: FeedbackFieldErrors; formError?: string };

function readInput(formData: FormData): FeedbackInput {
  return {
    kind: String(formData.get("kind") ?? ""),
    message: String(formData.get("message") ?? ""),
  };
}

/**
 * Submit feedback (screen inventory #58). Open to every authenticated member
 * of the tenant -- the feedback box is the one action with no role gate
 * (docs/ui/information-architecture.md: "Feedback (all)"), so membership is
 * the whole check. Nothing to revalidate: v1 has no view that reads these back
 * (screen inventory #57 is [config]).
 */
export async function submitFeedbackAction(
  formData: FormData,
): Promise<FeedbackActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, errors: {}, formError: "forbidden" };
  }

  const input = readInput(formData);
  const errors = validateFeedbackInput(input);
  if (hasFieldErrors(errors)) {
    return { success: false, errors };
  }

  const pagePath = String(formData.get("pagePath") ?? "").trim();

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("feedback_items").insert({
    business_id: user.businessId,
    submitted_by: user.id,
    kind: input.kind.trim(),
    message: input.message.trim(),
    page_path: pagePath || null,
  });

  if (error) {
    return { success: false, errors: {}, formError: "generic" };
  }

  return { success: true };
}
