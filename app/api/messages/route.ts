import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { sendOneSignalNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  bookingId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("customer_id, cleaner_id")
    .eq("id", parsed.data.bookingId)
    .single();
  if (
    !booking ||
    !booking.cleaner_id ||
    ![booking.customer_id, booking.cleaner_id].includes(user.id)
  ) {
    return NextResponse.json(
      { error: "This conversation is not available." },
      { status: 403 },
    );
  }

  const receiverId =
    user.id === booking.customer_id ? booking.cleaner_id : booking.customer_id;
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      booking_id: parsed.data.bookingId,
      content: parsed.data.content,
      receiver_id: receiverId,
      sender_id: user.id,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: sender }, { data: receiver }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", user.id).single(),
    admin
      .from("profiles")
      .select("email, full_name, onesignal_player_id, notification_preferences, role")
      .eq("id", receiverId)
      .single(),
  ]);

  await admin.from("notifications").insert({
    body: parsed.data.content.slice(0, 140),
    data: { booking_id: parsed.data.bookingId },
    title: `New message from ${sender?.full_name ?? "CleanScape"}`,
    type: "message",
    user_id: receiverId,
  });

  const preferences = receiver?.notification_preferences as
    | { email?: boolean; push?: boolean }
    | undefined;
  if (preferences?.push !== false) {
    await sendOneSignalNotification({
      body: parsed.data.content.slice(0, 140),
      data: { booking_id: parsed.data.bookingId },
      playerId: receiver?.onesignal_player_id ?? null,
      title: `New message from ${sender?.full_name ?? "CleanScape"}`,
    });
  }

  if (preferences?.email !== false && receiver?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    await sendBrandedEmail({
      data: {
        appUrl,
        bookingId: parsed.data.bookingId,
        firstName: receiver.full_name?.split(" ")[0],
        fullName: receiver.full_name,
        messageUrl:
          receiver.role === "cleaner"
            ? `${appUrl}/cleaner/messages/${parsed.data.bookingId}`
            : `${appUrl}/messages/${parsed.data.bookingId}`,
        senderName: sender?.full_name ?? "CleanScape",
      },
      template:
        receiver.role === "cleaner"
          ? "cleaner.message_received"
          : "customer.message_received",
      to: receiver.email,
    });
  }

  return NextResponse.json({ message });
}
