import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import { buildAppAuthLink, resolveAppUrl } from "@/lib/auth/send-auth-link-email";
import { dashboardForRole } from "@/lib/auth/redirects";
import { bookingDraftResumeUrl, upsertBookingDraftLead } from "@/lib/bookings/drafts";
import {
  ADDRESS_NEEDS_STREET_MESSAGE,
  addressHasStreet,
  composeStreetLine,
} from "@/lib/customer/address-completeness";
import {
  bookingServiceName,
  recommendedStandardFor,
  SERVICES,
  SERVICE_ADD_ONS,
} from "@/lib/customer/services";
import { sendBrandedEmail } from "@/lib/email/send-email";
import { syncSignupToZoho } from "@/lib/zoho/crm";
import type { BookingDraft, ServiceType } from "@/types/customer";

export const dynamic = "force-dynamic";

/** Home, moving and short-let services; office and recovery need extra questions. */
const ASSISTED_SERVICES = SERVICES.filter((service) =>
  ["residential", "moving_home", "short_term_rental"].includes(service.category),
).map((service) => service.value) as [ServiceType, ...ServiceType[]];

const bookingSchema = z.object({
  accessNotes: z.string().trim().max(500).optional().default(""),
  addOns: z.array(z.string()).max(20).default([]),
  bathrooms: z.number().int().min(1).max(10),
  bedrooms: z.number().int().min(0).max(12),
  city: z.string().trim().min(2, "Enter the town or city."),
  cleaningStandard: z.enum(["essential", "enhanced", "comprehensive"]).optional(),
  durationHours: z.number().min(1).max(12),
  frequency: z.enum(["once", "weekly", "fortnightly", "monthly"]),
  hasPets: z.boolean(),
  house: z.string().trim().min(1, "Enter the house or flat number / name."),
  notes: z.string().trim().max(1000).optional().default(""),
  postcode: z.string().trim().min(5, "Enter the postcode.").max(9),
  propertyType: z.enum(["house", "flat", "other"]),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time."),
  serviceType: z.enum(ASSISTED_SERVICES),
  street: z.string().trim().min(2, "Enter the street."),
});

const schema = z.object({
  booking: bookingSchema.nullable().optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  firstName: z.string().trim().min(1, "Enter a first name.").max(80),
  lastName: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().min(7, "Enter a phone number.").max(30),
});

/** Best-effort coordinates for matching; matching falls back to the postcode. */
async function geocode(text: string) {
  const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://api.geoapify.com/v1/geocode/search");
    url.searchParams.set("text", text);
    url.searchParams.set("filter", "countrycode:gb");
    url.searchParams.set("limit", "1");
    url.searchParams.set("format", "json");
    url.searchParams.set("apiKey", key);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { results?: Array<{ lat?: number; lon?: number }> };
    const hit = data.results?.[0];
    return hit?.lat != null && hit?.lon != null ? { lat: hit.lat, lon: hit.lon } : null;
  } catch {
    return null;
  }
}

