# Consistent support widget across Mundoria pages

## Change and scope

The live site lost its SalesIQ launcher after client-side navigation from the
homepage to a service page and then to Help. A full reload of the service page
restored the widget. Booking used a separate Mundoria messenger. This was
reproduced on 23 November 2026 without sending customer messages or submitting
a booking.

The shared support host now sits outside the pathname-keyed `PageTransition`.
The existing marketing, FAQ, Mag, Help and booking surfaces register with that
host, so navigation between them does not tear down the messenger. Booking
uses the same configured SalesIQ brand, bot and Help content. Pages without an
existing support marker, such as admin and authentication screens, do not gain
a launcher. No customer or booking fields are automatically passed to SalesIQ.

The loader waits for SalesIQ readiness, keeps one script during slow loads,
allows retry after a script error, and respects consent withdrawal even when
the SDK finishes late. The existing statistics-consent gate and tracking-off
call remain. Before consent, the support button opens cookie preferences; it
does not grant consent. If SalesIQ fails, the button offers a retry and a Help
Centre link rather than silently starting a conversation in a different inbox.
Deployments with no valid SalesIQ URL retain the original Mundoria messenger.

SalesIQ's mobile launcher and chat window are lifted above the booking Next /
Book bar. Calls remain disabled in the SalesIQ account. This change does not
add calling, generate credentials or alter bookings, payments or mail delivery.

## Manual Vercel release

The branch is `codex/persistent-support-widget`. Automatic Vercel deployment of
this branch is disabled in `vercel.json`, matching the existing manual rollout
arrangement. The branch and pull request alone do not fix production.

1. In the existing Mundoria Vercel project, create a Preview deployment of this
   branch. Use isolated test services for any forms you intend to submit; the
   navigation checks below do not require submitting forms.
2. Keep `NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_SRC` set to the existing public SalesIQ
   widget URL for the Preview environment. No new environment variable or
   secret is required. Add the exact Preview hostname to the brand's allowed
   website URLs if it is not already permitted.
3. Perform the checks below on desktop and a mobile viewport. Share the Preview
   URL if assistance verifying the deployed integration is needed.
4. After the Preview passes, merge the pull request and deploy the resulting
   `master` commit through your normal Vercel process. A connected production
   branch may deploy automatically on merge; perform the merge only when ready
   to release. Repeat the navigation checks on `www.mundoria.co.uk`.

## Acceptance checks

- Start at `/`, open chat, then use site links to visit a service page, `/help`,
  `/blog`, `/faq` and `/booking/new`. The same SalesIQ widget should remain
  available without a reload or duplicate launcher, and an open conversation
  should not be closed by a page change. Check browser Back and Forward too.
- Load a service page, Help page and booking page directly in a fresh tab.
  Confirm the same native Home / Conversation / Help interface appears, with
  Quick answers and the three Help collections. Confirm no Call option.
- On mobile booking pages, confirm both the launcher and open chat clear the
  sticky Next / Book bar. Check narrow and short viewports with the keyboard.
- Decline optional cookies: SalesIQ must not load. The support button should
  open preferences. Enable statistics cookies: one SalesIQ launcher should
  appear. Withdraw consent: it should close and the local button should return.
- Simulate slow/blocked SalesIQ loading in browser developer tools: retry and
  Help Centre remain reachable; a late successful load must not add a second
  script or show chat after consent has been withdrawn.
- Visit an existing non-support page: the shared widget should hide. Return to
  a supported page: it should reappear. Do not send customer messages or enter
  production payment details during these checks.

## Automated validation

Run `npm run test:support` and `npm run typecheck`.

The regression suite exercises consent, simultaneous opens, failed/slow loads,
late readiness after leaving, keyed React page transitions, footer open events,
non-support pages and the original fallback when SalesIQ is not configured.
The SDK calls are mocked; these checks do not replace testing Zoho's actual
hosted SDK and mobile layout after Preview deployment.
