import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getCurrentUserFromClient } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

/**
 * `getCurrentUserFromClient` against local Supabase: signs in as a seeded
 * user (with a real session + RLS in effect, not the service-role client)
 * and asserts the resolved identity/membership/role.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "current-user-test-password";

const admin = createAdminClient();

type Seeded = {
  userId: string;
  businessId: string;
  client: SupabaseClient<Database>;
  staffMemberId: string | null;
};

async function seedUser(
  label: string,
  role: string,
  options: {
    fullName?: string;
    active?: boolean;
    bookableStaffMember?: boolean;
    /** Links a staff_members row like `bookableStaffMember`, but with `is_bookable: false` -- distinguishes "no row" from "row present but not bookable". */
    nonBookableStaffMember?: boolean;
  } = {},
): Promise<Seeded> {
  const slug = `cu-${label}-${runId}`;
  const email = `cu-${label}-${runId}@wiggy.test`;

  const business = await admin
    .from("businesses")
    .insert({ name: `Current User ${label} ${runId}`, slug })
    .select("id")
    .single();
  if (business.error) throw business.error;

  const user = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (user.error) throw user.error;

  if (options.fullName) {
    const profileUpdate = await admin
      .from("profiles")
      .update({ full_name: options.fullName })
      .eq("id", user.data.user.id);
    if (profileUpdate.error) throw profileUpdate.error;
  }

  const membership = await admin.from("memberships").insert({
    user_id: user.data.user.id,
    business_id: business.data.id,
    role,
    is_active: options.active ?? true,
  });
  if (membership.error) throw membership.error;

  let staffMemberId: string | null = null;
  if (options.bookableStaffMember || options.nonBookableStaffMember) {
    const staffMember = await admin
      .from("staff_members")
      .insert({
        business_id: business.data.id,
        user_id: user.data.user.id,
        full_name: options.fullName ?? label,
        is_bookable: Boolean(options.bookableStaffMember),
      })
      .select("id")
      .single();
    if (staffMember.error) throw staffMember.error;
    staffMemberId = staffMember.data.id;
  }

  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;

  return {
    userId: user.data.user.id,
    businessId: business.data.id,
    client,
    staffMemberId,
  };
}

const seeded: Seeded[] = [];

beforeAll(async () => {
  seeded.push(await seedUser("worker", "worker", { fullName: "Danna Worker" }));
  seeded.push(await seedUser("fresh", "manager")); // no full_name yet
  seeded.push(
    await seedUser("inactive", "admin", {
      fullName: "Inactive Admin",
      active: false,
    }),
  );
  seeded.push(
    await seedUser("bookable", "worker", {
      fullName: "Bina Bookable",
      bookableStaffMember: true,
    }),
  );
  seeded.push(
    await seedUser("roster-only", "worker", {
      fullName: "Rosie Roster",
      nonBookableStaffMember: true,
    }),
  );
});

afterAll(async () => {
  for (const user of seeded) {
    await admin.from("businesses").delete().eq("id", user.businessId);
    await admin.auth.admin.deleteUser(user.userId);
  }
});

describe("getCurrentUserFromClient", () => {
  it("resolves identity, business, and role for a signed-in worker", async () => {
    const [worker] = seeded;

    const user = await getCurrentUserFromClient(worker.client);

    expect(user).not.toBeNull();
    expect(user?.id).toBe(worker.userId);
    expect(user?.role).toBe("worker");
    expect(user?.fullName).toBe("Danna Worker");
    expect(user?.businessId).toBe(worker.businessId);
    // No staff_members row is linked for this fixture -- the "no roster
    // link" baseline case.
    expect(user?.staffMemberId).toBeNull();
    expect(user?.isBookable).toBe(false);
  });

  it("resolves staffMemberId and isBookable for a linked, bookable staff member", async () => {
    const [, , , bookable] = seeded;

    const user = await getCurrentUserFromClient(bookable.client);

    expect(user).not.toBeNull();
    expect(user?.staffMemberId).toBe(bookable.staffMemberId);
    expect(user?.isBookable).toBe(true);
  });

  it("resolves staffMemberId but isBookable: false for a linked, non-bookable staff member", async () => {
    // Distinguishes "no roster row" from "roster row present but not
    // bookable" -- a bug that derived isBookable from row existence rather
    // than the actual column would pass the two tests above but fail this
    // one.
    const [, , , , rosterOnly] = seeded;

    const user = await getCurrentUserFromClient(rosterOnly.client);

    expect(user).not.toBeNull();
    expect(user?.staffMemberId).toBe(rosterOnly.staffMemberId);
    expect(user?.isBookable).toBe(false);
  });

  it("carries a usable business timezone even when the tenant never set one", async () => {
    const [worker] = seeded;

    const user = await getCurrentUserFromClient(worker.client);

    // `businesses.timezone` has a schema default, so a tenant that never
    // opened Settings still resolves to a real IANA zone. Every date
    // computation (sprint dates, "completed today") depends on this.
    expect(user?.timezone).toBeTruthy();
    expect(
      () => new Intl.DateTimeFormat("en-CA", { timeZone: user!.timezone }),
    ).not.toThrow();
  });

  it("returns a profile with no display name for a first-login user", async () => {
    const [, fresh] = seeded;

    const user = await getCurrentUserFromClient(fresh.client);

    expect(user).not.toBeNull();
    expect(user?.role).toBe("manager");
    expect(user?.fullName).toBeNull();
  });

  it("returns null for a user with no active membership", async () => {
    const [, , inactive] = seeded;

    const user = await getCurrentUserFromClient(inactive.client);

    expect(user).toBeNull();
  });

  it("returns null when there is no authenticated session", async () => {
    const anonymousClient = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const user = await getCurrentUserFromClient(anonymousClient);

    expect(user).toBeNull();
  });
});
