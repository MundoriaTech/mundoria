import { AdminExtraTime } from "@/components/shared/extra-time";
import type { ExtraTimeRow } from "@/lib/bookings/extra-time";
import { PagedSimpleTable } from "@/components/admin/paged-simple-table";
import { filterCleanersForBooking, sameAudience } from "@/lib/matching/seed-accounts";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingActions } from "@/components/admin/booking-actions";
import { BookingEditPanel } from "@/components/admin/booking-edit-panel";
import { BookingEditHistory, type HistoryEntry } from "@/components/admin/booking-edit-history";
import { RESET_REASON_PREFIX, undoableEditId } from "@/lib/bookings/undo-booking-edit";
import {
  FULLY_EDITABLE_STATUSES,
  NOTES_ONLY_STATUSES,
} from "@/lib/admin/booking-edit";
import { DetailSection } from "@/components/admin/detail-section";
import { humanize, poundsFromPence, ukDateTime } from "@/lib/admin/format";
import { MatchingDecisionLog } from "@/components/admin/matching-decision-log";
import { BookingSummaryCard } from "@/components/customer/booking-basket";
import {
  frequencyLabelForBooking,
  petsFromNotes,
} from "@/lib/customer/booking-flow";
import {
  LEGACY_SCHEDULE_MULTIPLIERS,
  loadServicePricing,
} from "@/lib/customer/pricing-config";
import { hourlyRatePence } from "@/lib/customer/rate-card";
import { loadMatchingList } from "@/lib/matching/emergency-list";
import {
  bookingServiceName,
  estimatePriceBreakdown,
  formatHourlyRate,
  formatMoney,
  formatServiceName,
  SERVICE_ADD_ONS,
  serviceDefinition,
  standardLabel,
} from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import type { Address, OfficeSpaceDraft } from "@/types/customer";

