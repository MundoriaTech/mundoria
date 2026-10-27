# Customer payment progress

Mundoria uses Stripe **SetupIntent → delayed manual capture**:

1. **Save card** at booking — `payment_status: unpaid` with `stripe_payment_method_id`
2. **Pre-authorise (hold)** about 24 hours before the visit once a cleaner is confirmed — `payment_status: held`
   - If the visit is already inside that window when the cleaner confirms, hold immediately
3. **Keep the hold** after checkout — do not capture on cleaner check-out
4. **Capture** the next UK calendar day after the clean, at the admin-configured local time — `payment_status: released`
5. **Refund / release** on qualifying cancel — `payment_status: refunded` (or hold released)

Admin timing lives on `platform_settings`:

- `payment_preauth_hours_before` (default 24)
- `payment_capture_hour_uk` / `payment_capture_minute_uk` (default 10:00 Europe/London)

## Where customers see it

| Surface | Behaviour |
|--------|-----------|
| Checkout | Staged progress: saving address → saving card → confirming booking. Copy explains save → hold → next-day capture. |
| Booking detail | Payment status banner + “Booking total” / “Payment status”. Receipt when paid (or completed). |
| Receipt / Payments | Friendly labels (`Paid`, `Payment held`, `Card on file`, …). Payments list is captured receipts. |
| Email / SMS | Confirm = card saved; complete = hold remains until next-day capture. |
| Help | `/help/article/why-pay-in-advance`, payment & cancellation, payment failed. |

## Code

- Labels: `lib/customer/payment-status.ts`
- Lifecycle: `lib/payments/lifecycle.ts`
- Checkout UI: `components/customer/booking-wizard.tsx` (`CheckoutStep`)
- Booking UI: `components/customer/booking-detail.tsx`
- Crons: `/api/cron/preauth-payments`, `/api/cron/capture-payments`
