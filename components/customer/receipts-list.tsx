"use client";

import { FileText } from "lucide-react";
import Link from "next/link";

import {
  PagedList,
  PagedTable,
} from "@/components/shared/paged-list";
import { PriceDisplay } from "@/components/shared/price-display";
import { Button } from "@/components/ui/button";
import { formatServiceName } from "@/lib/customer/services";
import { PAGE_SIZES } from "@/lib/pagination";
import type { Booking } from "@/types/customer";

type ReceiptBooking = Booking & {
  address?: { city: string; postcode: string } | null;
};

export function ReceiptsList({ receipts }: { receipts: ReceiptBooking[] }) {
  if (!receipts.length) {
    return (
      <p className="mt-3 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        Receipts appear here after a cleaning is completed and payment is
        captured.
      </p>
    );
  }

  return (
    <>
      <PagedList
        className="mt-4 md:hidden"
        items={receipts}
        listClassName="space-y-3"
        pageSize={PAGE_SIZES.app}
        renderItem={(booking) => (
          <article
            className="rounded-2xl border border-border bg-card p-4"
            key={booking.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {formatServiceName(booking.service_type)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.scheduled_date}
                  {booking.address
                    ? ` · ${booking.address.city}, ${booking.address.postcode}`
                    : ""}
                </p>
              </div>
              <PriceDisplay amount={booking.amount_total} />
            </div>
            <Button
              asChild
              className="mt-4 min-h-11 w-full"
              size="sm"
              variant="outline"
            >
              <Link href={`/booking/${booking.id}/receipt`}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                View receipt
              </Link>
            </Button>
          </article>
        )}
      />
      <PagedTable
        className="mt-4 hidden md:block"
        headers={["Date", "Service", "Location", "Amount", ""]}
        items={receipts}
        pageSize={PAGE_SIZES.app}
        renderRow={(booking) => (
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
        )}
        tableClassName="overflow-x-auto rounded-2xl border bg-card"
      />
    </>
  );
}
