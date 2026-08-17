import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export type Attachment = Tables<"attachments">;
export type AttachmentWithUrl = Attachment & { url: string | null };

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour -- long enough for a page view.

/**
 * Files & photos / audio sections of the hub (docs/ui/work-order-hub.md).
 * The bucket is private (Slice 6 migration), so every attachment needs a
 * signed URL to actually render -- resolved server-side at fetch time
 * rather than per-`<img>` client requests.
 */
export async function fetchAttachmentsForParent(
  supabase: SupabaseClient<Database>,
  parentType: Attachment["parent_type"],
  parentId: string,
): Promise<AttachmentWithUrl[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const attachments = data ?? [];
  if (attachments.length === 0) return [];

  const signed = await Promise.all(
    attachments.map((attachment) =>
      supabase.storage
        .from("attachments")
        .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS),
    ),
  );

  return attachments.map((attachment, index) => ({
    ...attachment,
    url: signed[index].data?.signedUrl ?? null,
  }));
}
