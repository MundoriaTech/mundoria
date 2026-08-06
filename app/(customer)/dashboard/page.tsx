import { ArrowRight, Gift } from "lucide-react";
import Link from "next/link";

import { BookingCard } from "@/components/customer/booking-card";
import { DashboardGreeting } from "@/components/customer/dashboard-greeting";
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
  const firstName = customer.full_name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="space-y-8">
      <DashboardGreeting firstName={firstName} />

      <section className="grid gap-4 sm:grid-cols-3">
        <Insight label="Upcoming" value={String(upcoming.length)} />
        <Insight label="Recent history" value={String(recent.length)} />
        <Insight
          label="Referral code"
          value={customer.referral_code ?? "—"}
        />
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

      {customer.referral_code ? (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">
                Give £10, get £10
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Share your code{" "}
                <span className="font-semibold text-foreground">
                  {customer.referral_code}
                </span>
                . Friends get £10 off their first clean; you get £10 after they
                complete it.
              </p>
            </div>
          </div>
        </section>
      ) : null}

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

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({ href, title }: { href: string; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <Link
        className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-medium text-primary"
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
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
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
