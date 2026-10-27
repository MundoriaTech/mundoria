import type { Booking } from "@/types/customer";

export type CustomerPaymentStatus = Booking["payment_status"];

/** Customer-facing payment progress labels (save → hold → capture). */
export function paymentStatusLabel(
  status: CustomerPaymentStatus,
  options?: { hasPaymentMethod?: boolean },
) {
  switch (status) {
    case "held":
      return "Payment held";
    case "released":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "unpaid":
    default:
      return options?.hasPaymentMethod ? "Card on file" : "Payment due";
  }
}

export function paymentStatusDescription(
  status: CustomerPaymentStatus,
  options?: { hasPaymentMethod?: boolean },
) {
  switch (status) {
    case "held":
      return "Your card is authorised. We’ll capture the charge the next day after the clean.";
    case "released":
      return "Payment has been captured. Your receipt is ready.";
    case "refunded":
      return "This payment was refunded to the original card.";
    case "unpaid":
    default:
      return options?.hasPaymentMethod
        ? "Your card is saved. We’ll place a hold about 24 hours before the clean once a cleaner is confirmed."
        : "Save a card for this visit so we can match a cleaner.";
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
