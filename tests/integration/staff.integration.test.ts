import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { countOpenTasksForStaff, listStaffMembers } from "@/lib/staff/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Settings slice 1 (screen inventory #53) — the staff editor's RLS boundary
 * and the deactivation contract.
 *
 * 20260830120000_staff_settings_rls.sql grants INSERT and UPDATE but
 * deliberately withholds DELETE, because removal is deactivation: a hard
 * delete would null `assigned_staff_member_id` on completed tasks and erase
 * who did the work. Both halves of that are asserted here.
 *
 * Server Actions themselves need a Next.js request context and aren't
 * exercised — the same boundary every other integration test in this folder
 * draws.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "staff-test-password";

const admin = createAdminClient();

type Tenant = {
  businessId: string;
  userId: string;
  client: SupabaseClient<Database>;
};

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `staff-${label}-${runId}`;
  const email = `staff-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Staff ${label} ${runId}`, slug })
    .select("id")
    .single();
  if (business.error) throw business.error;

  const user = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (user.error) throw user.error;

  const membership = await admin.from("memberships").insert({
    user_id: user.data.user.id,
    business_id: business.data.id,
    role: "admin",
  });
  if (membership.error) throw membership.error;

  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;

  return {
    businessId: business.data.id,
    userId: user.data.user.id,
    client,
  };
}

const tenants: Tenant[] = [];

beforeAll(async () => {
  tenants.push(await seedTenant("a"));
  tenants.push(await seedTenant("b"));
});

afterAll(async () => {
  for (const tenant of tenants) {
    await admin.from("businesses").delete().eq("id", tenant.businessId);
    await admin.auth.admin.deleteUser(tenant.userId).catch(() => {
      // Best effort: a missing user must not fail the suite.
    });
  }
});

async function insertStaff(tenant: Tenant, fullName: string) {
  const inserted = await tenant.client
    .from("staff_members")
    .insert({ business_id: tenant.businessId, full_name: fullName })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

describe("staff_members write access under RLS", () => {
  it("lets a member insert and update staff in their own business", async () => {
    const [a] = tenants;

    const id = await insertStaff(a, `Own ${runId}`);
    const updated = await a.client
      .from("staff_members")
      .update({ title: "Colourist" })
      .eq("id", id)
      .select("id, title");

    expect(updated.error).toBeNull();
    expect(updated.data).toHaveLength(1);
    expect(updated.data?.[0]?.title).toBe("Colourist");
  });

  it("rejects inserting staff into another tenant", async () => {
    const [a, b] = tenants;

    const { error } = await a.client
      .from("staff_members")
      .insert({ business_id: b.businessId, full_name: `Cross ${runId}` });

    expect(error).not.toBeNull();
  });

  it("cannot update another tenant's staff", async () => {
    const [a, b] = tenants;
    const bStaffId = await insertStaff(b, `B staff ${runId}`);

    const { data } = await a.client
      .from("staff_members")
      .update({ full_name: "hijacked" })
      .eq("id", bStaffId)
      .select("id");

    // RLS filters the row out rather than erroring, so zero rows affected is
    // the signal -- the same shape the Server Actions check for.
    expect(data ?? []).toHaveLength(0);

    const stillNamed = await admin
      .from("staff_members")
      .select("full_name")
      .eq("id", bStaffId)
      .single();
    expect(stillNamed.data?.full_name).toBe(`B staff ${runId}`);
  });

  it("does not grant delete to authenticated users", async () => {
    const [a] = tenants;
    const id = await insertStaff(a, `Undeletable ${runId}`);

    const { error } = await a.client
      .from("staff_members")
      .delete()
      .eq("id", id);

    // The migration withholds the DELETE grant on purpose: removal is
    // deactivation, so history keeps who did the work.
    expect(error).not.toBeNull();

    const survives = await admin
      .from("staff_members")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    expect(survives.data).not.toBeNull();
  });

  it("cannot read another tenant's staff", async () => {
    const [a, b] = tenants;
    await insertStaff(b, `B private ${runId}`);

    const visible = await listStaffMembers(a.client, b.businessId);

    expect(visible).toHaveLength(0);
  });
});

describe("deactivation", () => {
  it("keeps existing task assignments when a member is deactivated", async () => {
    const [a] = tenants;
    const staffId = await insertStaff(a, `Assigned ${runId}`);

    const stage = await admin
      .from("work_stages")
      .insert({
        business_id: a.businessId,
        key: "stage-1",
        name: "Stage 1",
        sort_order: 1,
      })
      .select("id")
      .single();
    if (stage.error) throw stage.error;

    const template = await admin
      .from("intake_templates")
      .insert({
        business_id: a.businessId,
        name: "T",
        work_order_kind: "internal",
      })
      .select("id")
      .single();
    if (template.error) throw template.error;

    const order = await admin
      .from("work_orders")
      .insert({
        business_id: a.businessId,
        intake_template_id: template.data.id,
        work_order_kind: "internal",
        number: 1,
        status: "active",
      })
      .select("id")
      .single();
    if (order.error) throw order.error;

    const task = await admin
      .from("runtime_tasks")
      .insert({
        business_id: a.businessId,
        work_order_id: order.data.id,
        title: "assigned task",
        work_stage_id: stage.data.id,
        sequence_order: 0,
        source: "manual",
        status: "in_progress",
        assigned_staff_member_id: staffId,
      })
      .select("id")
      .single();
    if (task.error) throw task.error;

    expect(await countOpenTasksForStaff(a.client, a.businessId, staffId)).toBe(
      1,
    );

    const deactivated = await a.client
      .from("staff_members")
      .update({ is_active: false })
      .eq("id", staffId)
      .select("id");
    expect(deactivated.data).toHaveLength(1);

    // The whole point of deactivating rather than deleting: the task is
    // still theirs, so "who did this" survives.
    const after = await admin
      .from("runtime_tasks")
      .select("assigned_staff_member_id")
      .eq("id", task.data.id)
      .single();
    expect(after.data?.assigned_staff_member_id).toBe(staffId);
  });
});