/**
 * Create a customer account for someone who needs help (phone, in person),
 * optionally with a booking prepared for them. A new customer gets one email
 * to set their password, which then opens the prepared booking; an existing
 * customer gets a link to the prepared booking. Either way the customer
 * checks the details and adds their own card. Admins never handle cards.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the details and try again." },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const admin = auth.admin;
  const appUrl = resolveAppUrl(request);
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ");
  const phone = input.phone.replace(/[^\d+]/g, "");

  if (input.booking) {
    const today = new Date().toISOString().slice(0, 10);
    if (input.booking.scheduledDate <= today) {
      return NextResponse.json({ error: "Choose a date from tomorrow onwards." }, { status: 400 });
    }
  }

  // Existing account?
  const { data: existing } = await admin
    .from("profiles")
    .select("id,role,full_name,phone")
    .ilike("email", input.email)
    .maybeSingle();
  if (existing && existing.role !== "customer") {
    return NextResponse.json(
      { error: `This email belongs to a ${existing.role} account, so it can't be used for a customer.` },
      { status: 409 },
    );
  }
  if (existing && !input.booking) {
    return NextResponse.json(
      {
        customerId: existing.id,
        error: "This customer already has an account. Add a booking to send them one to confirm.",
      },
      { status: 409 },
    );
  }

  let customerId = existing?.id as string | undefined;
  const newAccount = !existing;
  // Existing account: fill in a missing name or phone from what the admin
  // typed (never overwrite what the customer set themselves).
  if (existing) {
    const fill: Record<string, string> = {};
    if (!String(existing.full_name ?? "").trim() && fullName) fill.full_name = fullName;
    if (!String(existing.phone ?? "").trim() && phone) fill.phone = phone;
    if (Object.keys(fill).length) await admin.from("profiles").update(fill).eq("id", existing.id);
  }
  if (!customerId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: input.email,
      email_confirm: true,
      user_metadata: { created_by_admin: auth.user.id, full_name: fullName, phone },
    });
    if (error || !created.user) {
      return NextResponse.json(
        { error: error?.message ?? "Couldn't create the account." },
        { status: 400 },
      );
    }
    customerId = created.user.id;
    await admin
      .from("profiles")
      .update({ created_by_admin: auth.user.id, full_name: fullName, phone })
      .eq("id", customerId);
    try {
      await syncSignupToZoho({ email: input.email, fullName, phone, role: "customer", userId: customerId });
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  // Prepare the booking: save the address, then a draft the customer confirms.
  let draftPath: string | null = null;
  let draftUrl: string | null = null;
  const booking = input.booking ?? null;
  if (booking) {
    const postcode = booking.postcode.toUpperCase().replace(/\s+/g, " ").trim();
    const line1 = [composeStreetLine(booking.house, booking.street), booking.city, postcode].join(", ");
    if (!addressHasStreet({ address_line_1: line1, city: booking.city, postcode })) {
      return NextResponse.json({ error: ADDRESS_NEEDS_STREET_MESSAGE }, { status: 400 });
    }
    const point = await geocode(line1);
    const { count: addressCount } = await admin
      .from("addresses")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId);
    const { data: address, error: addressError } = await admin
      .from("addresses")
      .insert({
        address_line_1: line1,
        address_line_2: null,
        city: booking.city,
        customer_id: customerId,
        is_default: !addressCount,
        label: "Home",
        latitude: point?.lat ?? null,
        longitude: point?.lon ?? null,
        num_bathrooms: booking.bathrooms,
        num_bedrooms: booking.bedrooms,
        num_other_rooms: 0,
        postcode,
        property_type: booking.propertyType,
        special_requirements: booking.accessNotes || null,
      })
      .select("id")
      .single();
    if (addressError || !address) {
      return NextResponse.json(
        { error: addressError?.message ?? "Couldn't save the address." },
        { status: 400 },
      );
    }

    const service = SERVICES.find((item) => item.value === booking.serviceType)!;
    const allowedAddOns = new Set(
      SERVICE_ADD_ONS.filter(
        (addOn) => !addOn.categories || addOn.categories.includes(service.category),
      ).map(
        (addOn) => addOn.id,
      ),
    );
    const draft: Partial<BookingDraft> = {
      addressId: address.id as string,
      alternateTimes: [],
      cleaningStandard: booking.cleaningStandard ?? recommendedStandardFor(booking.serviceType),
      contactEmail: input.email,
      customRecurrenceDates: [],
      estimatedDurationHours: booking.durationHours,
      frequencyChosen: true,
      guestAddress: null,
      hasPets: booking.hasPets,
      isRecurring: booking.frequency !== "once",
      numBathrooms: booking.bathrooms,
      numBedrooms: booking.bedrooms,
      officeSpaces: [],
      otherRoomTypes: [],
      petTypes: [],
      preferSameCleaner: booking.frequency !== "once",
      preferredCleanerId: null,
      promoCode: "",
      recommendationOutcome: "not_shown",
      recurrencePattern: booking.frequency === "once" ? null : booking.frequency,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      selectedAddOns: booking.addOns.filter((id) => allowedAddOns.has(id)),
      serviceCategory: service.category,
      serviceType: booking.serviceType,
      specialAttentionAreas: [],
      specialInstructions: booking.notes,
    };
    try {
      const saved = await upsertBookingDraftLead({
        currentStep: "checkout",
        draft,
        email: input.email,
        userId: customerId,
      });
      await admin
        .from("booking_drafts")
        .update({ prepared_at: new Date().toISOString(), prepared_by: auth.user.id })
        .eq("id", saved.id);
      draftUrl = bookingDraftResumeUrl(saved.resume_token as string);
      draftPath = new URL(draftUrl).pathname + new URL(draftUrl).search;
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Couldn't prepare the booking." },
        { status: 400 },
      );
    }
  }

  // One email: new customers set a password (then land on the booking);
  // existing customers go straight to the booking.
  const emailData = booking
    ? {
        address: [composeStreetLine(booking.house, booking.street), booking.city, booking.postcode.toUpperCase()].join(", "),
        firstName: input.firstName,
        scheduledDate: new Date(`${booking.scheduledDate}T12:00:00`).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          weekday: "long",
        }),
        scheduledTime: booking.scheduledTime,
        serviceName: bookingServiceName({
          is_recurring: booking.frequency !== "once",
          service_type: booking.serviceType,
        }),
      }
    : { firstName: input.firstName };
  let emailSent = false;
  try {
    if (newAccount) {
      const { data: link, error } = await admin.auth.admin.generateLink({
        email: input.email,
        options: { redirectTo: `${appUrl}/update-password` },
        type: "recovery",
      });
      const hashedToken = link?.properties?.hashed_token;
      if (error || !hashedToken) throw error ?? new Error("Password link was not generated.");
      // Set a password first, then continue to the prepared booking.
      const after = draftPath ?? dashboardForRole("customer");
      const setPasswordUrl = new URL(
        buildAppAuthLink({
          appUrl,
          hashedToken,
          redirectTo: `${appUrl}/update-password`,
          type: "recovery",
        }),
      );
      setPasswordUrl.searchParams.set("next", `/update-password?next=${encodeURIComponent(after)}`);
      emailSent = await sendBrandedEmail({
        data: { appUrl, ...emailData, setPasswordUrl: setPasswordUrl.toString() },
        template: "customer.account_created",
        to: input.email,
      });
    } else if (draftUrl) {
      emailSent = await sendBrandedEmail({
        data: { appUrl, ...emailData, bookingUrl: draftUrl },
        template: "customer.booking_prepared",
        to: input.email,
      });
    }
  } catch (error) {
    Sentry.captureException(error);
  }

  await logAdminAction({
    action: newAccount ? "customer.create" : "customer.prepare_booking",
    adminId: auth.user.id,
    entityId: customerId!,
    entityType: "profile",
    metadata: { bookingPrepared: Boolean(booking), emailSent },
  });

  return NextResponse.json({
    bookingLink: draftUrl,
    customerId,
    emailSent,
    newAccount,
  });
}
