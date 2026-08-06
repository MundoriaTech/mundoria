import { notFound } from "next/navigation";

import { BookingActions } from "@/components/admin/booking-actions";
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
  ] = await Promise.all([
    admin.from("bookings").select("*,address:addresses(*),customer:profiles!bookings_customer_id_fkey(full_name,email,phone),cleaner:profiles!bookings_cleaner_id_fkey(full_name,email,phone)").eq("id", params.id).single(),
    admin.from("matching_decisions").select("*").eq("booking_id", params.id).order("created_at"),
    admin.from("booking_status_history").select("*").eq("booking_id", params.id).order("created_at"),
    admin.from("messages").select("*,sender:profiles!messages_sender_id_fkey(full_name)").eq("booking_id", params.id).order("created_at"),
    admin.from("profiles").select("id,full_name,cleaner_profiles!inner(status)").eq("role", "cleaner").in("cleaner_profiles.status", ["certified", "active"]),
    admin.from("booking_add_ons").select("*").eq("booking_id", params.id).order("created_at"),
  ]);
  if (!booking) notFound();
  let payment: { id: string; status: string; amount: number; amount_capturable: number } | null = null;
  if (booking.stripe_payment_intent_id && process.env.STRIPE_SECRET_KEY) {
    const intent = await getStripe().paymentIntents.retrieve(booking.stripe_payment_intent_id);
    payment = { id: intent.id, status: intent.status, amount: intent.amount, amount_capturable: intent.amount_capturable };
  }
  return (
    <div className="space-y-6">
      <div><p className="font-mono text-sm text-primary">{booking.id}</p><h1 className="text-3xl font-semibold">{formatServiceName(booking.service_type)}</h1></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_.6fr]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Booking information</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p><b>Customer:</b> {booking.customer?.full_name}</p>
            <p><b>Cleaner:</b> {booking.cleaner?.full_name ?? "Unassigned"}</p>
            <p><b>Category:</b> {booking.service_category?.replaceAll("_", " ") ?? "—"}</p>
            <p><b>Standard:</b> {standardLabel(booking.cleaning_standard ?? "enhanced")}</p>
            <p><b>Schedule:</b> {booking.scheduled_date} {booking.scheduled_start_time}</p>
            <p><b>Status:</b> {booking.status}</p>
            <p><b>Address:</b> {booking.address?.address_line_1}, {booking.address?.city}</p>
            <p><b>Amount:</b> {formatMoney(booking.amount_total)}</p>
            <p><b>Property condition:</b> {booking.property_condition?.replaceAll("_", " ") ?? "—"}</p>
            <p><b>Recently moved:</b> {booking.recently_moved == null ? "—" : booking.recently_moved ? "Yes" : "No"}</p>
            <p className="sm:col-span-2"><b>Special attention:</b> {(booking.special_attention_areas ?? []).join(", ") || "None"}</p>
            <p className="sm:col-span-2"><b>Add-ons:</b> {(addOns ?? []).map((addOn) => addOn.label).join(", ") || "None"}</p>
            <p className="sm:col-span-2"><b>Recommendation:</b> {booking.recommendation_outcome?.replaceAll("_", " ") ?? "not shown"}{booking.recommended_service_type ? ` → ${formatServiceName(booking.recommended_service_type)}` : ""}</p>
          </div>
        </section>
        <BookingActions bookingId={params.id} cleaners={(cleaners ?? []).map((cleaner) => ({ id: cleaner.id, full_name: cleaner.full_name }))} currentStatus={booking.status} />
      </div>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Stripe payment</h2>
        {payment ? <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p>ID: {payment.id}</p><p>Status: {payment.status}</p><p>Capturable: {formatMoney(payment.amount_capturable)}</p></div> : <p className="mt-3 text-sm text-muted-foreground">No payment intent.</p>}
      </section>
      <SimpleTable title="Matching decision log" rows={(matching ?? []).map((item) => [item.created_at, item.decision, JSON.stringify(item.reasons)])} />
      <SimpleTable title="Status timeline" rows={(timeline ?? []).map((item) => [item.created_at, `${item.from_status ?? "created"} → ${item.to_status}`, item.note ?? "—"])} />
      <SimpleTable title="Messages thread" rows={(messages ?? []).map((item) => [item.created_at, item.sender?.full_name ?? "Unknown", item.content])} />
    </div>
  );
}

function SimpleTable({ rows, title }: { rows: string[][]; title: string }) {
  return <section className="overflow-x-auto rounded-xl border bg-card p-5"><h2 className="mb-3 font-semibold">{title}</h2><table className="w-full min-w-[600px] text-sm"><tbody>{rows.map((row, i) => <tr className="border-b" key={i}>{row.map((cell, j) => <td className="p-2" key={j}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length ? <p className="text-sm text-muted-foreground">No records.</p> : null}</section>;
}
