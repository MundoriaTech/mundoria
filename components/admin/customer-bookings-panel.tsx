"use client";

import Link from "next/link";

import {
  PagedList,
  PagedTable,
} from "@/components/shared/paged-list";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { PAGE_SIZES } from "@/lib/pagination";
import type { ServiceType } from "@/types/customer";

export type AdminCustomerBookingRow = {
  amount_total: number | null;
  cleaner_profile: { full_name: string | null } | null;
  id: string;
  payment_status: string;
  scheduled_date: string;
  scheduled_start_time: string | null;
  service_type: ServiceType;
  status: string;
};

export function CustomerBookingsPanel({
  bookings,
}: {
  bookings: AdminCustomerBookingRow[];
}) {
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">Bookings</h2>
      <PagedList
        className="mt-4 md:hidden"
        empty={
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        }
        items={bookings}
        listClassName="space-y-3"
        pageSize={PAGE_SIZES.admin}
        renderItem={(booking) => (
          <Link
            className="block rounded-lg border p-3 transition active:bg-muted/40"
            href={`/admin/booking/${booking.id}`}
            key={booking.id}
          >
            <p className="font-medium">
              {formatServiceName(booking.service_type)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {booking.scheduled_date} · {booking.status.replaceAll("_", " ")}
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatMoney(booking.amount_total)}
            </p>
          </Link>
        )}
      />
      <PagedTable
        className="mt-4 hidden md:block"
        empty="No bookings yet."
        headers={[
          "Service",
          "Date",
          "Status",
          "Payment",
          "Cleaner",
          "Amount",
          "",
        ]}
        items={bookings}
        pageSize={PAGE_SIZES.admin}
        renderRow={(booking) => (
          <tr className="border-t" key={booking.id}>
            <td className="p-3">{formatServiceName(booking.service_type)}</td>
            <td>
              {booking.scheduled_date}{" "}
              {booking.scheduled_start_time?.slice(0, 5)}
            </td>
            <td className="capitalize">
              {booking.status.replaceAll("_", " ")}
            </td>
            <td className="capitalize">{booking.payment_status}</td>
            <td>{booking.cleaner_profile?.full_name ?? "—"}</td>
            <td>{formatMoney(booking.amount_total)}</td>
            <td>
              <Link
                className="text-primary hover:underline"
                href={`/admin/booking/${booking.id}`}
              >
                Open
              </Link>
            </td>
          </tr>
        )}
      />
    </section>
  );
}
