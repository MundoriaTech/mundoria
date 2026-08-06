import { ArrowRight, CalendarCheck, Gift, Plus, Sparkles } from "lucide-react";
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
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#221f50] px-6 py-8 text-white shadow-2xl shadow-[#221f50]/15 sm:px-10 sm:py-10">
        <div className="absolute -right-20 top-0 -z-10 h-56 w-56 rounded-full bg-[#7669d1]/45 blur-3xl" />
        <div className="absolute -bottom-20 left-10 -z-10 h-44 w-44 rounded-full bg-[#ffc79f]/30 blur-3xl" />
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/80">
          <Sparkles className="h-4 w-4 text-[#ffc79f]" />
          Welcome home
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Hello, {customer.full_name.split(" ")[0]}.
        </h1>
        <p className="mt-3 max-w-xl leading-7 text-white/75">
          A beautifully clean space is only a few taps away — with booking,
          payment holds, messages, and checklists all in one calm place.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="bg-[#ffc79f] font-bold text-[#221f50] hover:bg-[#ffd4b8]"
          >
            <Link href="/booking/new">
              <Plus className="mr-2 h-4 w-4" />
              Book a cleaner
            </Link>
          </Button>
          <Button
            asChild
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            variant="outline"
          >
            <Link href="/bookings">
              <CalendarCheck className="mr-2 h-4 w-4" />
              View bookings
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Insight label="Upcoming" value={String(upcoming.length)} />
        <Insight label="Recent history" value={String(recent.length)} />
        <Insight
          label="Referral code"
          value={customer.referral_code ?? "Ready"}
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

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-muted p-3 text-primary shadow-sm">
            <Gift className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">
              Give £10, get £10
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Share your referral code{" "}
              <span className="font-bold text-primary">
                {customer.referral_code}
              </span>{" "}
              or invite link. Friends get £10 off their first clean; you get £10
              after they complete it. Enter the code at signup or checkout.
            </p>
            <p className="mt-3 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-primary">
              {`${process.env.NEXT_PUBLIC_APP_URL ?? "https://cleanscapeuk.com"}/signup?ref=${customer.referral_code}`}
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

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({ href, title }: { href: string; title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
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
