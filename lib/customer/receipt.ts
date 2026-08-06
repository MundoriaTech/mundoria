import {
  formatMoney,
  formatServiceName,
  standardLabel,
} from "@/lib/customer/services";
import type { Address, Booking, BookingAddOn } from "@/types/customer";

export interface ReceiptBooking extends Booking {
  add_ons?: BookingAddOn[] | null;
  address?: Address | null;
  customer?: {
    email: string;
    full_name: string;
  } | null;
}

export function buildReceiptLines(booking: ReceiptBooking) {
  const addOns = booking.add_ons ?? [];
  const addOnTotal = addOns.reduce((sum, item) => sum + Number(item.amount), 0);
  const total = Number(booking.amount_total ?? 0);
  const serviceAmount = Math.max(0, total - addOnTotal);

  return {
    addOnTotal,
    addOns,
    platformAmount: Number(booking.amount_platform ?? 0),
    serviceAmount,
    total,
  };
}

export function receiptTitle(booking: ReceiptBooking) {
  return `CleanScape receipt · ${formatServiceName(booking.service_type)}`;
}

export function receiptSummary(booking: ReceiptBooking) {
  const lines = buildReceiptLines(booking);
  return {
    address: booking.address
      ? `${booking.address.address_line_1}, ${booking.address.city}, ${booking.address.postcode}`
      : "Address unavailable",
    cleaningStandard: standardLabel(booking.cleaning_standard ?? "enhanced"),
    customerName: booking.customer?.full_name ?? "Customer",
    date: booking.scheduled_date,
    paymentStatus: booking.payment_status,
    serviceName: formatServiceName(booking.service_type),
    time: booking.scheduled_start_time.slice(0, 5),
    totals: {
      addOns: formatMoney(lines.addOnTotal),
      platform: formatMoney(lines.platformAmount),
      service: formatMoney(lines.serviceAmount),
      total: formatMoney(lines.total),
    },
  };
}
