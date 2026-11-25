import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { AbandonedBookingLeadsTable } from "@/components/admin/abandoned-booking-leads-table";
import { frequencyLabelForBooking } from "@/lib/customer/booking-flow";
import { formatServiceName, SERVICE_ADD_ONS } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceType } from "@/types/customer";

export const metadata = { title: "Abandoned bookings" };

type Draft = Record<string, unknown>;

function str(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function serviceLabelFromDraft(draft: Draft): string | null {
  const serviceType = str(draft.serviceType);
  if (!serviceType) return null;
  try {
    return formatServiceName(serviceType as ServiceType);
  } catch {
    return serviceType.replaceAll("_", " ");
  }
}

/** Everything the person had filled in, one line per answer, so staff can call them with context. */
function draftDetails(draft: Draft): string[] {
  const address = (draft.guestAddress ?? {}) as Draft;
  const addressLine = [str(address.address_line_1), str(address.city), str(address.postcode)]
    .filter(Boolean)
    .join(", ");
  const bedrooms = typeof draft.numBedrooms === "number" ? draft.numBedrooms : null;
  const bathrooms = typeof draft.numBathrooms === "number" ? draft.numBathrooms : null;
  const addOns = Array.isArray(draft.selectedAddOns)
    ? (draft.selectedAddOns as string[]).map(
        (id) => SERVICE_ADD_ONS.find((addOn) => addOn.id === id)?.label ?? id.replaceAll("_", " "),
      )
    : [];
  const alternates = Array.isArray(draft.alternateTimes) ? (draft.alternateTimes as string[]).filter(Boolean) : [];
  const officeSpaces = Array.isArray(draft.officeSpaces) ? (draft.officeSpaces as Draft[]) : [];
  const frequency =
    draft.frequencyChosen || draft.isRecurring
      ? frequencyLabelForBooking({
          is_recurring: Boolean(draft.isRecurring),
          recurrence_pattern: (str(draft.recurrencePattern) as never) ?? null,
        })
      : null;
  const lines = [
    addressLine ? `Address: ${addressLine}` : null,
    bedrooms !== null || bathrooms !== null
      ? `Rooms: ${bedrooms ?? "?"} bed · ${bathrooms ?? "?"} bath`
      : null,
    officeSpaces.length
      ? `Office: ${officeSpaces
          .map((space) => `${space.quantity ?? 1} × ${str(space.customLabel) ?? String(space.spaceType ?? "space").replaceAll("_", " ")}`)
          .join(", ")}`
      : null,
    str(draft.scheduledDate)
      ? `When: ${str(draft.scheduledDate)}${str(draft.scheduledTime) ? ` at ${str(draft.scheduledTime)}` : ""}${alternates.length ? ` (also ${alternates.join(", ")})` : ""}`
      : null,
    typeof draft.estimatedDurationHours === "number" ? `Duration: ${draft.estimatedDurationHours}h` : null,
    frequency ? `How often: ${frequency}` : null,
    addOns.length ? `Extras: ${addOns.join(", ")}` : null,
    draft.hasPets === true ? "Pets: yes" : draft.hasPets === false ? "Pets: no" : null,
    str(draft.promoCode) ? `Promo code: ${str(draft.promoCode)}` : null,
    str(draft.specialInstructions) ? `Notes: ${str(draft.specialInstructions)}` : null,
  ];
  return lines.filter((line): line is string => Boolean(line));
}

export default async function AdminAbandonedBookingsPage() {
  const admin = createAdminClient();
  // Every draft, not only ones that got a reminder email: with lead
  // automation on, the reminder job never runs and the page would be empty.
  const { data, error } = await fetchAllRows((from, to) =>
    admin
      .from("booking_drafts")
      .select(
        "id,email,user_id,current_step,reminder_count,last_reminded_at,created_at,updated_at,completed_at,completed_booking_id,draft,prepared_by,prepared_at",
      )
      .order("updated_at", { ascending: false })
      .range(from, to),
  );

  const userIds = Array.from(
    new Set((data ?? []).map((row) => row.user_id as string | null).filter((id): id is string => Boolean(id))),
  );
  const people = new Map<string, { full_name: string | null; phone: string | null }>();
  for (let offset = 0; offset < userIds.length; offset += 100) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id,full_name,phone")
      .in("id", userIds.slice(offset, offset + 100));
    for (const profile of profiles ?? []) {
      people.set(profile.id, { full_name: profile.full_name, phone: profile.phone });
    }
  }

  const rows = (data ?? []).map((row) => {
    const draft = (row.draft && typeof row.draft === "object" ? row.draft : {}) as Draft;
    const person = row.user_id ? people.get(row.user_id as string) : undefined;
    return {
      completed_at: row.completed_at as string | null,
      completed_booking_id: row.completed_booking_id as string | null,
      created_at: row.created_at as string,
      current_step: row.current_step as string | null,
      details: draftDetails(draft),
      email: row.email as string,
      full_name: person?.full_name ?? null,
      id: row.id as string,
      last_reminded_at: row.last_reminded_at as string | null,
      phone: person?.phone ?? null,
      prepared: Boolean(row.prepared_by),
      reminder_count: Number(row.reminder_count ?? 0),
      service_label: serviceLabelFromDraft(draft),
      updated_at: (row.updated_at as string | null) ?? (row.created_at as string),
      user_id: row.user_id as string | null,
    };
  });

  return (
    <div className="min-w-0">
      {error ? (
        <p className="text-sm text-[#9a3412]">
          Abandoned booking leads could not be loaded. Apply the latest database
          migration and refresh this page.
        </p>
      ) : (
        <AbandonedBookingLeadsTable rows={rows} />
      )}
    </div>
  );
}
