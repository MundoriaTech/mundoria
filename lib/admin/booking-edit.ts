import { z } from "zod";

import { PERCENT_OFFER_KIND } from "@/lib/bookings/percent-offer";
import { pricingServiceTypeFor } from "@/lib/customer/booking-flow";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import {
  estimatePriceBreakdown,
  SERVICE_ADD_ONS,
  serviceDefinition,
} from "@/lib/customer/services";
import { splitBookingAmount } from "@/lib/payments/cleaner-pay";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Address, CleaningStandard, ServiceType } from "@/types/customer";

type Admin = ReturnType<typeof createAdminClient>;

/** Before the cleaner is on their way: everything can change. */
export const FULLY_EDITABLE_STATUSES = [
  "pending_match",
  "matched",
  "awaiting_payment",
  "confirmed",
  "no_show",
] as const;
/** Once the visit is under way only the notes can change. */
export const NOTES_ONLY_STATUSES = ["cleaner_en_route", "in_progress"] as const;

export const bookingEditSchema = z.object({
  accessInstructions: z.string().trim().max(1000).nullable().optional(),
  addOns: z.array(z.string().min(1)).max(20).optional(),
  addressId: z.string().uuid().optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  /** The admin has already agreed the new time or address with the cleaner. */
  cleanerAgreed: z.boolean().optional(),
  cleaningStandard: z.enum(["essential", "enhanced", "comprehensive"]).optional(),
  /** Hours on site, including any free first-visit hour. */
  durationHours: z.number().min(1).max(16).multipleOf(0.25).optional(),
  note: z.string().trim().min(3),
  otherRooms: z.number().int().min(0).max(20).optional(),
  preview: z.boolean().optional(),
  /** Admin's own total, in pence, replacing the recalculated one. */
  priceOverridePence: z.number().int().min(100).max(1_000_000).nullable().optional(),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  specialInstructions: z.string().trim().max(2000).nullable().optional(),
});

export type BookingEditInput = z.infer<typeof bookingEditSchema>;

export const EDIT_BOOKING_SELECT =
  "id,status,payment_status,customer_id,cleaner_id,service_type,is_recurring,cleaning_standard,estimated_duration_hours,offer_free_hours,offer_kind,discount_pence,promo_code_id,amount_total,amount_cleaner,allocated_cleaners,cleaner_hours,commercial_spaces,booked_num_bedrooms,booked_num_bathrooms,booked_num_other_rooms,scheduled_date,scheduled_start_time,address_id,special_instructions,access_instructions,stripe_payment_intent_id,stripe_payment_method_id,address:addresses(*)";

export type EditableBooking = {
  access_instructions: string | null;
  address: Address | Address[] | null;
  address_id: string;
  allocated_cleaners: number | null;
  amount_cleaner: number | null;
  amount_total: number | null;
  booked_num_bathrooms: number | null;
  booked_num_bedrooms: number | null;
  booked_num_other_rooms: number | null;
  cleaner_hours: number | null;
  cleaner_id: string | null;
  cleaning_standard: CleaningStandard | null;
  commercial_spaces: unknown;
  customer_id: string;
  discount_pence: number | null;
  estimated_duration_hours: number | null;
  id: string;
  is_recurring: boolean | null;
  offer_free_hours: number | null;
  offer_kind: string | null;
  payment_status: string;
  promo_code_id: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  service_type: ServiceType;
  special_instructions: string | null;
  status: string;
  stripe_payment_intent_id: string | null;
  stripe_payment_method_id: string | null;
};

export type BookingChange = { field: string; from: string; to: string };

export type BookingEditPlan = {
  addOnRows: Array<{ add_on_id: string; amount: number; label: string }> | null;
  changes: BookingChange[];
  /** The cleaner should be asked to accept again (new time or place). */
  cleanerMustReconfirm: boolean;
  newCleanerPence: number;
  newDiscountPence: number;
  newTotalPence: number;
  oldCleanerPence: number;
  oldTotalPence: number;
  priceChanged: boolean;
  timeChanged: boolean;
  updates: Record<string, unknown>;
};

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;
const clock = (time: string | null | undefined) => String(time ?? "").slice(0, 5);
const hoursText = (hours: number) => `${Number(hours.toFixed(2))} h`;

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