export default async function AdminBookingPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const [
    { data: booking },
    { data: matching },
    { data: timeline },
    { data: messages },
    { data: cleaners },
    { data: addOns },
    { data: team },
    { data: offers },
    reserves,
    { data: draftRow },
  ] = await Promise.all([
    admin.from("bookings").select("*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name,email,phone),cleaner:profiles!bookings_cleaner_id_fkey(full_name,email,phone)").eq("id", params.id).single(),
    admin.from("matching_decisions").select("*").eq("booking_id", params.id).order("created_at"),
    admin.from("booking_status_history").select("*").eq("booking_id", params.id).order("created_at"),
    admin.from("messages").select("*,sender:profiles!messages_sender_id_fkey(full_name)").eq("booking_id", params.id).order("created_at"),
    admin.from("profiles").select("id,full_name,email,cleaner_profiles!cleaner_profiles_id_fkey!inner(status)").eq("role", "cleaner").in("cleaner_profiles.status", ["certified", "active"]),
    admin.from("booking_add_ons").select("*").eq("booking_id", params.id).order("created_at"),
    admin.from("booking_team_members").select("cleaner_id").eq("booking_id", params.id),
    admin
      .from("cleaner_job_responses")
      .select("cleaner_id,expires_at,responded_at,response")
      .eq("booking_id", params.id)
      .order("offered_at", { ascending: false })
      .limit(5),
    loadMatchingList(params.id),
    admin
      .from("booking_drafts")
      .select("created_at,prepared_at,prepared_by,marketing_opt_in")
      .eq("completed_booking_id", params.id)
      .maybeSingle(),
  ]);
  if (!booking) notFound();
  const [{ data: promo }, { data: preferredCleaner }, { data: preparer }, { data: redeemedCallback }] = await Promise.all([
    booking.promo_code_id
      ? admin.from("promo_codes").select("code").eq("id", booking.promo_code_id).maybeSingle()
      : Promise.resolve({ data: null }),
    booking.preferred_cleaner_id
      ? admin.from("profiles").select("id,full_name").eq("id", booking.preferred_cleaner_id).maybeSingle()
      : Promise.resolve({ data: null }),
    draftRow?.prepared_by
      ? admin.from("profiles").select("full_name").eq("id", draftRow.prepared_by).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("callback_leads")
      .select("id,source")
      .eq("offer_redeemed_booking_id", params.id)
      .maybeSingle(),
  ]);
  const namedCleanerIds = Array.from(
    new Set(
      [
        ...(matching ?? [])
          .filter((item) =>
            [
              "admin_override_assignment",
              "emergency_list_promoted",
              "offer_accepted",
              "selected",
            ].includes(item.decision),
          )
          .map((item) => item.cleaner_id),
        ...reserves.map((item) => item.cleaner_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  );
  const decisionNames = await loadCleanerNames(admin, namedCleanerIds);
  // Older history can include test (seed) cleaners from before seed isolation;
  // only show cleaners who could actually work this booking.
  const audienceCleanerIds = new Set(
    await filterCleanersForBooking(
      admin,
      params.id,
      Array.from(
        new Set(
          (matching ?? [])
            .map((item) => item.cleaner_id as string | null)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    ),
  );
  const openOffer = (offers ?? []).find(
    (offer) =>
      !offer.responded_at &&
      offer.expires_at &&
      new Date(offer.expires_at).getTime() > Date.now(),
  );
  let payment: { id: string; status: string; amount: number; amount_capturable: number } | null = null;
  if (booking.stripe_payment_intent_id && process.env.STRIPE_SECRET_KEY) {
    const intent = await getStripe().paymentIntents.retrieve(booking.stripe_payment_intent_id);
    payment = { id: intent.id, status: intent.status, amount: intent.amount, amount_capturable: intent.amount_capturable };
  }
  const liveAddress = (booking.address ?? null) as Address | null;
  const editable = (FULLY_EDITABLE_STATUSES as readonly string[]).includes(booking.status);
  const notesOnly = (NOTES_ONLY_STATUSES as readonly string[]).includes(booking.status);
  const { data: customerAddresses } =
    editable || notesOnly
      ? await admin
          .from("addresses")
          .select("id,address_line_1,postcode")
          .eq("customer_id", booking.customer_id)
      : { data: null };
  const editCategory = serviceDefinition(booking.service_type).category;
  const [{ data: editRows }, { data: actionRows }] = await Promise.all([
    admin
      .from("booking_edits")
      .select("id,actor_type,actor_id,reason,changes,undo_of,undone_at,created_at")
      .eq("booking_id", params.id)
      .order("created_at", { ascending: false }),
    admin
      .from("admin_action_logs")
      .select("id,admin_id,action,reason,metadata,created_at")
      .eq("entity_type", "booking")
      .eq("entity_id", params.id)
      // Edits and undos are shown from booking_edits, with their changes.
      .not("action", "in", "(edit_booking,undo_booking_edit,reset_booking)")
      .order("created_at", { ascending: false }),
  ]);
  const historyNames = await loadCleanerNames(
    admin,
    Array.from(
      new Set(
        [
          ...(editRows ?? []).map((row) => row.actor_id as string | null),
          ...(actionRows ?? []).map((row) => row.admin_id as string | null),
        ].filter((id): id is string => Boolean(id)),
      ),
    ),
  );
  const historyEntries: HistoryEntry[] = [
    ...(editRows ?? []).map((row) => ({
      changes: (row.changes ?? []) as HistoryEntry["changes"],
      createdAt: row.created_at as string,
      id: row.id as string,
      kind: (row.undo_of ? "undo" : "edit") as HistoryEntry["kind"],
      reason: row.actor_type === "customer" ? null : (row.reason as string | null),
      title: row.undo_of
        ? String(row.reason ?? "").startsWith(RESET_REASON_PREFIX)
          ? "Reset to the original booking"
          : "Edit undone"
        : row.actor_type === "customer"
          ? "Customer changed the booking"
          : "Admin edited the booking",
      undoneAt: row.undone_at as string | null,
      who: `${(row.actor_id && historyNames[row.actor_id as string]) || "Unknown"}${
        row.actor_type === "customer" ? " (customer)" : " (admin)"
      }`,
    })),
    ...(actionRows ?? []).map((row) => {
      const meta = (row.metadata ?? {}) as { status?: string | null };
      return {
        changes: [],
        createdAt: row.created_at as string,
        id: row.id as string,
        kind: "action" as const,
        reason: row.reason as string | null,
        title:
          row.action === "status" && meta.status
            ? `Status set to ${humanize(meta.status)}`
            : humanize(String(row.action)),
        undoneAt: null,
        who: `${(row.admin_id && historyNames[row.admin_id as string]) || "Unknown"} (admin)`,
      };
    }),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const undoableId =
    editable || notesOnly
      ? undoableEditId(
          (editRows ?? []).map((row) => ({
            id: row.id as string,
            undo_of: row.undo_of as string | null,
            undone_at: row.undone_at as string | null,
          })),
        )
      : null;
  // Prefer the rooms captured when this booking was made; older bookings
  // (before the snapshot) fall back to the address as it is today.
  const hasSnapshot = booking.booked_num_bedrooms != null || booking.booked_num_bathrooms != null;
  const address = liveAddress
    ? ({
        ...liveAddress,
        num_bathrooms: booking.booked_num_bathrooms ?? liveAddress.num_bathrooms,
        num_bedrooms: booking.booked_num_bedrooms ?? liveAddress.num_bedrooms,
        num_other_rooms: booking.booked_num_other_rooms ?? liveAddress.num_other_rooms,
        property_type: booking.booked_property_type ?? liveAddress.property_type,
      } as Address)
    : null;
  const addOnRows = addOns ?? [];
  const durationHours =
    booking.estimated_duration_hours != null
      ? Number(booking.estimated_duration_hours)
      : null;
  const offerHours =
    booking.offer_free_hours != null ? Number(booking.offer_free_hours) : 0;
  const notes = booking.special_instructions?.trim() || "";
  const extraNotes = leftoverCustomerNotes(notes);
  const conditionLabel = propertyConditionLabel(booking.property_condition);
  const officeHours =
    booking.service_type === "office" && booking.cleaner_hours != null
      ? Number(booking.cleaner_hours)
      : null;
  const allocated = booking.allocated_cleaners ?? 1;
  const recommendation =
    booking.recommendation_outcome &&
    booking.recommendation_outcome !== "not_shown"
      ? `${booking.recommendation_outcome.replaceAll("_", " ")}${
          booking.recommended_service_type
            ? ` → ${formatServiceName(booking.recommended_service_type)}`
            : ""
        }`
      : null;
  const extraRows: [string, string][] = [
    booking.recently_moved != null
      ? ["Moving in or out", booking.recently_moved ? "Yes (from the service chosen)" : "No"]
      : null,
    conditionLabel ? ["Access / first-clean need", conditionLabel] : null,
    allocated > 1 ? ["Cleaners on this visit", String(allocated)] : null,
    officeHours != null
      ? [
          "Cleaner-hours",
          officeHours.toFixed(1).replace(/\.0$/, ""),
        ]
      : null,
    recommendation ? ["Recommendation", recommendation] : null,
    extraNotes ? ["Customer notes", extraNotes] : null,
  ].filter((row): row is [string, string] => Boolean(row));
  const { data: extraTime } = await admin
    .from("booking_time_extensions").select("id,minutes,amount_pence,reason,status,created_at,decided_at").eq("booking_id", params.id).order("created_at", { ascending: false });
  const pricing = await loadServicePricing();
  const sessionHours = Math.max(0, (durationHours ?? 0) - offerHours);
  const priceBooking = (
    legacyFreeExtraTime: boolean,
    legacySchedule = false,
  ) =>
    address
      ? estimatePriceBreakdown(
          booking.service_type,
          address,
          booking.cleaning_standard ?? "enhanced",
          addOnRows
            .map((row) => row.add_on_id)
            .filter((id): id is string => Boolean(id)),
          {
            date: booking.scheduled_date,
            time: booking.scheduled_start_time,
          },
          {
            durationHours: sessionHours || null,
            legacyFreeExtraTime,
            offerFreeHours: offerHours,
            pricing: legacySchedule
              ? { ...pricing, schedule: LEGACY_SCHEDULE_MULTIPLIERS }
              : pricing,
            officeSpaces: (booking.commercial_spaces ?? undefined) as OfficeSpaceDraft[] | undefined,
            rooms: {
              bathrooms: address.num_bathrooms,
              bedrooms: address.num_bedrooms,
              otherRooms: address.num_other_rooms,
            },
          },
        )
      : null;
  // Older bookings keep their agreed price. Explain each with the rules that
  // actually produced it: before extra time was billed, and/or before the
  // early/evening/weekend surcharges were removed.
  const chargedTotal = Number(booking.amount_total ?? 0);
  const currentBreakdown = priceBooking(false);
  const explained = (
    [
      [true, false],
      [false, true],
      [true, true],
    ] as const
  )
    .map(([freeTime, schedule]) => ({
      breakdown: priceBooking(freeTime, schedule),
      freeTime,
    }))
    .find((candidate) => candidate.breakdown?.totalPence === chargedTotal);
  const pricedOnOlderRules = Boolean(
    currentBreakdown && currentBreakdown.totalPence !== chargedTotal && explained,
  );
  const breakdown = pricedOnOlderRules
    ? explained!.breakdown
    : currentBreakdown;
  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div>
        <p className="break-all font-mono text-xs text-primary sm:text-sm">
          {booking.id}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {bookingServiceName(booking)}
        </h1>
      </div>
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_.6fr]">
        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="font-semibold">People and status</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <b>Customer:</b>{" "}
                <Link
                  className="font-semibold text-[#524096] hover:underline"
                  href={`/admin/customer/${booking.customer_id}`}
                >
                  {booking.customer?.full_name ?? "Customer"}
                </Link>
              </p>
              <p>
                <b>Cleaner:</b>{" "}
                {booking.cleaner_id ? (
                  <Link className="font-semibold text-[#524096] hover:underline" href={`/admin/cleaners/${booking.cleaner_id}`}>
                    {booking.cleaner?.full_name ?? "Cleaner"}
                  </Link>
                ) : (
                  "Unassigned"
                )}
                {booking.cleaner?.phone ? (
                  <a className="ml-2 text-[#524096] hover:underline" href={`tel:${booking.cleaner.phone}`}>
                    {booking.cleaner.phone}
                  </a>
                ) : null}
              </p>
              <p className="break-all">
                <b>Email:</b>{" "}
                {booking.customer?.email ? (
                  <a
                    className="text-[#524096] hover:underline"
                    href={`mailto:${booking.customer.email}`}
                  >
                    {booking.customer.email}
                  </a>
                ) : (
                  "-"
                )}
              </p>
              <p>
                <b>Phone:</b>{" "}
                {booking.customer?.phone ? (
                  <a
                    className="text-[#524096] hover:underline"
                    href={`tel:${booking.customer.phone}`}
                  >
                    {booking.customer.phone}
                  </a>
                ) : (
                  "-"
                )}
              </p>
              <p>
                <b>Status:</b> {booking.status.replaceAll("_", " ")}
              </p>
              <p>
                <b>Payment:</b> {booking.payment_status}
              </p>
            </div>
          </section>
          <BookingSummaryCard
            addOns={(
              breakdown?.addOns ??
              addOnRows.map((row) => ({
                amountPence: Number(row.amount ?? 0),
                id: row.add_on_id ?? row.label,
                label: row.label,
                ratePence: undefined as number | undefined,
              }))
            ).map((addOn) => ({
              amount: addOn.amountPence,
              detail: addOn.ratePence
                ? `${formatHourlyRate(addOn.ratePence)} × ${formatVisitHours(breakdown?.billableHours ?? sessionHours)}`
                : undefined,
              label: addOn.label,
            }))}
            address={address}
            amount={
              booking.amount_total != null ? Number(booking.amount_total) : null
            }
            bathrooms={address?.num_bathrooms ?? null}
            bedrooms={address?.num_bedrooms ?? null}
            alternateTimes={alternateTimesFromNotes(notes)}
            durationHint={
              officeHours != null
                ? `${officeHours.toFixed(1).replace(/\.0$/, "")} cleaner-hours`
                : breakdown && breakdown.visitHours !== breakdown.billableHours
                  ? `${formatVisitHours(breakdown.visitHours)} on site, ${formatVisitHours(breakdown.billableHours)} charged`
                  : offerHours > 0
                    ? `${formatVisitHours(offerHours)} free on this visit`
                    : null
            }
            durationHours={breakdown?.billableHours ?? durationHours}
            frequencyLabel={frequencyLabelForBooking({
              is_recurring: Boolean(booking.is_recurring),
              recurrence_pattern: booking.recurrence_pattern ?? null,
            })}
            hasPets={petsFromNotes(booking.special_instructions)}
            hourlyRatePence={
              breakdown?.ratePence ??
              hourlyRatePence(
                booking.service_type,
                booking.cleaning_standard ?? "enhanced",
                pricing,
              )
            }
            priorityAreas={booking.special_attention_areas ?? []}
            scheduledDate={booking.scheduled_date}
            scheduledTime={booking.scheduled_start_time}
            serviceLabel={bookingServiceName(booking)}
            standardLabel={standardLabel(booking.cleaning_standard ?? "enhanced")}
            title="What they booked"
          />
          {breakdown ? (
            <section className="rounded-xl border bg-card p-4 sm:p-5">
              <h2 className="font-semibold">How the price adds up</h2>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  Cleaning {formatVisitHours(breakdown.billableHours)} ×{" "}
                  {formatHourlyRate(breakdown.ratePence)} ={" "}
                  {formatMoney(
                    Math.round(breakdown.billableHours * breakdown.ratePence),
                  )}
                </li>
                {breakdown.scheduleMult !== 1 && breakdown.scheduleLabel ? (
                  <li>
                    {breakdown.scheduleLabel} × {breakdown.scheduleMult} ={" "}
                    {formatMoney(breakdown.labourPence)}
                  </li>
                ) : null}
                {Number(booking.discount_pence ?? 0) > 0 ? (
                  <li>
                    {booking.offer_kind ? humanize(booking.offer_kind) : promo?.code ? `Code ${promo.code}` : "Discount"} = −
                    {formatMoney(Number(booking.discount_pence))}
                  </li>
                ) : null}
                {breakdown.addOns
                  .filter((addOn) => addOn.amountPence > 0)
                  .map((addOn) => (
                    <li key={addOn.id}>
                      {addOn.label}
                      {addOn.ratePence
                        ? ` ${formatHourlyRate(addOn.ratePence)} × ${formatVisitHours(breakdown.billableHours)}`
                        : ""}{" "}
                      = {formatMoney(addOn.amountPence)}
                    </li>
                  ))}
                <li>
                  <b>Total {formatMoney(booking.amount_total)}</b>
                </li>
              </ul>
            </section>
          ) : null}
          {extraRows.length ? (
            <section className="rounded-xl border bg-card p-4 sm:p-5">
              <h2 className="font-semibold">Also captured</h2>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {extraRows.map(([label, value]) => (
                  <p
                    className={
                      value.includes("\n") || value.length > 48
                        ? "sm:col-span-2 whitespace-pre-wrap"
                        : undefined
                    }
                    key={label}
                  >
                    <b>{label}:</b> {value}
                  </p>
                ))}
              </div>
            </section>
          ) : null}
          <DetailSection
            description="Everything else the customer gave us, plus how the booking was made."
            rows={[
              { label: "Booked", value: ukDateTime(booking.created_at) },
              {
                label: "How it was made",
                value: draftRow?.prepared_by
                  ? `Prepared by ${preparer?.full_name ?? "an admin"} ${ukDateTime(draftRow.prepared_at)}, confirmed by the customer`
                  : draftRow
                    ? `Online booking (started ${ukDateTime(draftRow.created_at)})`
                    : "Online booking",
              },
              { label: "Service group", value: humanize(booking.service_category) },
              { label: "Postcode", value: address?.postcode ?? null },
              { label: "Property type", value: humanize(address?.property_type) },
              {
                label: "Rooms shown",
                value: hasSnapshot
                  ? `As booked${Array.isArray(booking.booked_other_room_types) && booking.booked_other_room_types.length ? ` · other rooms: ${booking.booked_other_room_types.join(", ")}` : ""}`
                  : "From the address today (booked before rooms were saved per booking)",
              },
              { label: "Address label", value: address?.label ?? null },
              {
                label: "Map",
                value:
                  address?.latitude != null && address?.longitude != null ? (
                    <a
                      className="text-[#524096] hover:underline"
                      href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open pin ({Number(address.latitude).toFixed(5)}, {Number(address.longitude).toFixed(5)})
                    </a>
                  ) : null,
              },
              { label: "Access notes (address)", value: address?.special_requirements ?? null, wide: true },
              {
                label: "Office spaces",
                value: Array.isArray(booking.commercial_spaces) && booking.commercial_spaces.length
                  ? (booking.commercial_spaces as OfficeSpaceDraft[])
                      .map((space) => `${space.quantity} × ${space.customLabel || humanize(space.spaceType)} (${humanize(space.size)})`)
                      .join("\n")
                  : null,
                wide: Boolean(booking.commercial_spaces?.length),
              },
              {
                label: "Preferred cleaner",
                value: preferredCleaner ? (
                  <Link className="text-[#524096] hover:underline" href={`/admin/cleaners/${preferredCleaner.id}`}>
                    {preferredCleaner.full_name ?? "Cleaner"}
                  </Link>
                ) : booking.prefer_same_cleaner ? "Same cleaner as before" : "No preference",
              },
              {
                label: "Promo code",
                value: promo?.code ?? null,
              },
              {
                label: "Offer",
                value: booking.offer_kind
                  ? humanize(booking.offer_kind)
                  : Number(booking.offer_free_hours ?? 0) > 0
                    ? `${booking.offer_free_hours}h free`
                    : null,
              },
              { label: "Discount", value: Number(booking.discount_pence ?? 0) > 0 ? poundsFromPence(Number(booking.discount_pence)) : null },
              {
                label: "Came from an ad callback",
                value: redeemedCallback ? (
                  <Link className="text-[#524096] hover:underline" href={`/admin/callback-leads/${redeemedCallback.id}`}>
                    Yes ({redeemedCallback.source})
                  </Link>
                ) : "No",
              },
              {
                label: "Recommended standard",
                value: booking.recommended_cleaning_standard ? standardLabel(booking.recommended_cleaning_standard) : null,
              },
              {
                label: "Part of a series",
                value: booking.parent_booking_id ? (
                  <Link className="text-[#524096] hover:underline" href={`/admin/booking/${booking.parent_booking_id}`}>
                    Repeat of booking {String(booking.parent_booking_id).slice(0, 8)}
                  </Link>
                ) : booking.is_recurring ? "First visit of a series" : "One-off",
              },
              {
                label: "Customer notes, exactly as written",
                value: notes || "None",
                wide: true,
              },
            ]}
            title="Booking record"
          />
        </div>
        <AdminExtraTime bookingId={params.id} rows={(extraTime ?? []) as ExtraTimeRow[]} />
        {editable || notesOnly ? (
          <BookingEditPanel
            addOnOptions={SERVICE_ADD_ONS.filter(
              (addOn) => !addOn.categories || addOn.categories.includes(editCategory),
            ).map((addOn) => ({ id: addOn.id, label: addOn.label }))}
            addresses={(customerAddresses ?? []).map((address) => ({
              id: address.id,
              label: [address.address_line_1, address.postcode].filter(Boolean).join(", "),
            }))}
            bookingId={params.id}
            customerId={booking.customer_id}
            hasCleaner={Boolean(booking.cleaner_id)}
            initial={{
              accessInstructions: booking.access_instructions ?? "",
              addOns: (addOns ?? []).map((row) => String(row.add_on_id)),
              addressId: booking.address_id,
              bathrooms: booking.booked_num_bathrooms ?? liveAddress?.num_bathrooms ?? 1,
              bedrooms: booking.booked_num_bedrooms ?? liveAddress?.num_bedrooms ?? 1,
              cleaningStandard: booking.cleaning_standard ?? "enhanced",
              durationHours: Number(booking.estimated_duration_hours ?? 2),
              otherRooms: booking.booked_num_other_rooms ?? liveAddress?.num_other_rooms ?? 0,
              scheduledDate: booking.scheduled_date,
              scheduledTime: String(booking.scheduled_start_time).slice(0, 5),
              specialInstructions: booking.special_instructions ?? "",
            }}
            isOffice={booking.service_type === "office" && Boolean(booking.commercial_spaces)}
            notesOnly={notesOnly}
          />
        ) : null}
        <BookingEditHistory
          bookingId={params.id}
          entries={historyEntries}
          hasCleaner={Boolean(booking.cleaner_id)}
          undoableId={undoableId}
        />
        <BookingActions
          allocatedCleaners={booking.allocated_cleaners ?? 1}
          bookingId={params.id}
          checkinOverrideRequested={Boolean(booking.checkin_override_requested)}
          checkoutOverrideRequested={Boolean(booking.checkout_override_requested)}
          cleaners={(cleaners ?? [])
            .filter((cleaner) =>
              sameAudience(booking.customer?.email, cleaner.email),
            )
            .map((cleaner) => ({
            id: cleaner.id,
            full_name: cleaner.full_name,
          }))}
          currentStatus={booking.status}
          teamMemberIds={(team ?? []).map((row) => row.cleaner_id)}
        />
      </div>
      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Stripe payment</h2>
        {payment ? (
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <p className="break-all">ID: {payment.id}</p>
            <p>Status: {payment.status}</p>
            <p>Capturable: {formatMoney(payment.amount_capturable)}</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <p>
              {booking.stripe_setup_intent_id || booking.stripe_payment_method_id
                ? "Card saved; the hold is placed about 24 hours before the visit."
                : "No card saved."}
            </p>
            {booking.stripe_setup_intent_id ? <p className="break-all">Setup: {booking.stripe_setup_intent_id}</p> : null}
            {booking.stripe_payment_method_id ? <p className="break-all">Card: {booking.stripe_payment_method_id}</p> : null}
          </div>
        )}
      </section>
      <MatchingDecisionLog
        cleanerName={booking.cleaner?.full_name ?? null}
        customerName={booking.customer?.full_name ?? null}
        decisions={(matching ?? [])
          .filter(
            (item) =>
              !item.cleaner_id || audienceCleanerIds.has(item.cleaner_id),
          )
          .map((item) => ({
          cleaner_id: item.cleaner_id,
          created_at: item.created_at,
          decision: item.decision,
          reasons:
            item.reasons && typeof item.reasons === "object"
              ? (item.reasons as Record<string, unknown>)
              : null,
        }))}
        matchingList={reserves.map((item) => ({
          name: decisionNames[item.cleaner_id] ?? "Cleaner",
          rank: item.rank,
          status: item.status,
        }))}
        names={decisionNames}
        offerExpiresAt={openOffer?.expires_at ?? null}
        offerOpen={Boolean(openOffer)}
        status={booking.status}
      />
      <PagedSimpleTable title="Status timeline" rows={(timeline ?? []).map((item) => [ukDateTime(item.created_at), `${item.from_status ?? "created"} → ${item.to_status}`, item.note ?? "-"])} />
      <PagedSimpleTable title="Messages thread" rows={(messages ?? []).map((item) => [ukDateTime(item.created_at), item.sender?.full_name ?? "Unknown", item.content])} />
    </div>
  );
}

async function loadCleanerNames(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[],
) {
  const names: Record<string, string> = {};
  for (let offset = 0; offset < ids.length; offset += 80) {
    const { data } = await admin
      .from("profiles")
      .select("id,full_name")
      .in("id", ids.slice(offset, offset + 80));
    for (const cleaner of data ?? []) {
      if (cleaner.full_name) names[cleaner.id] = cleaner.full_name;
    }
  }
  return names;
}

function formatVisitHours(hours: number) {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (m === 0) return `${h}h`;
  if (m === 30) return `${h}h30`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function propertyConditionLabel(value: string | null) {
  if (value === "maintained") return "Easy to get in and move around";
  if (value === "extra_attention") return "Please take extra care moving around";
  if (value === "neglected") return "The home needs a bigger first clean";
  return null;
}

function leftoverCustomerNotes(notes: string) {
  return notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !/^no pets\.?$/i.test(line) &&
        !/^pets present/i.test(line) &&
        !/^also available at:/i.test(line) &&
        !/^custom calendar dates:/i.test(line),
    )
    .join("\n\n");
}

function alternateTimesFromNotes(notes: string) {
  const match = notes.match(/Also available at:\s*(.+)/i);
  if (!match) return [];
  return match[1]
    .split(/,\s*/)
    .map((slot) => slot.trim())
    .filter(Boolean);
}

