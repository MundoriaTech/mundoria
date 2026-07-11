import { ArrowRight, Gift, Plus } from "lucide-react";
import Link from "next/link";

import { BookingCard } from "@/components/customer/booking-card";
import { Button } from "@/components/ui/button";
import { getCustomerBookings } from "@/lib/customer/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";

export const metadata = { title: "Customer dashboard" };

export default async function CustomerDashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, bookings] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    getCustomerBookings(supabase, user!.id),
  ]);
  const now = new Date();
  const upcoming = bookings
    .filter(
      (booking) =>
        !["completed", "cancelled"].includes(booking.status) &&
        new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`) >=
          now,
    )
    .slice(0, 2);
  const recent = bookings
    .filter((booking) =>
      ["completed", "cancelled"].includes(booking.status),
    )
    .reverse()
    .slice(0, 3);
  const customer = profile as Profile;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-emerald-950 px-6 py-8 text-white sm:px-10 sm:py-10">
        <p className="text-sm font-medium text-emerald-300">Welcome home</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          Hello, {customer.full_name.split(" ")[0]}.
        </h1>
        <p className="mt-3 max-w-xl text-emerald-100">
          A beautifully clean space is only a few taps away.
        </p>
        <Button asChild className="mt-6 bg-white text-emerald-950 hover:bg-emerald-50">
          <Link href="/booking/new">
            <Plus className="mr-2 h-4 w-4" />
            Book a Cleaner
          </Link>
        </Button>
      </section>

      <SectionHeading href="/bookings" title="Upcoming bookings" />
      {upcoming.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {upcoming.map((booking) => (
            <BookingCard booking={booking} key={booking.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          action="/booking/new"
          body="When you book your next clean, it’ll appear here."
          title="Nothing scheduled yet"
        />
      )}

      <section className="rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 p-6">
        <div className="flex items-start gap-4">
          <span className="rounded-full bg-white p-3 text-amber-700 shadow-sm">
            <Gift className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-semibold text-amber-950">
              Give £10, get £10
            </h2>
            <p className="mt-1 text-sm text-amber-900/80">
              Share your referral code{" "}
              <span className="font-bold">{customer.referral_code}</span> with a
              friend. You’ll both receive a voucher after their first clean.
            </p>
          </div>
        </div>
      </section>

      <SectionHeading href="/bookings?tab=past" title="Recent history" />
      {recent.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {recent.map((booking) => (
            <BookingCard booking={booking} compact key={booking.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          body="Your completed and cancelled bookings will live here."
          title="No booking history"
        />
      )}
    </div>
  );
}

function SectionHeading({ href, title }: { href: string; title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Link
        className="flex items-center gap-1 text-sm font-medium text-primary"
        href={href}
      >
        See all <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function EmptyState({
  action,
  body,
  title,
}: {
  action?: string;
  body: string;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-background p-8 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {action ? (
        <Button asChild className="mt-4" size="sm" variant="outline">
          <Link href={action}>Start a booking</Link>
        </Button>
      ) : null}
    </div>
  );
}
