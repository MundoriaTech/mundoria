import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { sendOneSignalNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MessageAttachment } from "@/types/customer";

const attachmentSchema = z.object({
  url: z
    .string()
    .url()
    .max(2000)
    .refine(
      (url) => url.includes("/storage/v1/object/public/message-media/"),
      "Invalid media URL.",
    ),
  type: z.enum(["image", "video"]),
  mime: z.string().min(3).max(100),
  name: z.string().max(200).optional(),
});

const schema = z
  .object({
    bookingId: z.string().uuid(),
    content: z.string().trim().max(2000).default(""),
    attachments: z.array(attachmentSchema).max(4).default([]),
  })
  .refine(
    (value) => value.content.length > 0 || value.attachments.length > 0,
    { message: "Message cannot be empty." },
  );

function previewBody(content: string, attachments: MessageAttachment[]) {
  if (content) return content.slice(0, 140);
  const hasVideo = attachments.some((item) => item.type === "video");
  const hasImage = attachments.some((item) => item.type === "image");
  if (hasVideo && hasImage) return "Sent media";
  if (hasVideo) return "Sent a video";
  if (hasImage) return "Sent a photo";
  return "Sent an attachment";
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Message cannot be empty." },
      { status: 400 },
    );
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

  let isTeamMember = false;
  if (booking && user.id !== booking.customer_id && user.id !== booking.cleaner_id) {
    const { data: team } = await createAdminClient()
      .from("booking_team_members")
      .select("id")
      .eq("booking_id", parsed.data.bookingId)
      .eq("cleaner_id", user.id)
      .maybeSingle();
    isTeamMember = Boolean(team);
  }

  if (
    !booking ||
    !booking.cleaner_id ||
    (![booking.customer_id, booking.cleaner_id].includes(user.id) &&
      !isTeamMember)
  ) {
    return NextResponse.json(
      { error: "This conversation is not available." },
      { status: 403 },
    );
  }

  const receiverId =
    user.id === booking.customer_id ? booking.cleaner_id : booking.customer_id;
  const attachments = parsed.data.attachments as MessageAttachment[];
  const content = parsed.data.content;

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      attachments,
      booking_id: parsed.data.bookingId,
      content,
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

  const body = previewBody(content, attachments);

  await admin.from("notifications").insert({
    body,
    data: { booking_id: parsed.data.bookingId },
    title: `New message from ${sender?.full_name ?? "Mundoria"}`,
    type: "message",
    user_id: receiverId,
  });

  const preferences = receiver?.notification_preferences as
    | { email?: boolean; push?: boolean }
    | undefined;
  if (preferences?.push !== false) {
    await sendOneSignalNotification({
      body,
      data: { booking_id: parsed.data.bookingId },
      playerId: receiver?.onesignal_player_id ?? null,
      title: `New message from ${sender?.full_name ?? "Mundoria"}`,
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
        senderName: sender?.full_name ?? "Mundoria",
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
