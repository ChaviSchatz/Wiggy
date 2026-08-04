import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";

export type Customer = Tables<"customers">;

export const CUSTOMERS_PAGE_SIZE = 20;

export type ListCustomersParams = {
  businessId: string;
  search?: string;
  /** 1-indexed. */
  page?: number;
};

export type ListCustomersResult = {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Server-side search + pagination for the customers list (Archetype A).
 * `business_id` is filtered explicitly even though RLS already scopes it —
 * makes intent clear and lets Postgres use the `business_id` index.
 */
export async function listCustomers(
  supabase: SupabaseClient<Database>,
  { businessId, search, page = 1 }: ListCustomersParams,
): Promise<ListCustomersResult> {
  const pageSize = CUSTOMERS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(from, to);

  const trimmed = search?.trim();
  if (trimmed) {
    const pattern = `%${trimmed}%`;
    query = query.or(
      `name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { customers: data ?? [], total: count ?? 0, page, pageSize };
}

export async function getCustomerById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
