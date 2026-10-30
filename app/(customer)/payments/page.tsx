import { CreditCard } from "lucide-react";
import Link from "next/link";

import { ReceiptsList } from "@/components/customer/receipts-list";
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

  const [{ data: dueBookings }, { data: bookings }, { data: vouchers }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*, address:addresses(city, postcode)")
        .eq("customer_id", user!.id)
        .eq("payment_status", "unpaid")
        .is("stripe_payment_method_id", null)
        .neq("status", "cancelled")
        .order("scheduled_date", { ascending: true }),
      supabase
        .from("bookings")
        .select("*, address:addresses(city, postcode)")
        .eq("customer_id", user!.id)
        .eq("payment_status", "released")
        .order("scheduled_date", { ascending: false }),
      supabase
        .from("promo_codes")
        .select(
          "code, discount_value, uses_count, max_uses, kind, valid_until, is_active",
        )
        .eq("owner_user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    ]);

  const due = (dueBookings ?? []) as Booking[];
  const receipts = (bookings ?? []) as Booking[];
  const usableVouchers = (vouchers ?? []).filter(
    (voucher) =>
      voucher.max_uses === null || voucher.uses_count < voucher.max_uses,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Payments & receipts
        </h1>
        <p className="mt-2 text-muted-foreground">
          Save a card for visits that still need one, then find receipts after
          payment is captured the day after a clean.{" "}
          <Link
            className="font-medium text-primary underline-offset-2 hover:underline"
            href="/help/article/why-pay-in-advance"
          >
            how payment works
          </Link>
          .
        </p>
      </div>

      {due.length ? (
        <section>
          <h2 className="font-semibold">Payment due</h2>
          <div className="mt-4 space-y-3">
            {due.map((booking) => (
              <article
                className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={booking.id}
              >
                <div className="min-w-0">
                  <p className="font-medium text-amber-950">
                    {formatServiceName(booking.service_type)}
                  </p>
                  <p className="mt-1 text-sm text-amber-900/80">
                    {booking.scheduled_date}
                    {booking.address
                      ? ` · ${booking.address.city}, ${booking.address.postcode}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <PriceDisplay amount={booking.amount_total} />
                  <Button asChild size="sm">
                    <Link href={`/booking/${booking.id}`}>
                      <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                      Authorise
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Your vouchers</h2>
        {usableVouchers.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {usableVouchers.map((voucher) => (
              <div
                className="rounded-xl border border-border bg-muted p-4"
                key={voucher.code}
              >
                <p className="font-mono text-lg font-bold tracking-wider text-foreground">
                  {voucher.code}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
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
        <ReceiptsList receipts={receipts} />
      </section>
    </div>
  );
}
