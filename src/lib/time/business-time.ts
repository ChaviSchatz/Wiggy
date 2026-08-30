/**
 * Date arithmetic in a tenant's own timezone (`businesses.timezone`).
 *
 * Pure and framework-agnostic, like `src/lib/availability.ts`: no Next.js and
 * no Supabase, so the timezone rules are directly unit-testable.
 *
 * The whole point is to stop using the *server's* clock for questions that
 * are about the *salon's* day. `new Date().toISOString().slice(0, 10)` is
 * UTC, so for anyone east of Greenwich it reports yesterday late in the
 * evening -- which is why a sprint created after midnight in Israel used to
 * start on the wrong date.
 */

/** 'YYYY-MM-DD' as seen in `timeZone`. `en-CA` formats in ISO order. */
export function businessDateString(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * How far `timeZone` is from UTC at a given instant, in milliseconds.
 * Derived by formatting the instant *as* that zone's wall clock and reading
 * it back as if it were UTC -- the difference is the offset, DST included.
 */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asIfUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asIfUtc - at.getTime();
}

/** The UTC instant at which the business's current day began. */
export function businessDayStart(now: Date, timeZone: string): Date {
  const [year, month, day] = businessDateString(now, timeZone)
    .split("-")
    .map(Number);
  const midnightAsIfUtc = Date.UTC(year, month - 1, day);
  // Offset is sampled at that midnight, not at `now`, so a day that begins
  // before a DST change still resolves to its own local midnight.
  const offset = zoneOffsetMs(new Date(midnightAsIfUtc), timeZone);
  return new Date(midnightAsIfUtc - offset);
}

/** Calendar-safe day arithmetic on a 'YYYY-MM-DD' string. */
export function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}
