import { CalendarCheck as CalendarCheckLucide, ChevronRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  DashboardEmptyCard,
  DashboardSection,
  DashboardWelcomeBanner,
} from "@/components/shared/dashboard-panels";
import { Button } from "@/components/ui/button";
import {
  isCleanerVisibleToCustomer,
  isWaitingForCleanerAcceptance,
} from "@/lib/customer/booking-visibility";
import { getCustomerBookings } from "@/lib/customer/server";
import { FEMALE_AVATAR_SRC } from "@/lib/avatars/default-pack";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";
import type { Booking } from "@/types/customer";

const DASHBOARD_BOOK_HREF = "/booking/new?fresh=1&returnTo=/dashboard";
const MAX_ALSO_SCHEDULED = 5;

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
    .sort(
      (a, b) =>
        new Date(`${a.scheduled_date}T${a.scheduled_start_time}`).getTime() -
        new Date(`${b.scheduled_date}T${b.scheduled_start_time}`).getTime(),
    );
  const next = upcoming[0] ?? null;
  const later = upcoming.slice(1, 1 + MAX_ALSO_SCHEDULED);
  const laterOverflow = upcoming.length - 1 - later.length;
  const customer = profile as Profile;
  const firstName = customer.full_name.trim().split(/\s+/)[0] || "there";
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = upcoming.filter((booking) => booking.scheduled_date === today).length;
  const weekCount = upcoming.filter((booking) => {
    const when = new Date(`${booking.scheduled_date}T12:00:00`).getTime();
    return when >= new Date(`${today}T12:00:00`).getTime() && when < Date.now() + 7 * 864e5;
  }).length;
  const monthSpend = bookings
    .filter(
      (booking) =>
        booking.status === "completed" && booking.scheduled_date.slice(0, 7) === today.slice(0, 7),
    )
    .reduce((sum, booking) => sum + (booking.amount_total ?? 0), 0);
  const nextLabel = next
    ? `${next.scheduled_start_time.slice(0, 5)} · ${next.address?.city ?? "Home"}`
    : "None";

  return (
    <div className="space-y-8 pb-4">
      <DashboardWelcomeBanner
        actions={
          <>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-full bg-[#1c133b] px-3.5 text-xs font-semibold text-white transition hover:bg-[#312c79] sm:h-12 sm:px-6 sm:text-sm"
              href={DASHBOARD_BOOK_HREF}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              Book a session
            </Link>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-full border border-[#d8d4e0] bg-white px-3.5 text-xs font-semibold text-[#1c133b] transition hover:bg-[#f7f2ea] sm:h-12 sm:px-6 sm:text-sm"
              href="/bookings"
            >
              <CalendarCheckLucide className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              View sessions
            </Link>
          </>
        }
        figureSrc={
          todayCount > 0
            ? "/images/avatars/mundoria-woman-walk.png"
            : upcoming.length
              ? FEMALE_AVATAR_SRC
              : "/images/avatars/mundoria-woman-wave.png"
        }
        firstName={firstName}
        stats={[
          { label: "Today", value: String(todayCount) },
          { label: "This week", value: String(weekCount) },
          { label: "This month", value: formatMoney(monthSpend) },
          { label: "Next clean", value: nextLabel },
        ]}
        subtitle="Keep track of your cleaning services, upcoming bookings, and past appointments."
      />

      <DashboardSection
        action={
          upcoming.length > 1 ? (
            <Link
              className="text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/bookings"
            >
              View all
            </Link>
          ) : null
        }
        eyebrow="Coming up"
        title="Next clean"
      >
        {next ? (
          <div className="space-y-6">
            <NextCleanCard booking={next} />

            {later.length ? (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
                    Also scheduled
                  </p>
                  {laterOverflow > 0 ? (
                    <Link
                      className="text-xs font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                      href="/bookings"
                    >
                      +{laterOverflow} more
                    </Link>
                  ) : null}
                </div>
                <ul className="mt-3 grid gap-3">
                  {later.map((booking) => {
                    const when = new Date(`${booking.scheduled_date}T12:00:00`);
                    const day = when.toLocaleDateString("en-GB", {
                      day: "numeric",
                    });
                    const month = when.toLocaleDateString("en-GB", {
                      month: "short",
                    });
                    const weekday = when.toLocaleDateString("en-GB", {
                      weekday: "short",
                    });
                    const time = booking.scheduled_start_time.slice(0, 5);
                    const waiting = isWaitingForCleanerAcceptance(
                      booking.status,
                    );

                    return (
                      <li key={booking.id}>
                        <Link
                          className="group flex items-center gap-3 rounded-[1.35rem] border border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(28,19,59,0.05)] transition hover:bg-[#f3f4f6]"
                          href={`/booking/${booking.id}`}
                        >
                          <div className="flex w-12 shrink-0 flex-col items-center leading-none">
                            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#c79c66]">
                              {month}
                            </span>
                            <span className="mt-0.5 text-lg font-semibold tracking-tight text-[#1c133b]">
                              {day}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#1c133b]">
                              {formatServiceName(booking.service_type)}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[#5c5670]">
                              {weekday} · {time}
                              {waiting ? " · looking for cleaner" : ""}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#c4bfd4] transition group-hover:text-[#6a45b8]" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <DashboardEmptyCard
            action={
              <Button asChild className="rounded-full bg-[#1c133b] hover:bg-[#312c79]">
                <Link href={DASHBOARD_BOOK_HREF}>Start a booking</Link>
              </Button>
            }
            body="Book a session and your next clean will show up here with date, time and status."
            title="Nothing scheduled yet"
          />
        )}
      </DashboardSection>

      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
          For you
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1c133b]">
          Halloween
        </h2>
        <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">
          <Link
            className="group relative isolate flex min-h-[18rem] flex-col overflow-hidden rounded-[1.75rem] shadow-[0_16px_40px_rgba(28,19,59,0.12)]"
            href="/booking/new?fresh=1&service=one_off&returnTo=/dashboard"
          >
            <Image
              alt=""
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              fill
              sizes="(max-width: 1024px) 100vw, 720px"
              src="/images/promos/halloween-after-party.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c133b]/88 via-[#1c133b]/25 to-[#1c133b]/10" />
            <div className="relative mt-auto p-5 sm:p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#ffc79f]">
                Until 1 November
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                After the party
              </h3>
              <p className="mt-2 max-w-sm text-sm font-light leading-6 text-white/85">
                A one-off clean the morning after Halloween, so the house is yours again.
              </p>
              <span className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#1c133b] transition group-hover:bg-[#fff4ee]">
                Book a one-off
              </span>
            </div>
          </Link>

          <Link
            className="group relative isolate flex min-h-[18rem] flex-col overflow-hidden rounded-[1.75rem] shadow-[0_16px_40px_rgba(28,19,59,0.12)]"
            href="/booking/new?fresh=1&service=deep_clean&returnTo=/dashboard"
          >
            <Image
              alt=""
              className="object-cover object-[70%_40%] transition duration-500 group-hover:scale-[1.03]"
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              src="/images/promos/halloween-deep-clean.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c133b]/88 via-[#1c133b]/20 to-transparent" />
            <div className="relative mt-auto p-5 sm:p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#ffc79f]">
                Before the 31st
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                Deep clean
              </h3>
              <p className="mt-2 max-w-sm text-sm font-light leading-6 text-white/85">
                A thorough clean before guests arrive.
              </p>
              <span className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#1c133b] transition group-hover:bg-[#fff4ee]">
                Book a deep clean
              </span>
            </div>
          </Link>
        </div>
      </section>

      {customer.referral_code ? (
        <section className="rounded-[1.75rem] bg-[#f3efe6] p-6 shadow-[0_12px_28px_rgba(28,19,59,0.06)] sm:p-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
            Share Mundoria
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
            Give £10, get £10
          </h2>
          <p className="mt-2 max-w-xl text-sm font-light leading-6 text-[#3d3a48]">
            Share code{" "}
            <span className="font-semibold text-[#312c79]">
              {customer.referral_code}
            </span>
            . Friends get £10 off their first clean; you get £10 after they
            complete it.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function NextCleanCard({ booking }: { booking: Booking }) {
  const waiting = isWaitingForCleanerAcceptance(booking.status);
  const when = new Date(`${booking.scheduled_date}T12:00:00`).toLocaleDateString(
    "en-GB",
    { weekday: "short", day: "numeric", month: "short" },
  );
  const time = booking.scheduled_start_time.slice(0, 5);
  const area = booking.address?.city ?? booking.address?.postcode ?? "Home";
  const facts = [
    { label: "Date", value: when },
    { label: "Time", value: time },
    { label: "Where", value: area },
    {
      label: "Total",
      value: booking.amount_total ? formatMoney(booking.amount_total) : "—",
    },
  ];

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#e6e0f2] bg-white shadow-[0_16px_40px_rgba(28,19,59,0.06)]">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
            {waiting ? "Looking for cleaner" : "Confirmed"}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
            {formatServiceName(booking.service_type)}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#5c5670]">
            {when} at {time}, in {area}. {personLine(booking)}
          </p>
        </div>
        <p className="shrink-0 rounded-full bg-[#fff4ee] px-3 py-1.5 text-sm font-semibold text-[#7a3b28]">
          {time}
        </p>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-px border-y border-[#efe6ff] bg-[#efe6ff] sm:grid-cols-4">
        {facts.map((fact) => (
          <div className="bg-white px-5 py-3.5 sm:px-6" key={fact.label}>
            <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#823fb2]">
              {fact.label}
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold tracking-tight text-[#1c133b]">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#1c133b] px-5 text-sm font-semibold text-white transition hover:bg-[#312c79]"
          href={`/booking/${booking.id}`}
        >
          {waiting ? "View request" : "Manage session"}
        </Link>
        {isCleanerVisibleToCustomer(booking.status) && booking.cleaner_id ? (
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#e6e0f2] bg-white px-5 text-sm font-semibold text-[#1c133b] transition hover:bg-[#f7f2ea]"
            href={`/messages/${booking.id}`}
          >
            Message
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function personLine(booking: Booking) {
  if (isWaitingForCleanerAcceptance(booking.status)) {
    return "We’re looking for your cleaner";
  }
  if (
    isCleanerVisibleToCustomer(booking.status) &&
    booking.cleaner?.full_name
  ) {
    return `With ${booking.cleaner.full_name.split(" ")[0]}`;
  }
  return "Cleaner to be confirmed";
}
