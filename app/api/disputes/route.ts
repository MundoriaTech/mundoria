import { getRequestUser } from "@/lib/supabase/request-client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { findDisputeOption } from "@/lib/disputes/options";
import { createAdminClient } from "@/lib/supabase/admin";
import { noteBookingInZoho } from "@/lib/zoho/booking-notes";

const schema = z.object({
  booking_id: z.string().uuid(),
  category_path: z.array(z.string().min(1)).min(1),
  description: z.string().trim().max(3000).optional(),
  rating_id: z.string().uuid().optional(),
  selected_option_key: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a dispute reason." }, { status: 400 });
  }

  const { user } = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const value = parsed.data;
  const option = findDisputeOption(value.selected_option_key);
  const description = value.description?.trim() ?? "";

  if ((option?.requiresDetails || value.selected_option_key.includes("other")) && description.length < 10) {
    return NextResponse.json(
      { error: "Tell us a little more about the issue." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,customer_id,cleaner_id,payment_status,payment_capture_scheduled_for")
    .eq("id", value.booking_id)
    .single();

  if (
    !booking ||
    (booking.customer_id !== user.id && booking.cleaner_id !== user.id)
  ) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const { error } = await admin.from("disputes").insert({
    booking_id: value.booking_id,
    category_path: value.category_path,
    description:
      description ||
      value.category_path[value.category_path.length - 1] ||
      "Structured dispute submitted.",
    raised_by: user.id,
    rating_id: value.rating_id ?? null,
    selected_option_key: value.selected_option_key,
    structured_metadata: {
      selected_label: option?.label ?? value.selected_option_key,
    },
    type: inferDisputeType(value.category_path[0]),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // A customer's dispute about a visit pauses the next-day charge until an
  // admin resolves it (resolving restarts it; a refund releases the hold).
  if (
    !value.rating_id &&
    user.id === booking.customer_id &&
    booking.payment_status === "held" &&
    booking.payment_capture_scheduled_for
  ) {
    await admin
      .from("bookings")
      .update({
        payment_capture_paused_at: new Date().toISOString(),
        payment_capture_scheduled_for: null,
      })
      .eq("id", booking.id);
  }

  if (value.rating_id) {
    await admin
      .from("ratings")
      .update({ application_status: "disputed" })
      .eq("id", value.rating_id)
      .eq("application_status", "pending_hold");
  }

  // Booking disputes (not a cleaner challenging a rating) go on the customer's Contact.
  if (!value.rating_id) {
    await noteBookingInZoho(
      booking.id,
      "Dispute opened",
      `${user.id === booking.customer_id ? "The customer" : "The cleaner"} raised a dispute: ${value.category_path.join(" > ")}.${
        description ? ` ${description}` : ""
      }`,
    );
  }

  return NextResponse.json({ success: true });
}

function inferDisputeType(topLevelKey: string) {
  if (topLevelKey === "payment_refund") return "payment";
  if (topLevelKey === "property_damage") return "damage";
  if (topLevelKey === "timing_attendance") return "no_show";
  if (topLevelKey === "cleaning_quality") return "quality";
  return "other";
}
