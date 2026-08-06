import { FileText } from "lucide-react";
import Link from "next/link";

import { PriceDisplay } from "@/components/shared/price-display";
import { Button } from "@/components/ui/button";
import { formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { Booking } from "@/types/customer";

export const metadata = { title: "Payments & receipts" };

export default async function CustomerPaymentsPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: bookings }, { data: vouchers }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, address:addresses(city, postcode)")
      .eq("customer_id", user!.id)
      .eq("payment_status", "released")
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("promo_codes")
      .select("code, discount_value, uses_count, max_uses, kind, valid_until, is_active")
      .eq("owner_user_id", user!.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const receipts = (bookings ?? []) as Booking[];
  const usableVouchers = (vouchers ?? []).filter(
    (voucher) => voucher.max_uses === null || voucher.uses_count < voucher.max_uses,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Payments & receipts</h1>
        <p className="mt-2 text-muted-foreground">
          Download invoices for completed cleans and see any referral vouchers
          ready to use.
        </p>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Your vouchers</h2>
        {usableVouchers.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {usableVouchers.map((voucher) => (
              <div
                className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                key={voucher.code}
              >
                <p className="font-mono text-lg font-bold tracking-wider text-foreground">
                  {voucher.code}
                </p>
                <p className="mt-1 text-sm text-amber-900">
                  £{(Number(voucher.discount_value) / 100).toFixed(2)} off ·{" "}
                  {voucher.kind === "referral_reward"
                    ? "Referral reward"
                    : voucher.kind === "referral_invite"
                      ? "Welcome gift"
                      : "Promo"}
                </p>
                {voucher.valid_until ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Valid until{" "}
                    {new Date(voucher.valid_until).toLocaleDateString("en-GB")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No active vouchers yet. Share your referral code to earn £10 after a
            friend’s first completed clean.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Past receipts</h2>
        {receipts.length ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Date</th>
                  <th>Service</th>
                  <th>Location</th>
                  <th>Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {receipts.map((booking) => (
                  <tr className="border-t" key={booking.id}>
                    <td className="p-3">{booking.scheduled_date}</td>
                    <td>{formatServiceName(booking.service_type)}</td>
                    <td>
                      {booking.address
                        ? `${booking.address.city}, ${booking.address.postcode}`
                        : "—"}
                    </td>
                    <td>
                      <PriceDisplay amount={booking.amount_total} />
                    </td>
                    <td className="p-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/booking/${booking.id}/receipt`}>
                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                          Receipt
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            Receipts appear here after a cleaning is completed and payment is
            captured.
          </p>
        )}
      </section>
    </div>
  );
}
