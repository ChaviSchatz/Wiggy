import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

/**
 * appointments + appointment_types RLS, and the customer_id restrict FK
 * (20260914090300_appointments_schema.sql): unlike work_orders.customer_id
 * (on delete set null), appointments.customer_id is `on delete restrict` --
 * a customer with appointment history cannot be deleted. Both tables also
 * withhold DELETE from `authenticated` entirely (20260914090200_
 * appointment_types_rls.sql / 20260914090400_appointments_rls.sql),
 * mirroring staff_members/intake_templates elsewhere in this codebase.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "appointments-test-password";

const admin = createAdminClient();

type Tenant = {
  businessId: string;
  client: SupabaseClient<Database>;
};

async function seedTenant(label: string): Promise<Tenant> {
  const slug = `appt-${label}-${runId}`;
  const email = `appt-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Appointments ${label} ${runId}`, slug })
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

  return { businessId: business.data.id, client };
}

const tenants: Tenant[] = [];

// Seeded (via admin client) within business A: a bookable staff member, a
// customer, an appointment_type, and the appointment row linking all three.
let staffMemberId: string;
let customerId: string;
let appointmentTypeId: string;
let appointmentId: string;

beforeAll(async () => {
  tenants.push(await seedTenant("a"));
  tenants.push(await seedTenant("b"));
  const [a] = tenants;

  const staffMember = await admin
    .from("staff_members")
    .insert({
      business_id: a.businessId,
      full_name: `Bookable Staff ${runId}`,
      is_bookable: true,
    })
    .select("id")
    .single();
  if (staffMember.error) throw staffMember.error;
  staffMemberId = staffMember.data.id;

  const customer = await admin
    .from("customers")
    .insert({
      business_id: a.businessId,
      name: `Appointment Customer ${runId}`,
      phone: "050-2222222",
    })
    .select("id")
    .single();
  if (customer.error) throw customer.error;
  customerId = customer.data.id;

  const appointmentType = await admin
    .from("appointment_types")
    .insert({
      business_id: a.businessId,
      name: `Consultation ${runId}`,
      default_duration_minutes: 30,
    })
    .select("id")
    .single();
  if (appointmentType.error) throw appointmentType.error;
  appointmentTypeId = appointmentType.data.id;

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

  const appointment = await admin
    .from("appointments")
    .insert({
      business_id: a.businessId,
      staff_member_id: staffMemberId,
      customer_id: customerId,
      appointment_type_id: appointmentTypeId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select("id")
    .single();
  if (appointment.error) throw appointment.error;
  appointmentId = appointment.data.id;
});

afterAll(async () => {
  // The seeded appointment must be removed before the customer/business
  // teardown can succeed, since customer_id is on delete restrict; use the
  // admin (service_role) client, which has unrestricted DML.
  await admin.from("appointments").delete().eq("id", appointmentId);
  for (const tenant of tenants) {
    await admin.from("businesses").delete().eq("id", tenant.businessId);
  }
});

describe("appointments RLS", () => {
  it("lets a member read their own business's appointments", async () => {
    const [a] = tenants;

    const { data, error } = await a.client
      .from("appointments")
      .select("id")
      .eq("id", appointmentId)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(appointmentId);
  });

  it("hides another business's appointments entirely", async () => {
    const [, b] = tenants;

    const { data, error } = await b.client
      .from("appointments")
      .select("id")
      .eq("id", appointmentId);

    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("rejects inserting an appointment into another business", async () => {
    const [a, b] = tenants;

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

    const { error } = await b.client.from("appointments").insert({
      business_id: a.businessId,
      staff_member_id: staffMemberId,
      customer_id: customerId,
      appointment_type_id: appointmentTypeId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });

    expect(error).not.toBeNull();
  });

  it("blocks deleting a customer who has an appointment on the books", async () => {
    const [a] = tenants;

    const { error } = await a.client
      .from("customers")
      .delete()
      .eq("id", customerId);

    // customer_id is `on delete restrict`, unlike work_orders.customer_id
    // (`on delete set null`) -- deleting the customer must fail with the FK
    // violation, not merely be filtered out by RLS.
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23503");

    const stillThere = await admin
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .maybeSingle();
    expect(stillThere.data?.id).toBe(customerId);
  });

  it("never grants delete on appointments or appointment_types", async () => {
    const [a] = tenants;

    const deleteAppointment = await a.client
      .from("appointments")
      .delete()
      .eq("id", appointmentId);
    expect(deleteAppointment.error).not.toBeNull();

    const appointmentStillThere = await admin
      .from("appointments")
      .select("id")
      .eq("id", appointmentId)
      .maybeSingle();
    expect(appointmentStillThere.data?.id).toBe(appointmentId);

    const deleteAppointmentType = await a.client
      .from("appointment_types")
      .delete()
      .eq("id", appointmentTypeId);
    expect(deleteAppointmentType.error).not.toBeNull();

    const typeStillThere = await admin
      .from("appointment_types")
      .select("id")
      .eq("id", appointmentTypeId)
      .maybeSingle();
    expect(typeStillThere.data?.id).toBe(appointmentTypeId);
  });
});