/**
 * Works out what an admin edit changes: the new booking fields, the new price
 * and cleaner pay, and a plain list of what changed for the audit log and the
 * messages to the customer and cleaner. Writes nothing.
 *
 * Pricing charges only the difference the edit makes: the booking's current
 * price plus (new list price − old list price), both worked out with today's
 * rates. A change of date alone therefore costs nothing unless it moves the
 * visit into or out of a weekend or evening uplift.
 */
export async function planBookingEdit(
  admin: Admin,
  booking: EditableBooking,
  input: BookingEditInput,
): Promise<{ error: string } | { plan: BookingEditPlan }> {
  const fullyEditable = (FULLY_EDITABLE_STATUSES as readonly string[]).includes(booking.status);
  const notesOnly = (NOTES_ONLY_STATUSES as readonly string[]).includes(booking.status);
  if (!fullyEditable && !notesOnly) {
    return { error: "This booking is finished or cancelled, so it can't be edited." };
  }

  const changes: BookingChange[] = [];
  const updates: Record<string, unknown> = {};

  const oldNotes = booking.special_instructions?.trim() || "";
  const oldAccess = booking.access_instructions?.trim() || "";
  if (input.specialInstructions !== undefined && (input.specialInstructions ?? "") !== oldNotes) {
    updates.special_instructions = input.specialInstructions || null;
    changes.push({ field: "Notes", from: oldNotes || "None", to: input.specialInstructions || "None" });
  }
  if (input.accessInstructions !== undefined && (input.accessInstructions ?? "") !== oldAccess) {
    updates.access_instructions = input.accessInstructions || null;
    changes.push({ field: "Access instructions", from: oldAccess || "None", to: input.accessInstructions || "None" });
  }

  const oldAddress = one(booking.address);
  const oldDate = booking.scheduled_date;
  const oldTime = clock(booking.scheduled_start_time);
  const oldDuration = Number(booking.estimated_duration_hours ?? 0);
  const oldStandard = (booking.cleaning_standard ?? "enhanced") as CleaningStandard;
  const oldBedrooms = booking.booked_num_bedrooms ?? oldAddress?.num_bedrooms ?? 1;
  const oldBathrooms = booking.booked_num_bathrooms ?? oldAddress?.num_bathrooms ?? 1;
  const oldOther = booking.booked_num_other_rooms ?? oldAddress?.num_other_rooms ?? 0;
  const { data: addOnRows } = await admin
    .from("booking_add_ons")
    .select("add_on_id")
    .eq("booking_id", booking.id);
  const oldAddOns = (addOnRows ?? []).map((row) => String(row.add_on_id)).sort();

  const newDate = input.scheduledDate ?? oldDate;
  const newTime = input.scheduledTime ?? oldTime;
  const newDuration = input.durationHours ?? oldDuration;
  const newStandard = input.cleaningStandard ?? oldStandard;
  const newBedrooms = input.bedrooms ?? oldBedrooms;
  const newBathrooms = input.bathrooms ?? oldBathrooms;
  const newOther = input.otherRooms ?? oldOther;
  const newAddOns = input.addOns ? Array.from(new Set(input.addOns)).sort() : oldAddOns;
  const newAddressId = input.addressId ?? booking.address_id;

  const timeChanged = newDate !== oldDate || newTime !== oldTime;
  const addressChanged = newAddressId !== booking.address_id;
  const sizeChanged =
    newDuration !== oldDuration ||
    newStandard !== oldStandard ||
    newBedrooms !== oldBedrooms ||
    newBathrooms !== oldBathrooms ||
    newOther !== oldOther ||
    newAddOns.join(",") !== oldAddOns.join(",");

  if (notesOnly && (timeChanged || addressChanged || sizeChanged || input.priceOverridePence != null)) {
    return {
      error:
        "The cleaner is already on the way or cleaning, so only the notes can change now. Use extra time for a longer visit.",
    };
  }

  const isOffice = Boolean(booking.commercial_spaces) && booking.service_type === "office";
  if (isOffice && sizeChanged) {
    return {
      error:
        "Office visits are priced from their spaces, so their length and extras can't be changed here. Change the date, time, address or notes, or cancel and rebook.",
    };
  }

  if (timeChanged) {
    const start = new Date(`${newDate}T${newTime}:00`);
    if (Number.isNaN(start.getTime())) return { error: "That date or time isn't valid." };
    // Admins may book at short notice, but never in the past.
    if (start.getTime() < Date.now() - 60 * 60 * 1000) {
      return { error: "The new time is in the past." };
    }
    updates.scheduled_date = newDate;
    updates.scheduled_start_time = `${newTime}:00`;
    changes.push({
      field: "Date and time",
      from: `${oldDate} ${oldTime}`,
      to: `${newDate} ${newTime}`,
    });
  }

  let newAddress = oldAddress;
  if (addressChanged) {
    const { data: address } = await admin
      .from("addresses")
      .select("*")
      .eq("id", newAddressId)
      .eq("customer_id", booking.customer_id)
      .maybeSingle();
    if (!address) return { error: "That address isn't one of this customer's saved addresses." };
    newAddress = address as Address;
    updates.address_id = newAddressId;
    changes.push({
      field: "Address",
      from: [oldAddress?.address_line_1, oldAddress?.postcode].filter(Boolean).join(", ") || "—",
      to: [newAddress.address_line_1, newAddress.postcode].filter(Boolean).join(", "),
    });
  }

  const category = serviceDefinition(booking.service_type).category;
  const allowedAddOns = new Map(
    SERVICE_ADD_ONS.filter((addOn) => !addOn.categories || addOn.categories.includes(category)).map(
      (addOn) => [addOn.id, addOn],
    ),
  );
  const unknown = newAddOns.filter((id) => !allowedAddOns.has(id) && !oldAddOns.includes(id));
  if (unknown.length) return { error: "One of those extras isn't offered for this service." };

  if (newDuration !== oldDuration) {
    updates.estimated_duration_hours = newDuration;
    changes.push({ field: "Length", from: hoursText(oldDuration), to: hoursText(newDuration) });
  }
  if (newStandard !== oldStandard) {
    updates.cleaning_standard = newStandard;
    changes.push({ field: "Cleaning standard", from: oldStandard, to: newStandard });
  }
  if (newBedrooms !== oldBedrooms) {
    updates.booked_num_bedrooms = newBedrooms;
    changes.push({ field: "Bedrooms", from: String(oldBedrooms), to: String(newBedrooms) });
  }
  if (newBathrooms !== oldBathrooms) {
    updates.booked_num_bathrooms = newBathrooms;
    changes.push({ field: "Bathrooms", from: String(oldBathrooms), to: String(newBathrooms) });
  }
  if (newOther !== oldOther) {
    updates.booked_num_other_rooms = newOther;
    changes.push({ field: "Other rooms", from: String(oldOther), to: String(newOther) });
  }
  const addOnsChanged = newAddOns.join(",") !== oldAddOns.join(",");
  const label = (id: string) => allowedAddOns.get(id)?.label ?? id;
  if (addOnsChanged) {
    changes.push({
      field: "Extras",
      from: oldAddOns.map(label).join(", ") || "None",
      to: newAddOns.map(label).join(", ") || "None",
    });
  }

  // Price: only the difference this edit makes.
  const oldTotalPence = Number(booking.amount_total ?? 0);
  const oldDiscountPence = Math.max(0, Number(booking.discount_pence ?? 0));
  let newTotalPence = oldTotalPence;
  let newDiscountPence = oldDiscountPence;
  let addOnRowsOut: BookingEditPlan["addOnRows"] = null;
  const pricingRelevant = !isOffice && (sizeChanged || timeChanged || addressChanged);

  if (pricingRelevant && oldAddress && newAddress) {
    const pricing = await loadServicePricing();
    const pricedType =
      pricingServiceTypeFor({
        frequencyChosen: true,
        isRecurring: Boolean(booking.is_recurring),
        serviceType: booking.service_type,
      }) ?? booking.service_type;
    const gift = Math.max(0, Number(booking.offer_free_hours ?? 0));
    const quote = (o: {
      address: Address;
      addOns: string[];
      bathrooms: number;
      bedrooms: number;
      date: string;
      duration: number;
      other: number;
      standard: CleaningStandard;
      time: string;
    }) =>
      estimatePriceBreakdown(
        pricedType,
        o.address,
        o.standard,
        o.addOns,
        { date: o.date, time: o.time },
        {
          // The stored length includes the free gift hour; it isn't billed.
          durationHours: Math.max(1, o.duration - gift),
          offerFreeHours: gift,
          pricing,
          rooms: { bathrooms: o.bathrooms, bedrooms: o.bedrooms, otherRooms: o.other },
        },
      );
    const before = quote({
      address: oldAddress,
      addOns: oldAddOns,
      bathrooms: oldBathrooms,
      bedrooms: oldBedrooms,
      date: oldDate,
      duration: oldDuration,
      other: oldOther,
      standard: oldStandard,
      time: oldTime,
    });
    const after = quote({
      address: newAddress,
      addOns: newAddOns,
      bathrooms: newBathrooms,
      bedrooms: newBedrooms,
      date: newDate,
      duration: newDuration,
      other: newOther,
      standard: newStandard,
      time: newTime,
    });

    const oldBase = oldTotalPence + oldDiscountPence;
    const newBase = Math.max(100, oldBase + (after.totalPence - before.totalPence));
    // Percentage discounts follow the new price; fixed ones stay as they were.
    let percentage = booking.offer_kind === PERCENT_OFFER_KIND;
    if (!percentage && booking.promo_code_id) {
      const { data: promo } = await admin
        .from("promo_codes")
        .select("discount_type")
        .eq("id", booking.promo_code_id)
        .maybeSingle();
      percentage = promo?.discount_type === "percentage";
    }
    newDiscountPence =
      percentage && oldBase > 0
        ? Math.round((oldDiscountPence * newBase) / oldBase)
        : Math.min(oldDiscountPence, newBase - 100);
    newTotalPence = Math.max(100, newBase - newDiscountPence);

    if (addOnsChanged || sizeChanged) {
      addOnRowsOut = after.addOns.map((addOn) => ({
        add_on_id: addOn.id,
        amount: addOn.amountPence,
        label: addOn.label,
      }));
    }
  }

  if (input.priceOverridePence != null) {
    newTotalPence = input.priceOverridePence;
  }

  const oldCleanerPence = Number(booking.amount_cleaner ?? 0);
  const split = splitBookingAmount(newTotalPence, {
    allocatedCleaners: booking.allocated_cleaners,
    cleanerHours: booking.cleaner_hours,
    estimatedDurationHours: newDuration,
  });
  const priceChanged = newTotalPence !== oldTotalPence;
  if (priceChanged || newDuration !== oldDuration) {
    updates.amount_total = newTotalPence;
    updates.discount_pence = newDiscountPence;
    updates.amount_cleaner = split.amount_cleaner;
    updates.amount_platform = split.amount_platform;
  }
  if (priceChanged) {
    changes.push({ field: "Price", from: money(oldTotalPence), to: money(newTotalPence) });
  }
  if (split.amount_cleaner !== oldCleanerPence && booking.cleaner_id) {
    changes.push({ field: "Cleaner pay", from: money(oldCleanerPence), to: money(split.amount_cleaner) });
  }

  return {
    plan: {
      addOnRows: addOnRowsOut,
      changes,
      cleanerMustReconfirm:
        Boolean(booking.cleaner_id) && (timeChanged || addressChanged) && !input.cleanerAgreed,
      newCleanerPence: split.amount_cleaner,
      newDiscountPence,
      newTotalPence,
      oldCleanerPence,
      oldTotalPence,
      priceChanged,
      timeChanged,
      updates,
    },
  };
}
