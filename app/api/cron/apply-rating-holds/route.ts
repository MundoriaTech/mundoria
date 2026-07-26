import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: ratings, error } = await admin
    .from("ratings")
    .select("id")
    .eq("application_status", "pending_hold")
    .lte("dispute_deadline", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const results: Array<{ id: string; status: "applied" | "failed"; error?: string }> = [];

  for (const rating of ratings ?? []) {
    try {
      const { error: applyError } = await admin.rpc("apply_rating_to_medallion", {
        actor_id: null,
        resolution_notes: "Auto-applied after 48-hour dispute window expired.",
        target_rating_id: rating.id,
      });
      if (applyError) throw new Error(applyError.message);
      results.push({ id: rating.id, status: "applied" });
    } catch (applyError) {
      results.push({
        error:
          applyError instanceof Error
            ? applyError.message
            : "Unable to apply rating.",
        id: rating.id,
        status: "failed",
      });
    }
  }

  return NextResponse.json({ results });
}
