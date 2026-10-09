import { notFound } from "next/navigation";

import { BookingActions } from "@/components/admin/booking-actions";
import { MatchingDecisionLog } from "@/components/admin/matching-decision-log";
import { formatMoney, formatServiceName, standardLabel } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

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
    { data: reserves },
  ] = await Promise.all([
    admin.from("bookings").select("*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name,email,phone),cleaner:profiles!bookings_cleaner_id_fkey(full_name,email,phone)").eq("id", params.id).single(),
    admin.from("matching_decisions").select("*").eq("booking_id", params.id).order("created_at"),
    admin.from("booking_status_history").select("*").eq("booking_id", params.id).order("created_at"),
    admin.from("messages").select("*,sender:profiles!messages_sender_id_fkey(full_name)").eq("booking_id", params.id).order("created_at"),
    admin.from("profiles").select("id,full_name,cleaner_profiles!cleaner_profiles_id_fkey!inner(status)").eq("role", "cleaner").in("cleaner_profiles.status", ["certified", "active"]),
    admin.from("booking_add_ons").select("*").eq("booking_id", params.id).order("created_at"),
    admin.from("booking_team_members").select("cleaner_id").eq("booking_id", params.id),
    admin
      .from("cleaner_job_responses")
      .select("cleaner_id,expires_at,responded_at,response")
      .eq("booking_id", params.id)
      .order("offered_at", { ascending: false })
      .limit(5),
    admin
      .from("booking_emergency_list")
      .select("cleaner_id,rank,status")
      .eq("booking_id", params.id)
      .in("status", ["reserve", "notified", "promoted"])
      .order("rank")
      .limit(10),
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
        ...(reserves ?? []).map((item) => item.cleaner_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  ).slice(0, 30);
  const { data: namedCleaners } = namedCleanerIds.length
    ? await admin.from("profiles").select("id,full_name").in("id", namedCleanerIds)
    : { data: [] };
  const decisionNames = Object.fromEntries(
    (namedCleaners ?? []).map((cleaner) => [cleaner.id, cleaner.full_name]),
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
        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Booking information</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p><b>Customer:</b> {booking.customer?.full_name}</p>
            <p><b>Cleaner:</b> {booking.cleaner?.full_name ?? "Unassigned"}</p>
            <p><b>Category:</b> {booking.service_category?.replaceAll("_", " ") ?? "—"}</p>
            <p><b>Standard:</b> {standardLabel(booking.cleaning_standard ?? "enhanced")}</p>
            <p><b>Schedule:</b> {booking.scheduled_date} {booking.scheduled_start_time}</p>
            <p><b>Status:</b> {booking.status}</p>
            <p className="sm:col-span-2"><b>Address:</b> {booking.address?.address_line_1}, {booking.address?.city}</p>
            <p><b>Amount:</b> {formatMoney(booking.amount_total)}</p>
            <p><b>Payment:</b> {booking.payment_status}</p>
            <p><b>Allocated cleaners:</b> {booking.allocated_cleaners ?? 1}</p>
            <p><b>Cleaner hours:</b> {booking.cleaner_hours ?? "—"}</p>
            <p><b>Property condition:</b> {booking.property_condition?.replaceAll("_", " ") ?? "—"}</p>
            <p><b>Recently moved:</b> {booking.recently_moved == null ? "—" : booking.recently_moved ? "Yes" : "No"}</p>
            <p className="sm:col-span-2"><b>Special attention:</b> {(booking.special_attention_areas ?? []).join(", ") || "None"}</p>
            <p className="sm:col-span-2"><b>Add-ons:</b> {(addOns ?? []).map((addOn) => addOn.label).join(", ") || "None"}</p>
            <p className="sm:col-span-2"><b>Recommendation:</b> {booking.recommendation_outcome?.replaceAll("_", " ") ?? "not shown"}{booking.recommended_service_type ? ` → ${formatServiceName(booking.recommended_service_type)}` : ""}</p>
          </div>
        </section>
        <BookingActions
          allocatedCleaners={booking.allocated_cleaners ?? 1}
          bookingId={params.id}
          cleaners={(cleaners ?? []).map((cleaner) => ({
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
        matchingList={(reserves ?? []).map((item) => ({
          name: decisionNames[item.cleaner_id] ?? "Cleaner",
          rank: item.rank,
          status: item.status,
        }))}
        names={decisionNames}
        offerExpiresAt={openOffer?.expires_at ?? null}
        offerOpen={Boolean(openOffer)}
        status={booking.status}
      />
      <SimpleTable title="Status timeline" rows={(timeline ?? []).map((item) => [item.created_at, `${item.from_status ?? "created"} → ${item.to_status}`, item.note ?? "—"])} />
      <SimpleTable title="Messages thread" rows={(messages ?? []).map((item) => [item.created_at, item.sender?.full_name ?? "Unknown", item.content])} />
    </div>
  );
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
