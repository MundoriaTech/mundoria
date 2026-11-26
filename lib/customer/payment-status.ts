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

/** Default "Auth window opens" hours; the live value is in admin Settings. */
export const DEFAULT_HOLD_OPEN_HOURS = 120;

/** Customer wording for when the card hold is placed, from the live setting. */
/** "5 days" for whole days, otherwise "36 hours". */
export function holdWindowLabel(hours: number = DEFAULT_HOLD_OPEN_HOURS) {
  if (hours >= 24 && hours % 24 === 0) {
    const days = hours / 24;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${hours} hours`;
}

export function holdTimingSentence(
  holdOpenHours: number = DEFAULT_HOLD_OPEN_HOURS,
) {
  return `We’ll place a hold on your card from ${holdWindowLabel(holdOpenHours)} before your clean, once a cleaner is confirmed, and charge it the day after the clean.`;
}

export function paymentStatusDescription(
  status: CustomerPaymentStatus,
  options?: { hasPaymentMethod?: boolean; holdOpenHours?: number },
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
        ? `Your card is saved. ${holdTimingSentence(options?.holdOpenHours)}`
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
