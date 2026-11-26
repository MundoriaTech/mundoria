import { CreditCard } from "lucide-react";
import Link from "next/link";

import { ReceiptsList } from "@/components/customer/receipts-list";
import { PriceDisplay } from "@/components/shared/price-display";
import { Button } from "@/components/ui/button";
import { bookingServiceName } from "@/lib/customer/services";
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
    <div className="flex flex-col gap-5">
      <div className="rounded-[18px] bg-white p-5">
        <p className="m-0 text-[14px] leading-6 text-[#5F5F66]">
          Save a card for visits that still need one, then find receipts after
          payment is captured the day after a clean.{" "}
          <Link
            className="font-semibold text-[#524096] underline-offset-2 hover:underline"
            href="/help/article/why-pay-in-advance"
          >
            How payment works
          </Link>
          .
        </p>
      </div>

      {due.length ? (
        <section className="rounded-[18px] bg-white p-5">
          <h2 className="m-0 text-[17px] font-semibold text-[#1E1848]">
            Payment due
          </h2>
          <div className="mt-4 space-y-3">
            {due.map((booking) => (
              <article
                className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={booking.id}
              >
                <div className="min-w-0">
                  <p className="font-medium text-amber-950">
                    {bookingServiceName(booking)}
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

      <section className="rounded-[18px] bg-white p-5">
        <h2 className="m-0 text-[17px] font-semibold text-[#1E1848]">
          Your vouchers
        </h2>
        {usableVouchers.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {usableVouchers.map((voucher) => (
              <div
                className="rounded-xl border border-[#E7E7EF] bg-[#F3F4F6] p-4"
                key={voucher.code}
              >
                <p className="font-mono text-lg font-bold tracking-wider text-[#1E1848]">
                  {voucher.code}
                </p>
                <p className="mt-1 text-sm text-[#5F5F66]">
                  £{(Number(voucher.discount_value) / 100).toFixed(2)} off ·{" "}
                  {voucher.kind === "referral_reward"
                    ? "Referral reward"
                    : voucher.kind === "referral_invite"
                      ? "Welcome gift"
                      : "Promo"}
                </p>
                {voucher.valid_until ? (
                  <p className="mt-2 text-xs text-[#6f6a82]">
                    Valid until{" "}
                    {new Date(voucher.valid_until).toLocaleDateString("en-GB")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#5F5F66]">
            No active vouchers yet. Share your referral code to earn £10 after a
            friend&apos;s first completed clean.
          </p>
        )}
      </section>

      <section className="rounded-[18px] bg-white p-5">
        <h2 className="m-0 text-[17px] font-semibold text-[#1E1848]">
          Past receipts
        </h2>
        <div className="mt-4">
          <ReceiptsList receipts={receipts} />
        </div>
      </section>
    </div>
  );
}
