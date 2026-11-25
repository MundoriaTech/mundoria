import { sameAudience } from "@/lib/matching/seed-accounts";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingActions } from "@/components/admin/booking-actions";
import { MatchingDecisionLog } from "@/components/admin/matching-decision-log";
import { BookingSummaryCard } from "@/components/customer/booking-basket";
import {
  frequencyLabelForBooking,
  petsFromNotes,
} from "@/lib/customer/booking-flow";
import { loadServicePricing } from "@/lib/customer/pricing-config";
import { hourlyRatePence } from "@/lib/customer/rate-card";
import { loadMatchingList } from "@/lib/matching/emergency-list";
import {
  estimatePriceBreakdown,
  formatHourlyRate,
  formatMoney,
  formatServiceName,
  standardLabel,
} from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import type { Address } from "@/types/customer";

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
  ]);
  if (!booking) notFound();
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
  const address = (booking.address ?? null) as Address | null;
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
      ? ["Recently moved", booking.recently_moved ? "Yes" : "No"]
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
  const pricing = await loadServicePricing();
  const sessionHours = Math.max(0, (durationHours ?? 0) - offerHours);
  const priceBooking = (legacyFreeExtraTime: boolean) =>
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
            pricing,
            rooms: {
              bathrooms: address.num_bathrooms,
              bedrooms: address.num_bedrooms,
              otherRooms: address.num_other_rooms,
            },
          },
        )
      : null;
  // Bookings priced before extra time was billed keep their agreed price;
  // explain them with the rule that actually produced the charged total.
  const currentBreakdown = priceBooking(false);
  const legacyBreakdown = priceBooking(true);
  const chargedTotal = Number(booking.amount_total ?? 0);
  const pricedOnLegacyRule = Boolean(
    currentBreakdown &&
      currentBreakdown.totalPence !== chargedTotal &&
      legacyBreakdown?.totalPence === chargedTotal,
  );
  const breakdown = pricedOnLegacyRule ? legacyBreakdown : currentBreakdown;
  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div>
        <p className="break-all font-mono text-xs text-primary sm:text-sm">
          {booking.id}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {formatServiceName(booking.service_type)}
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
                <b>Cleaner:</b> {booking.cleaner?.full_name ?? "Unassigned"}
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
            serviceLabel={formatServiceName(booking.service_type)}
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
                {breakdown.addOns.some((addOn) => addOn.amountPence === 0) ? (
                  <li>
                    {breakdown.addOns
                      .filter((addOn) => addOn.amountPence === 0)
                      .map((addOn) => addOn.label)
                      .join(", ")}{" "}
                    {pricedOnLegacyRule
                      ? `included in the ${formatVisitHours(breakdown.visitHours)} visit, time not charged (priced before extra time was billed)`
                      : `have no separate price; their time is in the ${formatVisitHours(breakdown.billableHours)} charged above`}
                  </li>
                ) : null}
                <li>
                  <b>Total {formatMoney(booking.amount_total)}</b>
                  {breakdown.totalPence !== Number(booking.amount_total ?? 0)
                    ? ` (current rates would be ${formatMoney(breakdown.totalPence)})`
                    : null}
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
        </div>
        <BookingActions
          allocatedCleaners={booking.allocated_cleaners ?? 1}
          bookingId={params.id}
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
          <p className="mt-3 text-sm text-muted-foreground">No payment intent.</p>
        )}
      </section>
      <MatchingDecisionLog
        cleanerName={booking.cleaner?.full_name ?? null}
        customerName={booking.customer?.full_name ?? null}
        decisions={(matching ?? []).map((item) => ({
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
      <SimpleTable title="Status timeline" rows={(timeline ?? []).map((item) => [item.created_at, `${item.from_status ?? "created"} → ${item.to_status}`, item.note ?? "-"])} />
      <SimpleTable title="Messages thread" rows={(messages ?? []).map((item) => [item.created_at, item.sender?.full_name ?? "Unknown", item.content])} />
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

function SimpleTable({ rows, title }: { rows: string[][]; title: string }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[480px] text-sm">
          <tbody>
            {rows.map((row, i) => (
              <tr className="border-b" key={i}>
                {row.map((cell, j) => (
                  <td className="break-words p-2 first:pl-4 sm:first:pl-2" key={j}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? (
        <p className="text-sm text-muted-foreground">No records.</p>
      ) : null}
    </section>
  );
}
