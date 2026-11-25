import {
  FIRST_VISIT_OFFER_FREE_HOURS,
  FIRST_VISIT_OFFER_SOURCES,
  firstVisitOfferAppliesToService,
  firstVisitOfferSessionEligible,
  ukPhoneMatchKey,
} from "@/lib/bookings/first-visit-offer";
import { PERCENT_OFFER_PERCENT, PERCENT_OFFER_SOURCES } from "@/lib/bookings/percent-offer";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type FirstVisitOfferMatch = {
  freeHours: number;
  leadId: string;
};

export async function resolveFirstVisitOffer({
  admin,
  customerId,
  durationHours,
  email,
  phone,
  serviceType,
}: {
  admin: AdminClient;
  customerId: string;
  durationHours: number | null | undefined;
  email: string | null | undefined;
  phone: string | null | undefined;
  serviceType: string;
}): Promise<FirstVisitOfferMatch | null> {
  if (!firstVisitOfferAppliesToService(serviceType)) return null;
  if (!firstVisitOfferSessionEligible(durationHours)) return null;
  if (await customerHasPriorBooking(admin, customerId)) return null;
  const lead = await findUnusedFirstVisitOfferLead(admin, email, phone);
  if (!lead) return null;
  return { freeHours: FIRST_VISIT_OFFER_FREE_HOURS, leadId: lead.id };
}

export async function firstVisitOfferLeadAvailable({
  admin,
  customerId,
  email,
  phone,
}: {
  admin: AdminClient;
  customerId: string;
  email: string | null | undefined;
  phone: string | null | undefined;
}) {
  if (await customerHasPriorBooking(admin, customerId)) return false;
  const lead = await findUnusedFirstVisitOfferLead(admin, email, phone);
  return Boolean(lead);
}

export async function stampFirstVisitOfferLead({
  admin,
  bookingId,
  leadId,
}: {
  admin: AdminClient;
  bookingId: string;
  leadId: string;
}) {
  const { data: lead } = await admin
    .from("callback_leads")
    .select("id, outcome")
    .eq("id", leadId)
    .is("offer_redeemed_booking_id", null)
    .maybeSingle();
  if (!lead) return;

  const outcome = lead.outcome as string | null;
  const patch: Record<string, unknown> = {
    offer_redeemed_at: new Date().toISOString(),
    offer_redeemed_booking_id: bookingId,
    updated_at: new Date().toISOString(),
  };
  if (
    outcome !== "closed" &&
    outcome !== "out_of_area" &&
    outcome !== "customer"
  ) {
    patch.call_status = "spoke";
    patch.outcome = "customer";
  }

  await admin.from("callback_leads").update(patch).eq("id", lead.id);
}

async function customerHasPriorBooking(admin: AdminClient, customerId: string) {
  const { count } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .neq("status", "cancelled");
  return (count ?? 0) > 0;
}

async function findUnusedFirstVisitOfferLead(
  admin: AdminClient,
  email: string | null | undefined,
  phone: string | null | undefined,
  sources: string[] = [...FIRST_VISIT_OFFER_SOURCES],
) {
  const normalisedEmail = email?.trim().toLowerCase() ?? "";

  if (normalisedEmail) {
    const { data } = await admin
      .from("callback_leads")
      .select("id")
      .eq("email", normalisedEmail)
      .in("source", sources)
      .is("offer_redeemed_booking_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.id) return { id: data.id as string };
  }

  const phoneKey = ukPhoneMatchKey(phone);
  if (!phoneKey) return null;

  const { data: unused } = await admin
    .from("callback_leads")
    .select("id, phone")
    .in("source", sources)
    .is("offer_redeemed_booking_id", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const match = (unused ?? []).find(
    (row) => ukPhoneMatchKey(row.phone as string) === phoneKey,
  );
  return match?.id ? { id: match.id as string } : null;
}

/**
 * 20% off the first booking for someone who asked for a callback on the
 * Meta offer page (same email or phone), if they have no booking yet.
 */
export async function resolvePercentOffer({
  admin,
  customerId,
  email,
  phone,
}: {
  admin: AdminClient;
  customerId: string;
  email: string | null | undefined;
  phone: string | null | undefined;
}) {
  if (await customerHasPriorBooking(admin, customerId)) return null;
  const lead = await findUnusedFirstVisitOfferLead(admin, email, phone, [
    ...PERCENT_OFFER_SOURCES,
  ]);
  return lead ? { leadId: lead.id, percent: PERCENT_OFFER_PERCENT } : null;
}
