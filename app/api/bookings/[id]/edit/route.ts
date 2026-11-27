import { NextResponse } from "next/server";
import { z } from "zod";

import {
  EDIT_BOOKING_SELECT,
  planBookingEdit,
  type EditableBooking,
} from "@/lib/admin/booking-edit";
import { applyBookingEdit, holdNeedsReplacing } from "@/lib/bookings/apply-booking-edit";
import { isRescheduleTestCustomer, RESCHEDULE_CUTOFF_HOURS } from "@/lib/bookings/lead-time";
import { canCustomerReschedule } from "@/lib/bookings/schedule";
import { SERVICE_ADD_ONS, serviceDefinition } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

/** What a customer may change themselves. Date and time use Reschedule. */
const customerEditSchema = z.object({
  addOns: z.array(z.string().min(1)).max(20).optional(),
  addressId: z.string().uuid().optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  cleaningStandard: z.enum(["essential", "enhanced", "comprehensive"]).optional(),
  durationHours: z.number().min(1).max(12).multipleOf(0.5).optional(),
  otherRooms: z.number().int().min(0).max(20).optional(),
  preview: z.boolean().optional(),
  specialInstructions: z.string().trim().max(2000).nullable().optional(),
});

async function loadOwnBooking(request: Request, id: string) {
  const { user } = await getRequestUser(request);
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const admin = createAdminClient();
  const { data } = await admin
    .from("bookings")
    .select(`${EDIT_BOOKING_SELECT},checkin_verified,actual_start_time`)
    .eq("id", id)
    .maybeSingle();
  const booking = data as unknown as
    | (EditableBooking & { actual_start_time: string | null; checkin_verified: boolean | null })
    | null;
  if (!booking || booking.customer_id !== user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const open = canCustomerReschedule({
    actualStartTime: booking.actual_start_time,
    checkinVerified: booking.checkin_verified,
    cutoffHours: isRescheduleTestCustomer(booking.customer_id) ? 0 : RESCHEDULE_CUTOFF_HOURS,
    scheduledDate: booking.scheduled_date,
    scheduledStartTime: booking.scheduled_start_time,
    status: booking.status,
  });
  return { admin, booking, open };
}

const closedMessage = `Changes close ${RESCHEDULE_CUTOFF_HOURS} hours before your visit. Message us and we'll see what we can do.`;

/** The booking as the edit form needs it. */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const loaded = await loadOwnBooking(request, params.id);
  if ("error" in loaded) return loaded.error;
  const { admin, booking, open } = loaded;

  const [{ data: addresses }, { data: addOnRows }] = await Promise.all([
    admin
      .from("addresses")
      .select("id,address_line_1,postcode")
      .eq("customer_id", booking.customer_id),
    admin.from("booking_add_ons").select("add_on_id").eq("booking_id", booking.id),
  ]);
  const address = Array.isArray(booking.address) ? booking.address[0] : booking.address;
  const category = serviceDefinition(booking.service_type).category;
  const isOffice = booking.service_type === "office" && Boolean(booking.commercial_spaces);

  return NextResponse.json({
    addOnOptions: isOffice
      ? []
      : SERVICE_ADD_ONS.filter((addOn) => !addOn.categories || addOn.categories.includes(category)).map(
          (addOn) => ({ description: addOn.description, id: addOn.id, label: addOn.label }),
        ),
    addresses: (addresses ?? []).map((row) => ({
      id: row.id,
      label: [row.address_line_1, row.postcode].filter(Boolean).join(", "),
    })),
    closedMessage: open ? null : closedMessage,
    hasCleaner: Boolean(booking.cleaner_id),
    isOffice,
    open,
    values: {
      addOns: (addOnRows ?? []).map((row) => String(row.add_on_id)),
      addressId: booking.address_id,
      bathrooms: booking.booked_num_bathrooms ?? address?.num_bathrooms ?? 1,
      bedrooms: booking.booked_num_bedrooms ?? address?.num_bedrooms ?? 1,
      cleaningStandard: booking.cleaning_standard ?? "enhanced",
      durationHours: Number(booking.estimated_duration_hours ?? 2),
      otherRooms: booking.booked_num_other_rooms ?? address?.num_other_rooms ?? 0,
      specialInstructions: booking.special_instructions ?? "",
    },
  });
}

/** Preview (`preview: true`) or save the customer's own changes. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const parsed = customerEditSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check your changes and try again." }, { status: 400 });
  }
  const loaded = await loadOwnBooking(request, params.id);
  if ("error" in loaded) return loaded.error;
  const { admin, booking, open } = loaded;
  if (!open) return NextResponse.json({ error: closedMessage }, { status: 400 });

  const { preview, ...changes } = parsed.data;
  const result = await planBookingEdit(admin, booking, {
    ...changes,
    note: "Changed by the customer",
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const { plan } = result;
  const visible = plan.changes.filter((change) => change.field !== "Cleaner pay");

  if (preview) {
    return NextResponse.json({
      changes: visible,
      cleanerMustReconfirm: plan.cleanerMustReconfirm,
      holdNeedsReplacing: holdNeedsReplacing(booking, plan),
      newTotalPence: plan.newTotalPence,
      oldTotalPence: plan.oldTotalPence,
    });
  }
  if (!plan.changes.length) {
    return NextResponse.json({ error: "Nothing has changed." }, { status: 400 });
  }

  const saved = await applyBookingEdit({
    actor: "customer",
    actorId: booking.customer_id,
    admin,
    booking,
    plan,
    reason: "Changed by the customer",
  });
  if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json({
    changes: visible,
    cleanerMustReconfirm: plan.cleanerMustReconfirm,
    success: true,
  });
}
