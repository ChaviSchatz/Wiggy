import { NextResponse } from "next/server";

import { sweepAllBusinessesForReminders } from "@/lib/appointments/reminder-sweep";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Cron target (see `vercel.json`), guarded by `CRON_SECRET` -- Vercel
 * sends this as a Bearer token automatically for cron-triggered requests.
 * Uses the service-role client since this runs with no signed-in user, same
 * class of access as `src/lib/platform-admin/`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = await sweepAllBusinessesForReminders(supabase);
  return NextResponse.json({ results });
}
