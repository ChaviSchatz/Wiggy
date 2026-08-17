"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type AttachmentActionResult =
  | { success: true } | { success: false; error: string };

type ParentType = Tables<"attachments">["parent_type"];
type AttachmentKind = Tables<"attachments">["kind"];

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB -- generous for salon photos/voice notes.

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

/**
 * Add attachment / upload file, photo, or voice note (screen inventory
 * #26-27). Anyone who can see the hub can attach to it (`viewBoard`
 * spans every role, docs/lib/roles.ts) -- attaching a reference photo or a
 * voice note is everyday production work, not an office-only action.
 */
export async function uploadAttachmentAction(
  formData: FormData,
): Promise<AttachmentActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "viewBoard")) {
    return { success: false, error: "forbidden" };
  }

  const file = formData.get("file");
  const parentType = formData.get("parentType") as ParentType | null;
  const parentId = formData.get("parentId") as string | null;
  const kind = formData.get("kind") as AttachmentKind | null;
  const workOrderId = formData.get("workOrderId") as string | null;

  if (!(file instanceof File) || !parentType || !parentId || !kind) {
    return { success: false, error: "generic" };
  }
  if (file.size === 0 || file.size > MAX_FILE_BYTES) {
    return { success: false, error: "fileTooLarge" };
  }

  const supabase = await createServerSupabaseClient();
  const storagePath = `${user.businessId}/${parentType}/${parentId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const upload = await supabase.storage
    .from("attachments")
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (upload.error) {
    return { success: false, error: "generic" };
  }

  const { error: insertError } = await supabase.from("attachments").insert({
    business_id: user.businessId,
    kind,
    parent_type: parentType,
    parent_id: parentId,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || null,
    uploaded_by: user.id,
  });
  if (insertError) {
    await supabase.storage.from("attachments").remove([storagePath]);
    return { success: false, error: "generic" };
  }

  if (workOrderId) {
    await logActivity(supabase, {
      businessId: user.businessId,
      actorUserId: user.id,
      verb: "attachment_added",
      subjectType: parentType === "runtime_task" ? "runtime_task" : "work_order",
      subjectId: parentId,
      workOrderId,
      payload: { fileName: file.name, kind },
    });
  }

  revalidatePath(`/orders/${workOrderId ?? ""}`);
  return { success: true };
}
