import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const eventSchema = z.object({
  endsAt: z.string().datetime(),
  startsAt: z.string().datetime(),
  title: z.string().trim().min(1).max(120),
});

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Choose a date range." }, { status: 400 });
  }
  const [{ data: jobs }, { data: events }, { data: absences }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,scheduled_date,scheduled_start_time,estimated_duration_hours,service_type,status")
      .eq("cleaner_id", user.id)
      .gte("scheduled_date", from)
      .lte("scheduled_date", to)
      .neq("status", "cancelled"),
    supabase
      .from("cleaner_calendar_events")
      .select("id,title,starts_at,ends_at")
      .eq("cleaner_id", user.id)
      .gte("starts_at", `${from}T00:00:00`)
      .lte("starts_at", `${to}T23:59:59`),
    supabase
      .from("cleaner_absences")
      .select("id,starts_on,ends_on,note,cancel_existing")
      .eq("cleaner_id", user.id)
      .lte("starts_on", to)
      .gte("ends_on", from),
  ]);
  return NextResponse.json({
    absences: absences ?? [],
    events: events ?? [],
    jobs: jobs ?? [],
  });
}

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Add a title and a start and end time." }, { status: 400 });
  }
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("cleaner_calendar_events").insert({
    cleaner_id: user.id,
    ends_at: parsed.data.endsAt,
    starts_at: parsed.data.startsAt,
    title: parsed.data.title,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
