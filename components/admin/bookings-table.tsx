"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BookingStatusBadge } from "@/components/shared/booking-status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { Input } from "@/components/ui/input";
import { formatServiceName, SERVICES } from "@/lib/customer/services";
import type { AdminBooking } from "@/types/admin";

export function BookingsTable({ bookings }: { bookings: AdminBooking[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [zone, setZone] = useState("");
  const filtered = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          (!search ||
            booking.id.toLowerCase().includes(search.toLowerCase()) ||
            booking.customer?.full_name
              ?.toLowerCase()
              .includes(search.toLowerCase())) &&
          (!status || booking.status === status) &&
          (!service || booking.service_type === service) &&
          (!from || booking.scheduled_date >= from) &&
          (!to || booking.scheduled_date <= to) &&
          (!zone ||
            booking.address?.postcode
              ?.toUpperCase()
              .startsWith(zone.toUpperCase())),
      ),
    [bookings, from, search, service, status, to, zone],
  );

  return (
    <div className="min-w-0">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="relative sm:col-span-2 xl:col-span-2">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Customer or booking ID"
          />
        </label>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="">All statuses</option>
          {[
            "pending_match",
            "matched",
            "confirmed",
            "cleaner_en_route",
            "in_progress",
            "awaiting_customer_confirmation",
            "completed",
            "cancelled",
            "no_show",
            "disputed",
          ].map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          onChange={(event) => setService(event.target.value)}
          value={service}
        >
          <option value="">All services</option>
          {SERVICES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <Input
          onChange={(event) => setFrom(event.target.value)}
          type="date"
          value={from}
        />
        <Input
          onChange={(event) => setTo(event.target.value)}
          type="date"
          value={to}
        />
        <Input
          className="sm:col-span-2 xl:col-span-1"
          onChange={(event) => setZone(event.target.value)}
          placeholder="Zone prefix"
          value={zone}
        />
      </div>

      <div className="mt-5 space-y-3 lg:hidden">
        {filtered.map((booking) => (
          <Link
            className="block rounded-xl border border-border bg-card p-4 transition active:bg-muted/40"
            href={`/admin/booking/${booking.id}`}
            key={booking.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {booking.customer?.full_name ?? "Customer"}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {formatServiceName(booking.service_type)} ·{" "}
                  {booking.scheduled_date}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {booking.id.slice(0, 8)}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {booking.cleaner_profile?.full_name ?? "Unassigned"}
              </span>
              <span className="font-semibold">
                <PriceDisplay amount={booking.amount_total} />
              </span>
            </div>
          </Link>
        ))}
        {!filtered.length ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No bookings match these filters.
          </p>
        ) : null}
      </div>

      <div className="mt-5 hidden overflow-x-auto rounded-xl border bg-card lg:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">ID</th>
              <th>Customer</th>
              <th>Cleaner</th>
              <th>Service</th>
              <th>Date</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((booking) => (
              <tr className="border-t" key={booking.id}>
                <td className="p-3">
                  <Link
                    className="font-mono text-primary"
                    href={`/admin/booking/${booking.id}`}
                  >
                    {booking.id.slice(0, 8)}
                  </Link>
                </td>
                <td>{booking.customer?.full_name ?? "—"}</td>
                <td>{booking.cleaner_profile?.full_name ?? "Unassigned"}</td>
                <td>{formatServiceName(booking.service_type)}</td>
                <td>{booking.scheduled_date}</td>
                <td>
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td>
                  <PriceDisplay amount={booking.amount_total} />
                </td>
                <td className="capitalize">{booking.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
