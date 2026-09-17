import type { Booking } from "@/types/customer";

export type CustomerPaymentStatus = Booking["payment_status"];

/** Customer-facing payment progress labels (hold → capture model). */
export function paymentStatusLabel(status: CustomerPaymentStatus) {
  switch (status) {
    case "held":
      return "Payment held";
    case "released":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "unpaid":
    default:
      return "Payment due";
  }
}

export function paymentStatusDescription(status: CustomerPaymentStatus) {
  switch (status) {
    case "held":
      return "Your card is authorised. We’ll capture the charge after the clean is completed.";
    case "released":
      return "Payment has been captured. Your receipt is ready.";
    case "refunded":
      return "This payment was refunded to the original card.";
    case "unpaid":
    default:
      return "Payment still needs to be completed for this booking.";
  }
}

export function paymentStatusTone(status: CustomerPaymentStatus) {
  switch (status) {
    case "held":
      return "held" as const;
    case "released":
      return "paid" as const;
    case "refunded":
      return "refunded" as const;
    case "unpaid":
    default:
      return "due" as const;
  }
}

export const PAYMENT_HELP_HREF = "/help/article/why-pay-in-advance";
