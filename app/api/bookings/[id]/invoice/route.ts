import { NextResponse } from "next/server";

import { paymentStatusLabel } from "@/lib/customer/payment-status";
import { bookingServiceName } from "@/lib/customer/services";
import { buildBookingInvoicePdf, type InvoiceLine } from "@/lib/invoices/booking-invoice-pdf";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

export const dynamic = "force-dynamic";

function hoursLabel(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return "";
  const rounded = Number(hours.toFixed(2));
  return ` (${rounded} hour${rounded === 1 ? "" : "s"})`;
}

/**
 * The customer's PDF invoice for a booking, available once the clean is done
 * or paid for (same rule as the receipt page). The invoice number is issued
 * on the first download and kept for every later one.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in to download your invoice." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,customer_id,status,payment_status,service_type,is_recurring,scheduled_date,scheduled_start_time,estimated_duration_hours,amount_total,discount_pence,address:addresses(address_line_1,address_line_2,city,postcode),customer:profiles!bookings_customer_id_fkey(full_name,email)",
    )
    .eq("id", params.id)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (
    !["completed", "awaiting_customer_confirmation"].includes(booking.status) &&
    booking.payment_status !== "released"
  ) {
    return NextResponse.json(
      { error: "Your invoice is available once the clean is finished." },
      { status: 409 },
    );
  }

  const [{ data: addOns }, { data: extraTime }] = await Promise.all([
    admin
      .from("booking_add_ons")
      .select("label,amount")
      .eq("booking_id", booking.id)
      .order("created_at"),
    admin
      .from("booking_time_extensions")
      .select("minutes,amount_pence")
      .eq("booking_id", booking.id)
      .eq("status", "charged")
      .order("created_at"),
  ]);

  await admin
    .from("booking_invoices")
    .upsert({ booking_id: booking.id }, { ignoreDuplicates: true, onConflict: "booking_id" });
  const { data: invoice } = await admin
    .from("booking_invoices")
    .select("invoice_number,issued_at")
    .eq("booking_id", booking.id)
    .maybeSingle();
  if (!invoice) {
    return NextResponse.json({ error: "Couldn't create your invoice. Try again." }, { status: 500 });
  }

  const total = Number(booking.amount_total ?? 0);
  const discount = Math.max(0, Number(booking.discount_pence ?? 0));
  const addOnRows = (addOns ?? []).map((row) => ({
    amountPence: Number(row.amount ?? 0),
    label: `Add-on: ${row.label ?? "Extra"}`,
  }));
  const addOnTotal = addOnRows.reduce((sum, row) => sum + row.amountPence, 0);
  const serviceName = bookingServiceName(booking);
  const extraRows = (extraTime ?? []).map((row) => ({
    amountPence: Number(row.amount_pence ?? 0),
    label: `Extra time on the day (${Number(row.minutes)} minutes)`,
  }));

  const lines: InvoiceLine[] = [
    {
      amountPence: Math.max(0, total + discount - addOnTotal),
      label: `${serviceName}${hoursLabel(Number(booking.estimated_duration_hours ?? 0))}`,
    },
    ...addOnRows,
    ...(discount > 0 ? [{ amountPence: -discount, label: "Discount" }] : []),
    ...extraRows,
  ];

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const address = Array.isArray(booking.address) ? booking.address[0] : booking.address;
  const invoiceNumber = `MUN-${String(invoice.invoice_number).padStart(6, "0")}`;

  const pdf = await buildBookingInvoicePdf({
    bookingRef: booking.id.slice(0, 8).toUpperCase(),
    customer: {
      address: address
        ? [address.address_line_1, address.address_line_2, address.city, address.postcode]
            .filter(Boolean)
            .join(", ")
        : null,
      email: customer?.email ?? null,
      name: customer?.full_name ?? "Customer",
    },
    invoiceNumber,
    issuedAt: new Date(invoice.issued_at),
    lines,
    paymentStatus: paymentStatusLabel(booking.payment_status),
    service: {
      date: booking.scheduled_date,
      name: serviceName,
      time: String(booking.scheduled_start_time).slice(0, 5),
    },
    totalPence: lines.reduce((sum, line) => sum + line.amountPence, 0),
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="Mundoria-invoice-${invoiceNumber}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
