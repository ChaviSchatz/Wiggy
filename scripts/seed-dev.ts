/**
 * Idempotent dev seed: one business + one admin user + membership, plus the
 * Slice 2 work-definition catalog (work stages, staff, task types/groups,
 * one "New Wig" intake template).
 *
 * Run with: npm run seed:dev
 *
 * Uses the service-role admin client (bypasses RLS). Auth users are created via
 * the GoTrue admin API; the `handle_new_user` trigger creates the matching
 * profile row. Safe to run repeatedly — existing rows are reused.
 */
import { createAdminClient } from "../src/lib/supabase/admin.ts";
import { seedWorkDefinition } from "./seed-work-definition.ts";

const BUSINESS_SLUG = "wiggy-dev";
const BUSINESS_NAME = "Wiggy Dev Salon";
const ADMIN_EMAIL = "admin@wiggy.local";
const ADMIN_PASSWORD = "wiggy-dev-password";
const ADMIN_NAME = "Wiggy Admin";

async function main() {
  const supabase = createAdminClient();

  // 1. Business (idempotent on slug).
  const existingBusiness = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", BUSINESS_SLUG)
    .maybeSingle();
  if (existingBusiness.error) throw existingBusiness.error;

  let businessId = existingBusiness.data?.id;
  if (!businessId) {
    const inserted = await supabase
      .from("businesses")
      .insert({ name: BUSINESS_NAME, slug: BUSINESS_SLUG })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    businessId = inserted.data.id;
    console.log(`Created business ${BUSINESS_SLUG} (${businessId}).`);
  } else {
    console.log(`Business ${BUSINESS_SLUG} already exists (${businessId}).`);
  }

  // 2. Admin auth user (idempotent — reuse if the email already exists).
  let userId = await findUserIdByEmail(supabase, ADMIN_EMAIL);
  if (!userId) {
    const created = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    console.log(`Created admin user ${ADMIN_EMAIL} (${userId}).`);
  } else {
    console.log(`Admin user ${ADMIN_EMAIL} already exists (${userId}).`);
  }

  // Ensure the profile carries a friendly name (trigger only sets id + email).
  const profileUpdate = await supabase
    .from("profiles")
    .update({ full_name: ADMIN_NAME })
    .eq("id", userId);
  if (profileUpdate.error) throw profileUpdate.error;

  // 3. Admin membership (idempotent on the (user_id, business_id) unique key).
  const membership = await supabase
    .from("memberships")
    .upsert(
      { user_id: userId, business_id: businessId, role: "admin" },
      { onConflict: "user_id,business_id" },
    );
  if (membership.error) throw membership.error;
  console.log(
    `Ensured admin membership for ${ADMIN_EMAIL} in ${BUSINESS_SLUG}.`,
  );

  // 4. Work-definition catalog (Slice 2): stages, staff, task types/groups,
  // one "New Wig" intake template.
  await seedWorkDefinition(supabase, businessId);

  console.log("\nDev seed complete.");
  console.log(`  Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

async function findUserIdByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<string | undefined> {
  // The admin list API is paginated; scan until we find the email or run out.
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find((u) => u.email === email);
    if (match) return match.id;
    if (data.users.length < 200) return undefined;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
