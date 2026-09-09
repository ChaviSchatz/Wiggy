/**
 * Business slugs are typed by hand in the platform-admin console (no
 * auto-slug-from-Hebrew-name — see the design spec) and must stay
 * URL/identifier-safe: lowercase letters and digits, single hyphens between
 * segments, no leading/trailing or doubled hyphens.
 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}
