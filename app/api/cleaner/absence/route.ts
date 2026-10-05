import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { runMatchingEngine } from "@/lib/matching/engine";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  cancelExisting: z.boolean(),
  endsOn: z.string().date(),
  note: z.string().trim().max(300).optional(),
  startsOn: z.string().date(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose the first and last day you will be away." },
      { status: 400 },
    );
  }
  if (parsed.data.endsOn < parsed.data.startsOn) {
    return NextResponse.json(
      { error: "The end date has to be on or after the start date." },
      { status: 400 },
    );
  }
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("cleaner_absences").insert({
    cancel_existing: parsed.data.cancelExisting,
    cleaner_id: user.id,
    ends_on: parsed.data.endsOn,
    note: parsed.data.note ?? null,
    starts_on: parsed.data.startsOn,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let cancelled = 0;
  if (parsed.data.cancelExisting) {
    const { data: jobs } = await admin
      .from("bookings")
      .select("id")
      .eq("cleaner_id", user.id)
      .gte("scheduled_date", parsed.data.startsOn)
      .lte("scheduled_date", parsed.data.endsOn)
      .in("status", ["matched", "confirmed", "pending_match", "cleaner_en_route"]);
    for (const job of jobs ?? []) {
      await admin
        .from("bookings")
        .update({
          cancellation_reason: "Cleaner absence",
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cleaner_id: null,
          status: "pending_match",
        })
        .eq("id", job.id);
      await runMatchingEngine(job.id, { excludeCleanerIds: [user.id] });
      cancelled += 1;
    }
    if (cancelled > 0) {
      const { data: profile } = await admin
        .from("cleaner_profiles")
        .select("cancellation_count")
        .eq("id", user.id)
        .single();
      await admin
        .from("cleaner_profiles")
        .update({
          cancellation_count:
            Number(profile?.cancellation_count ?? 0) + cancelled,
        })
        .eq("id", user.id);
    }
  }

  return NextResponse.json({ cancelled, success: true });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Choose which time off to remove." }, { status: 400 });
  }
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("cleaner_absences")
    .delete()
    .eq("id", id)
    .eq("cleaner_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
