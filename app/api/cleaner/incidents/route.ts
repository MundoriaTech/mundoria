import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

const schema = z.object({
  booking_id: z.string().uuid().nullish(),
  category: z.enum([
    "injury",
    "property_damage",
    "unsafe_condition",
    "theft",
    "customer_behaviour",
    "other",
  ]),
  description: z
    .string()
    .trim()
    .min(10, "Please describe what happened (at least 10 characters)")
    .max(4000, "Description is too long"),
  emergency_services_contacted: z.boolean().default(false),
  location_note: z.string().trim().max(500).nullish(),
  occurred_at: z.string().trim().nullish(),
  severity: z.enum(["standard", "urgent", "emergency"]).default("standard"),
  title: z
    .string()
    .trim()
    .min(3, "Please add a short title")
    .max(160, "Title is too long"),
});

export async function GET(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cleaner_incidents")
    .select("*")
    .eq("cleaner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Could not load incidents" }, { status: 500 });
  }
  return NextResponse.json({ incidents: data ?? [] });
}

export async function POST(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid incident report" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  let occurredAt: string | null = null;
  if (input.occurred_at) {
    const date = new Date(input.occurred_at);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date and time" }, { status: 400 });
    }
    if (date.getTime() > Date.now() + 5 * 60 * 1000) {
      return NextResponse.json(
        { error: "The incident time cannot be in the future" },
        { status: 400 },
      );
    }
    occurredAt = date.toISOString();
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "cleaner") {
    return NextResponse.json({ error: "Cleaner account required" }, { status: 403 });
  }

  if (input.booking_id) {
    const { data: booking } = await admin
      .from("bookings")
      .select("id")
      .eq("id", input.booking_id)
      .eq("cleaner_id", user.id)
      .maybeSingle();
    if (!booking) {
      return NextResponse.json(
        { error: "That booking is not linked to your account" },
        { status: 400 },
      );
    }
  }

  const { data: incident, error } = await admin
    .from("cleaner_incidents")
    .insert({
      booking_id: input.booking_id ?? null,
      category: input.category,
      cleaner_id: user.id,
      description: input.description,
      emergency_services_contacted: input.emergency_services_contacted,
      location_note: input.location_note || null,
      occurred_at: occurredAt,
      severity: input.severity,
      title: input.title,
    })
    .select("*")
    .single();

  if (error || !incident) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Could not save your report. Please try again." },
      { status: 500 },
    );
  }

  // Notify admins; a failure here must not lose the saved report.
  try {
    const cleanerName = profile.full_name?.trim() || "A cleaner";
    const severityLabel =
      input.severity === "emergency"
        ? "Emergency"
        : input.severity === "urgent"
          ? "Urgent"
          : "New";
    const title = `${severityLabel} cleaner incident`;
    const body = `${cleanerName}: ${input.title}`.slice(0, 180);
    const data = {
      booking_id: incident.booking_id,
      category: incident.category,
      cleaner_id: user.id,
      entity_id: incident.id,
      incident_id: incident.id,
      severity: incident.severity,
    };

    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins?.length) {
      await admin.from("notifications").insert(
        admins.map((row) => ({
          body,
          data,
          title,
          type: "cleaner_incident",
          user_id: row.id,
        })),
      );
    }

    await admin.from("admin_alert_queue").insert({
      body,
      data,
      title,
      type: "cleaner_incident",
    });
  } catch (notifyError) {
    Sentry.captureException(notifyError);
  }

  return NextResponse.json({ incident }, { status: 201 });
}
