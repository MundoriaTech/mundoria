import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { FULLY_EDITABLE_STATUSES, NOTES_ONLY_STATUSES } from "@/lib/admin/booking-edit";
import { ADDRESS_NEEDS_STREET_MESSAGE, addressHasStreet } from "@/lib/customer/address-completeness";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { geocodeAddress } from "@/lib/geo/geocode";
import { alertAdmins } from "@/lib/notifications/admin";
import { notifyCleanerDayOf } from "@/lib/notifications/cleaner-day-of";
import { createInAppNotification } from "@/lib/notifications/send";

const schema = z.object({
  addressLine1: z.string().trim().min(3, "Enter the first line of the address.").max(200),
  addressLine2: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().min(1, "Enter the town or city.").max(80),
  note: z.string().trim().min(3, "Give a reason for the correction."),
  postcode: z.string().trim().min(5, "Enter the postcode.").max(10),
  preview: z.boolean().optional(),
});

const UPCOMING = [...FULLY_EDITABLE_STATUSES, ...NOTES_ONLY_STATUSES] as readonly string[];

const FIELDS = [
  ["address_line_1", "Address line 1"],
  ["address_line_2", "Address line 2"],
  ["city", "Town or city"],
  ["postcode", "Postcode"],
] as const;

function oneLine(address: { address_line_1: string | null; postcode: string | null }) {
  const line = address.address_line_1 ?? "";
  const postcode = address.postcode ?? "";
  return postcode && !line.toUpperCase().includes(postcode.toUpperCase()) ? `${line}, ${postcode}` : line;
}

/**
 * Correct a saved address in place (a typo, a wrong house number). Every
 * booking at the address changes with it, so `preview: true` lists them
 * first. Saving tells the customer and the cleaners on upcoming visits.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the address and try again." },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const admin = auth.admin;

  const { data: address } = await admin
    .from("addresses")
    .select("id,customer_id,address_line_1,address_line_2,city,postcode")
    .eq("id", params.id)
    .maybeSingle();
  if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  const next = {
    address_line_1: input.addressLine1,
    address_line_2: input.addressLine2?.trim() || null,
    city: input.city,
    postcode: input.postcode.toUpperCase().replace(/\s+/g, " ").trim(),
  };
  if (!addressHasStreet({ address_line_1: next.address_line_1, city: next.city, postcode: next.postcode })) {
    return NextResponse.json({ error: ADDRESS_NEEDS_STREET_MESSAGE }, { status: 400 });
  }
  const changes = FIELDS.map(([key, field]) => ({
    field,
    from: String(address[key] ?? "") || "—",
    to: String(next[key] ?? "") || "—",
  })).filter((change) => change.from !== change.to);

  const today = new Date().toISOString().slice(0, 10);
  const { data: bookingRows } = await admin
    .from("bookings")
    .select("id,scheduled_date,scheduled_start_time,status,cleaner_id")
    .eq("address_id", params.id)
    .order("scheduled_date", { ascending: true });
  const bookings = bookingRows ?? [];
  const upcoming = bookings.filter(
    (row) => UPCOMING.includes(String(row.status)) && String(row.scheduled_date) >= today,
  );

  if (input.preview) {
    return NextResponse.json({
      changes,
      totalBookings: bookings.length,
      upcoming: upcoming.map((row) => ({
        date: row.scheduled_date,
        hasCleaner: Boolean(row.cleaner_id),
        id: row.id,
        status: row.status,
        time: String(row.scheduled_start_time ?? "").slice(0, 5),
      })),
    });
  }
  if (!changes.length) return NextResponse.json({ error: "Nothing has changed." }, { status: 400 });

  const point = await geocodeAddress([next.address_line_1, next.address_line_2, next.city, next.postcode]
    .filter(Boolean)
    .join(", "));
  const { error } = await admin
    .from("addresses")
    .update({ ...next, latitude: point?.lat ?? null, longitude: point?.lon ?? null })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const before = oneLine(address);
  const after = oneLine(next);
  const metadata = { addressId: params.id, changes };

  // The correction shows in the history of every booking it touches.
  await Promise.all([
    logAdminAction({
      action: "correct_address",
      adminId: auth.user.id,
      entityId: address.customer_id,
      entityType: "customer",
      metadata,
      reason: input.note,
    }),
    ...bookings.map((row) =>
      logAdminAction({
        action: "correct_address",
        adminId: auth.user.id,
        entityId: row.id,
        entityType: "booking",
        metadata,
        reason: input.note,
      }),
    ),
  ]);

  const { data: customer } = await admin
    .from("profiles")
    .select("email,full_name,notification_preferences")
    .eq("id", address.customer_id)
    .maybeSingle();
  const firstName = customer?.full_name?.trim().split(/\s+/)[0];
  const prefs = (customer?.notification_preferences ?? {}) as { email?: boolean };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mundoria.co.uk";
  const customerBody = `We've corrected your saved address to ${after}.${
    upcoming.length ? ` Your upcoming ${upcoming.length === 1 ? "visit uses" : "visits use"} the corrected address.` : ""
  }`;

  await Promise.all([
    createInAppNotification(address.customer_id, "booking_updated", "Your address was corrected", customerBody, {
      address_id: params.id,
    }).then(
      () => undefined,
      () => undefined,
    ),
    customer?.email && prefs.email !== false
      ? sendBrandedEmail({
          data: {
            actionLabel: "View your bookings",
            actionUrl: `${appUrl}/bookings`,
            body: `${firstName ? `Hi ${firstName}, ` : ""}${customerBody} If this isn't right, reply to this email.`,
            subject: "Mundoria: your address was corrected",
            title: "Your address was corrected",
          },
          template: "system.generic",
          to: customer.email,
        }).catch(() => undefined)
      : null,
    ...upcoming
      .filter((row) => row.cleaner_id)
      .map((row) =>
        notifyCleanerDayOf({
          body: `The address for this job has been corrected. It's now ${after} (was ${before}).`,
          bookingId: row.id,
          cleanerId: row.cleaner_id as string,
          title: "Job address corrected",
        }).catch(() => undefined),
      ),
    alertAdmins(
      "booking_updated",
      "An admin corrected a customer address",
      `${before} → ${after}. ${bookings.length} booking${bookings.length === 1 ? "" : "s"} use it, ${
        upcoming.length
      } upcoming. Reason: ${input.note}`,
      { address_id: params.id, edited_by: auth.user.id },
    ).catch(() => undefined),
  ]);

  return NextResponse.json({ address: { id: params.id, label: after }, success: true });
}
