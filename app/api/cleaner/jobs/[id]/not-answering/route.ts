import { NextResponse } from "next/server";

import { sendBrandedEmail } from "@/lib/email/send-email";
import { alertAdmins } from "@/lib/notifications/admin";
import { createInAppNotification, sendPushNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

/** One report per this long, so a nervous double-tap doesn't spam anyone. */
const REPORT_GAP_MS = 3 * 60 * 1000;

/**
 * The cleaner is at the door and nobody is answering. Tells the customer
 * (push, in-app, email) and alerts admins with the customer's phone so they
 * can call. No charge is made.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,status,arrived_at,customer_id,cleaner_id,scheduled_date,scheduled_start_time,address:addresses(address_line_1,postcode),customer:profiles!bookings_customer_id_fkey(full_name,email,phone,notification_preferences)",
    )
    .eq("id", params.id)
    .eq("cleaner_id", user.id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  if (booking.status !== "cleaner_en_route" || !booking.arrived_at) {
    return NextResponse.json(
      { error: "You can report this once you've checked in at the address and before the clean starts." },
      { status: 400 },
    );
  }

  const { data: last } = await admin
    .from("booking_waiting_reports")
    .select("created_at")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last && Date.now() - new Date(last.created_at as string).getTime() < REPORT_GAP_MS) {
    return NextResponse.json({ alreadyReported: true, reportedAt: last.created_at });
  }

  const now = new Date().toISOString();
  await admin.from("booking_waiting_reports").insert({ booking_id: booking.id, cleaner_id: user.id });
  const { count } = await admin
    .from("booking_waiting_reports")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", booking.id);

  const one = <T,>(value: T | T[] | null) => (Array.isArray(value) ? (value[0] ?? null) : value);
  const customer = one(booking.customer as unknown) as {
    email?: string | null;
    full_name?: string | null;
    notification_preferences?: { email?: boolean } | null;
    phone?: string | null;
  } | null;
  const address = one(booking.address as unknown) as { address_line_1?: string | null; postcode?: string | null } | null;
  const { data: cleaner } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const cleanerFirst = cleaner?.full_name?.trim().split(/\s+/)[0] ?? "Your cleaner";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
  const title = "Your cleaner is at the door";
  const body = `${cleanerFirst} is outside and can't get in. Please let them in, or message them from your booking if there's a problem.`;

  await Promise.all([
    sendPushNotification(booking.customer_id, title, body, { booking_id: booking.id }).catch(() => undefined),
    createInAppNotification(booking.customer_id, "booking_updated", title, body, { booking_id: booking.id }).then(
      () => undefined,
      () => undefined,
    ),
    customer?.email && customer.notification_preferences?.email !== false
      ? sendBrandedEmail({
          data: {
            actionLabel: "Open your booking",
            actionUrl: `${appUrl}/booking/${booking.id}`,
            body,
            bookingId: booking.id,
            subject: "Mundoria: your cleaner is at the door",
            title,
          },
          template: "system.generic",
          to: customer.email,
        }).catch(() => undefined)
      : null,
    alertAdmins(
      "cleaner_waiting",
      (count ?? 1) > 1 ? "A cleaner still can't get in" : "A cleaner can't get in",
      `${cleaner?.full_name ?? "The cleaner"} is at ${[address?.address_line_1, address?.postcode]
        .filter(Boolean)
        .join(", ")} and ${customer?.full_name ?? "the customer"} isn't answering${
        customer?.phone ? `. Customer phone: ${customer.phone}` : ""
      }. Report ${count ?? 1}.`,
      { booking_id: booking.id, cleaner_id: user.id },
    ).catch(() => undefined),
  ]);

  return NextResponse.json({ reportedAt: now, reports: count ?? 1, success: true });
}
