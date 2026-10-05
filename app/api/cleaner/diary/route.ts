import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const eventSchema = z.object({
  endsAt: z.string().datetime(),
  startsAt: z.string().datetime(),
  title: z.string().trim().min(1).max(120),
});

export async function GET(request: Request) {
  const { supabase, user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Choose a date range." }, { status: 400 });
  }
  const admin = createAdminClient();
  const [{ data: jobs }, { data: events }, { data: absences }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id,scheduled_date,scheduled_start_time,estimated_duration_hours,service_type,status,amount_cleaner,address:addresses(postcode),customer:profiles!bookings_customer_id_fkey(full_name)",
      )
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
    jobs: (jobs ?? []).map(presentJob),
  });
}

function presentJob(job: {
  address?: { postcode?: string | null } | { postcode?: string | null }[] | null;
  amount_cleaner: number | null;
  customer?: { full_name?: string | null } | { full_name?: string | null }[] | null;
  estimated_duration_hours: number | null;
  id: string;
  scheduled_date: string;
  scheduled_start_time: string;
  service_type: string;
  status: string;
}) {
  const address = Array.isArray(job.address) ? job.address[0] : job.address;
  const customer = Array.isArray(job.customer) ? job.customer[0] : job.customer;
  const postcode = address?.postcode?.trim().toUpperCase() ?? "";
  const space = postcode.indexOf(" ");
  const area = postcode
    ? space > 0
      ? postcode.slice(0, space)
      : postcode.length > 3
        ? postcode.slice(0, -3)
        : postcode
    : null;
  const firstName = customer?.full_name?.trim().split(/\s+/)[0] ?? null;

  return {
    amount_cleaner: job.amount_cleaner,
    area,
    customer_name: firstName,
    estimated_duration_hours: job.estimated_duration_hours,
    id: job.id,
    scheduled_date: job.scheduled_date,
    scheduled_start_time: job.scheduled_start_time,
    service_type: job.service_type,
    status: job.status,
  };
}

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Give the plan a name, and when it starts and ends." },
      { status: 400 },
    );
  }
  const { user } = await getRequestUser(request);
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

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Choose which plan to remove." }, { status: 400 });
  }
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("cleaner_calendar_events")
    .delete()
    .eq("id", id)
    .eq("cleaner_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
