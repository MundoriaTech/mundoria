"use client";

import { Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BookingStatusBadge } from "@/components/shared/booking-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Stagger, StaggerItem } from "@/components/shared/motion-primitives";
import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { PriceDisplay } from "@/components/shared/price-display";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";
import { formatServiceName, SERVICES } from "@/lib/customer/services";
import { PAGE_SIZES } from "@/lib/pagination";
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
  const filterKey = `${search}|${status}|${service}|${from}|${to}|${zone}`;
  const { page, pageItems, setPage, totalItems } = usePagedItems(
    filtered,
    PAGE_SIZES.admin,
    filterKey,
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
        <SimpleSelect
          aria-label="Status"
          emptyLabel="All statuses"
          onChange={setStatus}
          options={[
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
          ].map((value) => ({ label: value.replaceAll("_", " "), value }))}
          size="sm"
          value={status}
        />
        <SimpleSelect
          aria-label="Service"
          emptyLabel="All services"
          onChange={setService}
          options={SERVICES.map((item) => ({ label: item.label, value: item.value }))}
          size="sm"
          value={service}
        />
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

      <Stagger className="mt-5 space-y-3 lg:hidden" gap={0.04}>
        {pageItems.map((booking) => (
          <StaggerItem distance={12} key={booking.id}>
          <Link
            className="block rounded-xl border border-border bg-card p-4 transition active:bg-muted/40"
            href={`/admin/booking/${booking.id}`}
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
          </StaggerItem>
        ))}
        {!filtered.length ? (
          <EmptyState
            compact
            icon={SearchX}
            message="Try a wider date range or clear a filter."
            title="No bookings match these filters"
          />
        ) : null}
      </Stagger>

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
          <Stagger as="tbody" gap={0.03}>
            {pageItems.map((booking) => (
              <StaggerItem
                as="tr"
                className="border-t"
                distance={6}
                key={booking.id}
              >
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
              </StaggerItem>
            ))}
          </Stagger>
        </table>
      </div>

      <ClientPagination
        className="mt-5"
        onPageChange={setPage}
        page={page}
        pageSize={PAGE_SIZES.admin}
        totalItems={totalItems}
      />
    </div>
  );
}
