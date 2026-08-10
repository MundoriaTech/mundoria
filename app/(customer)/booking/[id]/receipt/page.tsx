import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintReceiptButton } from "@/components/customer/print-receipt-button";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import {
  formatMoney,
  formatServiceName,
  standardLabel,
} from "@/lib/customer/services";
import { buildReceiptLines } from "@/lib/customer/receipt";
import { createServerClient } from "@/lib/supabase/server";
import type { Booking, BookingAddOn } from "@/types/customer";

export const metadata = { title: "Receipt" };

export default async function BookingReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: addOns }, { data: profile }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, address:addresses(*)")
      .eq("id", params.id)
      .eq("customer_id", user!.id)
      .single(),
    supabase
      .from("booking_add_ons")
      .select("*")
      .eq("booking_id", params.id)
      .order("created_at"),
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user!.id)
      .single(),
  ]);

  if (!data) notFound();
  const booking = data as Booking;
  if (
    !["completed", "awaiting_customer_confirmation"].includes(booking.status) &&
    booking.payment_status !== "released"
  ) {
    notFound();
  }

  booking.add_ons = (addOns ?? []) as BookingAddOn[];
  const lines = buildReceiptLines({
    ...booking,
    customer: profile
      ? { email: profile.email, full_name: profile.full_name }
      : null,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-sm font-medium text-primary">Receipt</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Booking invoice
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/booking/${booking.id}`}>Back to booking</Link>
          </Button>
          <PrintReceiptButton />
        </div>
      </div>

      <ReceiptDocument
        addOns={(addOns ?? []) as BookingAddOn[]}
        booking={booking}
        customerEmail={profile?.email ?? ""}
        customerName={profile?.full_name ?? "Customer"}
        lines={lines}
      />
    </div>
  );
}

function ReceiptDocument({
  addOns,
  booking,
  customerEmail,
  customerName,
  lines,
}: {
  addOns: BookingAddOn[];
  booking: Booking;
  customerEmail: string;
  customerName: string;
  lines: ReturnType<typeof buildReceiptLines>;
}) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b bg-[#221f50] px-6 py-6 text-white sm:px-8">
        <div className="flex items-center gap-3">
          <BrandMark className="h-12 w-9" />
          <div>
            <p className="text-xl font-black lowercase tracking-[-0.06em]">
              cleanscape
            </p>
            <p className="mt-1 text-sm text-white/70">Service receipt</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-mono text-white/80">#{booking.id.slice(0, 8)}</p>
          <p className="mt-1 capitalize text-white/70">
            {booking.payment_status === "released" ? "Paid" : booking.payment_status}
          </p>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Billed to
          </p>
          <p className="mt-2 font-semibold">{customerName}</p>
          <p className="text-sm text-muted-foreground">{customerEmail}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Service details
          </p>
          <p className="mt-2 font-semibold">
            {formatServiceName(booking.service_type)}
          </p>
          <p className="text-sm text-muted-foreground">
            {standardLabel(booking.cleaning_standard ?? "enhanced")} ·{" "}
            {booking.scheduled_date} at {booking.scheduled_start_time.slice(0, 5)}
          </p>
        </div>
      </div>

      <div className="border-t px-6 py-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Address
        </p>
        <p className="mt-2 text-sm">
          {booking.address
            ? `${booking.address.address_line_1}, ${booking.address.city}, ${booking.address.postcode}`
            : "Unavailable"}
        </p>
      </div>

      <div className="border-t px-6 py-5 sm:px-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-3 font-medium">Item</th>
              <th className="pb-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="py-3">
                {formatServiceName(booking.service_type)} (
                {standardLabel(booking.cleaning_standard ?? "enhanced")})
              </td>
              <td className="py-3 text-right">{formatMoney(lines.serviceAmount)}</td>
            </tr>
            {addOns.map((addOn) => (
              <tr key={addOn.id}>
                <td className="py-3">Add-on · {addOn.label}</td>
                <td className="py-3 text-right">{formatMoney(addOn.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 border-t bg-background px-6 py-5 text-sm sm:grid-cols-2 sm:px-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            To your cleaner
          </p>
          <p className="mt-2 text-lg font-bold">
            {formatMoney(booking.amount_cleaner)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            CleanScape service fee
          </p>
          <p className="mt-2 text-lg font-bold">
            {formatMoney(lines.platformAmount)}
          </p>
        </div>
      </div>

      <footer className="flex items-center justify-between border-t px-6 py-5 sm:px-8">
        <p className="text-sm text-muted-foreground">
          Total charged
        </p>
        <p className="text-2xl font-bold tracking-tight">
          {formatMoney(lines.total)}
        </p>
      </footer>
    </article>
  );
}
