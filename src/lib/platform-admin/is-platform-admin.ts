/**
 * Platform admins operate above all tenants (create businesses, invite their
 * first admin) and are not modeled as a `memberships.role` at all — see
 * docs/superpowers/specs/2026-09-09-platform-admin-console-design.md.
 * v1 identity is a static allowlist; revisit with a DB-backed flag if this
 * ever needs self-service delegation to more than a handful of operators.
 */
export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = parseAllowlist(process.env.PLATFORM_ADMIN_EMAILS);
  return allowlist.has(email.trim().toLowerCase());
}

function parseAllowlist(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );
}
