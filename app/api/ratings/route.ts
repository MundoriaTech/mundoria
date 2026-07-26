import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { addHours } from "date-fns";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

const moodConfig = {
  awful: { internalScore: -2, legacyScore: 1 },
  bad: { internalScore: -1, legacyScore: 2 },
  excellent: { internalScore: 2, legacyScore: 5 },
  fair: { internalScore: 0, legacyScore: 3 },
  good: { internalScore: 1, legacyScore: 4 },
} as const;

const schema = z.object({
  booking_id: z.string().uuid(),
  comment: z.string().trim().max(2000).optional(),
  mood: z.enum(["excellent", "good", "fair", "bad", "awful"]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a rating mood for this job." },
      { status: 400 },
    );
  }

  const session = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await session.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { booking_id, comment, mood } = parsed.data;
  const { data: booking } = await admin
    .from("bookings")
    .select("id,customer_id,cleaner_id,status")
    .eq("id", booking_id)
    .single();

  if (!booking || booking.customer_id !== user.id || !booking.cleaner_id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!["completed", "awaiting_customer_confirmation"].includes(booking.status)) {
    return NextResponse.json(
      { error: "Ratings are available after the job is complete." },
      { status: 400 },
    );
  }

  const score = moodConfig[mood];
  const needsHold = score.internalScore < 0;
  const { data: rating, error } = await admin
    .from("ratings")
    .insert({
      application_status: needsHold ? "pending_hold" : "pending_hold",
      booking_id,
      cleaner_id: booking.cleaner_id,
      comment: comment || null,
      customer_id: user.id,
      dispute_deadline: needsHold ? addHours(new Date(), 48).toISOString() : null,
      internal_score: score.internalScore,
      mood,
      overall_score: score.legacyScore,
      room_ratings: {},
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!needsHold) {
    const { error: applyError } = await admin.rpc("apply_rating_to_medallion", {
      actor_id: user.id,
      resolution_notes: "Auto-applied non-negative customer mood rating.",
      target_rating_id: rating.id,
    });

    if (applyError) {
      return NextResponse.json({ error: applyError.message }, { status: 400 });
    }
  } else {
    const disputeDeadline = addHours(new Date(), 48).toISOString();
    await sendPushNotification(
      booking.cleaner_id,
      "A rating is open for review",
      "You have 48 hours to dispute this job rating before it affects your medallion score.",
      { booking_id, rating_id: rating.id },
    );
    const { data: cleaner } = await admin
      .from("profiles")
      .select("email,full_name,notification_preferences")
      .eq("id", booking.cleaner_id)
      .single();
    const preferences = cleaner?.notification_preferences as
      | { email?: boolean }
      | undefined;
    if (cleaner?.email && preferences?.email !== false) {
      await sendBrandedEmail({
        data: {
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
          bookingId: booking_id,
          disputeDeadline,
          firstName: cleaner.full_name?.split(" ")[0],
          fullName: cleaner.full_name,
          mood,
          ratingId: rating.id,
        },
        template: "cleaner.rating_hold",
        to: cleaner.email,
      });
    }
  }

  return NextResponse.json({
    heldForDispute: needsHold,
    rating_id: rating.id,
    success: true,
  });
}
