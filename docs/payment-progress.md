# Customer payment progress

Mundoria uses Stripe **manual capture**:

1. **Authorise (hold)** at booking — `payment_status: held`
2. **Capture** after the clean is completed — `payment_status: released`
3. **Refund / release** on qualifying cancel — `payment_status: refunded` (or hold released)

## Where customers see it

| Surface | Behaviour |
|--------|-----------|
| Checkout | Staged progress: saving → authorising hold → confirming booking. Copy explains hold vs charge. Link to Help. |
| Booking detail | Payment status banner + “Booking total” / “Payment status”. Receipt only when paid (or completed). |
| Receipt / Payments | Friendly labels (`Paid`, `Payment held`, …). Payments list is captured receipts. |
| Email / SMS | Confirm = hold authorised; complete = captured + receipt ready. |
| Help | `/help/article/why-pay-in-advance`, payment & cancellation, payment failed. |

## Code

- Labels: `lib/customer/payment-status.ts`
- Checkout UI: `components/customer/booking-wizard.tsx` (`CheckoutStep`)
- Booking UI: `components/customer/booking-detail.tsx`
- Capture: `lib/payments/service.ts`, geofence/completion paths
