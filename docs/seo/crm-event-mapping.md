# CRM / GTM event mapping

First-party events push to `window.dataLayer` via `trackCrmEvent` in
[`lib/analytics/crm-events.ts`](../../lib/analytics/crm-events.ts). GTM owns
forwarding into the CRM and ads pixels.

## Booking funnel (real routes)

There is **no** `/booking/checkout` or `/booking/confirmation` URL.

| Customer action | Event | Real trigger |
| --- | --- | --- |
| Clicks Book a clean / Book my clean / Book now (marketing) | `booking_cta_click` | CTA click (`CrmLink`) |
| Reaches payment / card-save step | `checkout_view` | Booking wizard `stepId === "checkout"` |
| Booking API returns a booking id | `booking_completed` | After successful `POST /api/bookings` in the wizard |

`booking_completed` must never fire on a URL visit alone. It is deduped by
`booking_id` in `sessionStorage`. Abandoned or failed checkouts do not fire it.

Funnel URLs may include query params (`/booking/new?category=residential`).
That is fine for app state and UTM attribution. Indexable landers stay clean
paths (for example `/book-2-get-1-free`).

## Auth and dashboard

| Customer action | Event |
| --- | --- |
| Successful password sign-in | `login_success` |
| Sign out | `logout` |
| Dashboard loads | `dashboard_view` |
| Book a session CTA | `book_session_click` |
| View sessions / Sessions page | `view_sessions_click` |
| Messages page | `messages_view` |
| Message send succeeds | `message_sent` |
| Account page | `account_view` |
| Profile save succeeds | `account_updated` |
| Opens a booking card / View request | `booking_request_view` |
| Popular Services card | `recommendation_click` |

## Payload fields

Where available: `event` / `event_id` / `timestamp`, `customer_id`,
`session_id`, `page_url`, `action`, `booking_id`, `service`,
`booking_datetime`, `service_location`, `booking_amount`, `booking_currency`,
`utm_source` / `utm_medium` / `utm_campaign`, plus `item` for dashboard cards.

Do not send passwords, auth tokens, or payment instrument details.

## Consent

`dataLayer` pushes always so GTM can gate tags with Consent Mode. Marketing
pixels still wait for marketing consent (existing Meta helpers in
`lib/analytics/gtm.ts`).
