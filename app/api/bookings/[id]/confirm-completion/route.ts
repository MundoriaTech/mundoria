import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const uncheckedItemSchema = z.object({
  item_key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  reason: z.string().trim().min(3),
});

const schema = z.object({
  unchecked_items: z.array(uncheckedItemSchema).default([]),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Every unchecked item needs a reason." },
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
  const { data: booking } = await admin
    .from("bookings")
    .select("id,customer_id,status")
    .eq("id", params.id)
    .single();

  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!["awaiting_customer_confirmation", "completed"].includes(booking.status)) {
    return NextResponse.json(
      { error: "This booking is not ready for completion confirmation." },
      { status: 400 },
    );
  }

  const uncheckedItems = parsed.data.unchecked_items;
  const { error } = await admin
    .from("booking_completion_confirmations")
    .upsert(
      {
        all_confirmed: uncheckedItems.length === 0,
        booking_id: params.id,
        customer_id: user.id,
        unchecked_items: uncheckedItems,
      },
      { onConflict: "booking_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await admin
    .from("bookings")
    .update({
      customer_confirmed_complete_at: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", params.id);

  return NextResponse.json({ success: true });
}
