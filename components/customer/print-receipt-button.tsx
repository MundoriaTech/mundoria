"use client";

import { Button } from "@/components/ui/button";

/** Download the numbered PDF invoice, or print this receipt page. */
export function PrintReceiptButton({ bookingId }: { bookingId: string }) {
  return (
    <>
      <Button onClick={() => window.print()} type="button" variant="outline">
        Print
      </Button>
      <Button asChild>
        <a download href={`/api/bookings/${bookingId}/invoice`}>
          Download PDF invoice
        </a>
      </Button>
    </>
  );
}
