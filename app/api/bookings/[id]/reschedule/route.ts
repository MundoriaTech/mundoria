import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  canCustomerReschedule,
} from "@/lib/bookings/schedule";
import { runMatchingEngine } from "@/lib/matching/engine";
import { createInAppNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  reason: z.string().trim().max(500).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledStartTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a valid date and time." },
      { status: 400 },
    );
  }

  const session = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,customer_id,cleaner_id,status,scheduled_date,scheduled_start_time,payment_status,estimated_duration_hours",
    )
    .eq("id", params.id)
    .single();

  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !canCustomerReschedule({
      scheduledDate: booking.scheduled_date,
      scheduledStartTime: booking.scheduled_start_time,
      status: booking.status,
    })
  ) {
    return NextResponse.json(
      {
        error:
          "Reschedule is available at least 24 hours before your visit. Within 24 hours, cancel instead.",
      },
      { status: 400 },
    );
  }

  const time = parsed.data.scheduledStartTime.slice(0, 5);
  const newStart = new Date(`${parsed.data.scheduledDate}T${time}:00`);
  if (Number.isNaN(newStart.getTime()) || newStart.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Choose a future date and time." },
      { status: 400 },
    );
  }

  const hadCleaner = Boolean(booking.cleaner_id);
  const nextStatus = hadCleaner ? "matched" : "pending_match";

  const { data: updated, error } = await admin
    .from("bookings")
    .update({
      confirmation_due_at: null,
      confirmation_gate: "none",
      confirmation_responded_at: null,
      scheduled_date: parsed.data.scheduledDate,
      scheduled_start_time: time,
      status: nextStatus,
    })
    .eq("id", params.id)
    .select("id,scheduled_date,scheduled_start_time,status,cleaner_id")
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "Could not reschedule." },
      { status: 400 },
    );
  }

  // Clear stale emergency list for the old schedule window.
  await admin
    .from("booking_emergency_list")
    .update({
      removed_reason: "rescheduled",
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("booking_id", params.id)
    .in("status", ["reserve", "notified"]);

  if (hadCleaner && booking.cleaner_id) {
    await createInAppNotification(
      booking.cleaner_id,
      "booking",
      "Job rescheduled",
      `A customer moved their clean to ${parsed.data.scheduledDate} at ${time}. Please confirm you can still attend.`,
      { booking_id: params.id },
    );
  }

  if (!hadCleaner || updated.status === "pending_match") {
    await runMatchingEngine(params.id);
  }

  return NextResponse.json({
    booking: updated,
    cleanerMustAccept: hadCleaner,
    success: true,
  });
}
