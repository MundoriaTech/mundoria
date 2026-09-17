/** Mundoria Help Centre collections + articles (WeCasa topic coverage, Mundoria flows). */

export const HELP_COLLECTIONS = [
  {
    audience: "customers",
    description:
      "Booking, payments, cancellations and getting the most from your clean.",
    id: "11111111-1111-4111-8111-111111111101",
    slug: "for-customers",
    sort_order: 10,
    title: "For customers",
  },
  {
    audience: "cleaners",
    description:
      "How to apply, documents we need, and what happens after you sign up.",
    id: "11111111-1111-4111-8111-111111111102",
    slug: "become-a-cleaner",
    sort_order: 20,
    title: "Become a Mundoria cleaner",
  },
  {
    audience: "cleaners",
    description: "Jobs, checklists, messaging and payouts once you are live.",
    id: "11111111-1111-4111-8111-111111111103",
    slug: "cleaner-guide",
    sort_order: 30,
    title: "Cleaner guide",
  },
];

const C = HELP_COLLECTIONS;

export const HELP_ARTICLES = [
  // ── For customers · Book a clean ──────────────────────────────────────────
  {
    body: `## Book in minutes
1. Open Book a clean and enter your postcode.
2. Choose a service and cleaning standard.
3. Add rooms or commercial spaces, duration and add-ons.
4. Pick a date and time, then pay securely.

## After you book
We match a suitable cleaner. You will see live status through arrival, checklist completion and confirmation.

> Tip: for Recovery cleans, use the Preferences step to share fragrance-free and priority-room notes.`,
    collection_id: C[0].id,
    slug: "how-do-i-book",
    sort_order: 10,
    summary: "From postcode to payment in a few guided steps.",
    title: "How do I book a cleaner on Mundoria?",
    topic: "Book a clean",
  },
  {
    body: `## How pricing works
Your estimate is built from service type, property size, duration, add-ons and timing (for example same-day).

## Where to see the total
The booking flow shows a clear estimate before you confirm. You only pay what is shown at checkout, plus any tips you choose to add later.

> Tip: recurring cleans often work out more predictable week to week than one-offs.`,
    collection_id: C[0].id,
    slug: "how-are-prices-set",
    sort_order: 20,
    summary: "Estimates from service, size, duration and add-ons — shown before you pay.",
    title: "How are Mundoria prices set up?",
    topic: "Book a clean",
  },
  {
    body: `## Card payments
Mundoria accepts card payments through our secure checkout. Cash and cheque are not supported for platform bookings.

## Why card only
Card payments protect both of you: the cleaner gets paid after the job, and you keep a clear record with status updates on the booking.`,
    collection_id: C[0].id,
    slug: "payment-methods",
    sort_order: 30,
    summary: "Card only — cash and cheque are not accepted on platform bookings.",
    title: "Can I pay by cash or cheque?",
    topic: "Book a clean",
  },
  {
    body: `## Payment hold
Mundoria authorises (holds) your card when you book. Funds are captured after the job is completed — not days early.

## Payment progress you will see
1. **At checkout** — “Authorising card hold”, then booking confirmed.
2. **On your booking** — status **Payment held** until the clean is done.
3. **After the clean** — status **Paid**, and your receipt / invoice is ready under Payments & receipts.

## If you prefer not to pay in advance
The hold is how we keep the booking secure for you and the cleaner. The actual charge usually lands after checkout and confirmation of the clean.`,
    collection_id: C[0].id,
    slug: "why-pay-in-advance",
    sort_order: 40,
    summary: "We hold your card at booking and capture after the clean is done.",
    title: "I don't want to pay in advance — what should I do?",
    topic: "Book a clean",
  },
  {
    body: `## Cancellation fees
- More than 48 hours before: usually free full release.
- Within 48 hours: a partial fee may apply.
- Within 24 hours: the full amount may be retained.

Exact timing is based on your scheduled start. See Terms for the full policy.

## Reschedule instead
If you can keep the booking with a new time, request a change first — cancelling is a last resort.`,
    collection_id: C[0].id,
    slug: "payment-and-cancellation",
    sort_order: 50,
    summary: "Holds at booking, capture after the clean, and when fees may apply.",
    title: "How does payment and cancellation work?",
    topic: "Book a clean",
  },
  {
    body: `## Payment failed at checkout
1. Check the card details and try again on the booking payment step.
2. Try another card if your bank declined the authorisation.
3. Contact us in chat with the time you tried — include any error message shown.

## After a booking already exists
If a later payment step fails (for example a recurring visit), open the booking in your account and contact support with the booking reference. Do not pay the cleaner off-platform.`,
    collection_id: C[0].id,
    slug: "payment-failed",
    sort_order: 60,
    summary: "Retry the card authorisation, or contact support with your booking reference.",
    title: "My payment didn't go through — what should I do?",
    topic: "Book a clean",
  },
  {
    body: `## Promo codes
Enter your code at checkout before confirming payment. Valid codes apply to the estimate shown.

## Referral vouchers
If you received a Mundoria referral or welcome offer, use the same promo field. Expired or already-used codes will not apply.`,
    collection_id: C[0].id,
    slug: "promo-codes",
    sort_order: 70,
    summary: "Add a promo or referral code at checkout before you confirm.",
    title: "How do I use a promo code or voucher?",
    topic: "Book a clean",
  },
  {
    body: `## After the clean
Open the completed booking and leave a star rating plus a short review. Honest feedback helps other customers and helps great cleaners get more work.

## Editing a review
If you need to update a comment soon after posting, contact support from the booking — we can help where policy allows.`,
    collection_id: C[0].id,
    slug: "rate-and-review",
    sort_order: 80,
    summary: "Rate and review from the completed booking in your account.",
    title: "How do I rate my cleaner and leave a review?",
    topic: "Book a clean",
  },
  {
    body: `## Tipping
You can tip through Mundoria after the clean where tipping is available on the booking. Tips go to the cleaner.

## Cash tips
If you tip in cash, that sits outside the platform record. Prefer in-app tipping when you can so everything stays clear.`,
    collection_id: C[0].id,
    slug: "how-to-tip",
    sort_order: 90,
    summary: "Tip in the app after the clean when the option is available.",
    title: "How do I tip my cleaner?",
    topic: "Book a clean",
  },
  {
    body: `## Invoices and receipts
Download your receipt or invoice from the booking details once payment is captured.

## Business bookings
If you need a company name or VAT-style reference on paperwork, add notes at booking or contact support with your booking reference.`,
    collection_id: C[0].id,
    slug: "get-an-invoice",
    sort_order: 100,
    summary: "Download receipts from the booking after payment is captured.",
    title: "Can I get an invoice for my booking?",
    topic: "Book a clean",
  },
  {
    body: `## Pets
Add pet notes in Preferences when you book — species, how many, and whether they will be home.

## Why it matters
Cleaners can plan for allergies, doors and vacuuming. Surprises on the day are harder for everyone.`,
    collection_id: C[0].id,
    slug: "pets-when-booking",
    sort_order: 110,
    summary: "Tell us about pets in Preferences so your cleaner can plan.",
    title: "I have pets — how do I indicate this when booking?",
    topic: "Book a clean",
  },
  {
    body: `## Postcode not covered
Mundoria is rolling out from Birmingham. If your postcode is not recognised yet, you may be outside our live area.

## What you can do
- Double-check the postcode spelling.
- Try a nearby Birmingham postcode if you are booking for a property we cover.
- Join the waitlist or contact us if your area should be live.

> Tip: neighbourhood pages under Cleaners → Birmingham show where we are active.`,
    collection_id: C[0].id,
    slug: "address-not-recognised",
    sort_order: 120,
    summary: "We start in Birmingham — check coverage or contact us if stuck.",
    title: "My address is not recognised — what can I do?",
    topic: "Book a clean",
  },

  // ── For customers · Manage my account ─────────────────────────────────────
  {
    body: `## Update your details
Open Account settings to change name, phone and notification preferences.

## Address changes
Update the property address on the booking or in saved addresses before the cleaner is en route. Mid-job address changes need support help.`,
    collection_id: C[0].id,
    slug: "modify-profile",
    sort_order: 210,
    summary: "Update contact details and addresses from your account settings.",
    title: "How do I modify my profile information?",
    topic: "Manage my account",
  },
  {
    body: `## Reset password
1. Go to Sign in and choose Forgot password.
2. Enter the email on your Mundoria account.
3. Open the reset link we send (it expires for security).
4. Choose a new password and sign in again.`,
    collection_id: C[0].id,
    slug: "reset-password",
    sort_order: 220,
    summary: "Use Forgot password on the sign-in screen — the link expires.",
    title: "How do I reset my password?",
    topic: "Manage my account",
  },
  {
    body: `## Before you delete
Cancel any upcoming bookings first so you are not charged unexpectedly.

## How to close your account
Contact us in chat and ask to close your account. We will confirm identity, cancel open jobs where needed, and remove payment details from active use.

> Important: deleting your account does not remove legal records we must keep for payments or disputes.`,
    collection_id: C[0].id,
    slug: "delete-account",
    sort_order: 230,
    summary: "Cancel bookings first, then ask support to close your account.",
    title: "How do I delete my Mundoria account?",
    topic: "Manage my account",
  },

  // ── For customers · Booking issues ────────────────────────────────────────
  {
    body: `## Cancel a booking
Open the booking → Cancel. Review any fee shown before you confirm.

## One-off vs recurring
For recurring cleans, you can usually cancel a single visit or pause / end the series — check the options on that booking.

## Prefer to reschedule?
Request a modification first. Cancelling frees the slot completely.`,
    collection_id: C[0].id,
    slug: "how-do-i-cancel",
    sort_order: 310,
    summary: "Cancel from the booking screen — fees depend on how close you are.",
    title: "How do I cancel my booking?",
    topic: "Booking issues",
  },
  {
    body: `## Before confirmation
You can often edit time, notes or add-ons while the booking is still open for matching.

## After a cleaner is assigned
Request a modification from the booking. Your cleaner can accept or decline. If they decline, you may cancel or keep the original plan.`,
    collection_id: C[0].id,
    slug: "modify-booking",
    sort_order: 320,
    summary: "Edit early, or request a change once a cleaner is assigned.",
    title: "How do I modify my booking?",
    topic: "Booking issues",
  },
  {
    body: `## When messaging unlocks
You can message once a cleaner is assigned to your booking.

## Where to find chat
Open the booking in your account and use Messages. Keep all communication on Mundoria — do not share personal phone numbers for off-platform payments.`,
    collection_id: C[0].id,
    slug: "how-do-i-message-my-cleaner",
    sort_order: 330,
    summary: "In-app messaging after a cleaner is matched.",
    title: "How do I message my cleaner?",
    topic: "Booking issues",
  },
  {
    body: `## Running late
Message the cleaner via the booking and check live status. If they are delayed, you will usually see updates in the app.

## No-show
If the start time has passed with no arrival or message:
1. Message the cleaner in-app.
2. Contact Mundoria support with the booking reference.
3. Do not invite someone else off-platform.

We will help rebook or resolve payment according to the situation.`,
    collection_id: C[0].id,
    slug: "cleaner-late-or-no-show",
    sort_order: 340,
    summary: "Message in-app first, then contact support with your booking reference.",
    title: "What if my cleaner is late or hasn't turned up?",
    topic: "Booking issues",
  },
  {
    body: `## Tell us quickly
Leave honest feedback on the booking and message support the same day if something was missed or damaged.

## What happens next
Our team reviews photos, checklist notes and messages. We may offer a partial refund, a re-clean, or another resolution depending on the case.

> Tip: checklist photos from the cleaner help us see what was completed.`,
    collection_id: C[0].id,
    slug: "not-satisfied",
    sort_order: 350,
    summary: "Feedback + support chat — we review and help put it right.",
    title: "What do I do if I'm not satisfied with my clean?",
    topic: "Booking issues",
  },
  {
    body: `## Report damage or loss
1. Message support from the booking as soon as you notice an issue.
2. Share photos, what happened, and when you found it.
3. Keep communication on Mundoria so we have a clear record.

## What we need
Clear photos, a short description, and the booking time. Cover depends on the situation and our Terms — we will explain next steps once we have the details.`,
    collection_id: C[0].id,
    slug: "report-a-claim",
    sort_order: 360,
    summary: "Contact support with photos and booking details as soon as you can.",
    title: "How do I report a claim or breakage?",
    topic: "Booking issues",
  },

  // ── For customers · Services & cleaners ───────────────────────────────────
  {
    body: `## Who cleans with Mundoria
Independent cleaners on Mundoria complete onboarding, identity checks and document review before they can take jobs.

## How we select
Matching looks at service fit, area, availability and reliability — not whoever replies first with no checks.`,
    collection_id: C[0].id,
    slug: "who-are-mundoria-cleaners",
    sort_order: 410,
    summary: "Vetted independent cleaners matched by area, service and availability.",
    title: "Who are Mundoria cleaners and how are they selected?",
    topic: "Services & cleaners",
  },
  {
    body: `## Choosing a cleaner
For most first bookings we match a suitable cleaner for you. After a great visit, you can often rebook the same person when they are available.

## Favourites
Use rebook / request same cleaner from a past booking when the option is shown.`,
    collection_id: C[0].id,
    slug: "can-i-choose-my-cleaner",
    sort_order: 420,
    summary: "We match first bookings; rebook the same cleaner when available.",
    title: "Can I choose my cleaner on Mundoria?",
    topic: "Services & cleaners",
  },
  {
    body: `## Rebook the same cleaner
Open a past booking you were happy with and choose rebook / same cleaner if offered. Availability is not guaranteed — if they are busy, we can match someone else.

## Regular cleans
Recurring schedules make it easier to keep the same cleaner over time.`,
    collection_id: C[0].id,
    slug: "rebook-same-cleaner",
    sort_order: 430,
    summary: "Rebook from a past visit when your cleaner is free.",
    title: "Can I book with the same cleaner as last time?",
    topic: "Services & cleaners",
  },
  {
    body: `## Before the visit
- Clear surfaces you want cleaned thoroughly.
- Secure pets or note them in Preferences.
- Leave access instructions (key safe, entry code, who will be home).
- Flag fragile items or rooms to skip.

## Supplies
Unless your booking says otherwise, cleaners typically bring standard supplies. Specialty products (for example fragrance-free) should be noted in Preferences.`,
    collection_id: C[0].id,
    slug: "prepare-for-a-clean",
    sort_order: 440,
    summary: "Access notes, pets, priorities and surfaces — small prep helps a lot.",
    title: "How should I prepare for a cleaning session?",
    topic: "Services & cleaners",
  },
  {
    body: `## Recurring cleans
Choose a regular rhythm in booking (for example weekly or fortnightly). You get ongoing visits with clearer planning for you and your cleaner.

## Changing the series
Pause, skip or cancel future visits from the recurring booking. Single-visit changes use modify / cancel on that date.`,
    collection_id: C[0].id,
    slug: "recurring-cleans",
    sort_order: 450,
    summary: "Set a regular rhythm and manage skips or pauses from the booking.",
    title: "How do recurring cleans work?",
    topic: "Services & cleaners",
  },
  {
    body: `## Recovery cleans
Recovery is for when life needs gentler support — paced work, clear priorities and optional fragrance-free products.

## How to book
Choose Recovery in services, then use Preferences for pace, scent sensitivity and must-do rooms. Message your cleaner after matching if anything changes.`,
    collection_id: C[0].id,
    slug: "recovery-cleans",
    sort_order: 460,
    summary: "Gentler pacing and preference notes for when you need extra care.",
    title: "What is a Recovery clean?",
    topic: "Services & cleaners",
  },

  // ── Become a cleaner ──────────────────────────────────────────────────────
  {
    body: `## Steps
1. Create a cleaner account.
2. Complete the onboarding wizard (services, areas, availability).
3. Upload identity and DBS documents.
4. Connect Stripe Express for payouts.
5. Wait for admin review before jobs appear.

## What we look for
Reliability, clear communication, and documents that pass review.`,
    collection_id: C[1].id,
    slug: "how-do-i-partner",
    sort_order: 10,
    summary: "Sign up, complete onboarding, upload documents, wait for approval.",
    title: "How do I partner with Mundoria?",
    topic: "Getting started",
  },
  {
    body: `## Required
- Photo ID (passport or driving licence).
- Clear DBS check.
- Headshot for your profile.
- If you are not a British or Irish national: right-to-work evidence.

## Tax status
Independent cleaners should be registered as self-employed with HMRC. Mundoria may ask for your UTR as part of compliance before you accept paid jobs.`,
    collection_id: C[1].id,
    slug: "cleaner-documents",
    sort_order: 20,
    summary: "ID, DBS and right-to-work evidence where applicable.",
    title: "What documents do I need?",
    topic: "Getting started",
  },
  {
    body: `## Services
Pick the services you actually offer (residential, short lets, moving home, Recovery, and so on). Only select what you can deliver well.

## Areas
Add Birmingham neighbourhoods you can reliably cover. Over-stretching areas leads to late arrivals and declined jobs.`,
    collection_id: C[1].id,
    slug: "services-and-areas",
    sort_order: 30,
    summary: "Choose services and neighbourhoods you can cover reliably.",
    title: "How do I set my services and areas?",
    topic: "Getting started",
  },
  {
    body: `## Availability
Keep your calendar honest — blocked days and realistic start windows matter more than looking always free.

## Updates
Change availability in your cleaner dashboard whenever your week shifts. Stale calendars mean missed matches.`,
    collection_id: C[1].id,
    slug: "set-availability",
    sort_order: 40,
    summary: "Keep your calendar accurate so matching stays fair.",
    title: "How do I set my availability?",
    topic: "Getting started",
  },
  {
    body: `## After you submit
Admin review usually follows once documents and Stripe onboarding look complete. Timing varies with volume and document clarity.

## Meanwhile
Finish any incomplete onboarding steps. Clear photos of documents speed things up.`,
    collection_id: C[1].id,
    slug: "how-long-approval",
    sort_order: 50,
    summary: "Review starts when docs and payouts setup are complete.",
    title: "How long does approval take?",
    topic: "Getting started",
  },
  {
    body: `## Earnings
You earn the cleaner share of completed jobs after Mundoria’s platform fee. Exact rates depend on the job and promotions live at the time.

## Payouts
Connect Stripe Express during onboarding. Payouts follow job completion and capture — details live in your payouts dashboard.`,
    collection_id: C[1].id,
    slug: "earnings-overview",
    sort_order: 60,
    summary: "Cleaner share after fees, paid out via Stripe Express.",
    title: "How do earnings and fees work?",
    topic: "Getting started",
  },

  // ── Cleaner guide ─────────────────────────────────────────────────────────
  {
    body: `## Job offers
Eligible jobs appear in your feed. Respond quickly — slow replies mean the customer may be matched elsewhere.

## On the day
1. Travel to the address and check in within the geofence.
2. Complete the service checklist and upload photos if required.
3. Check out when finished so payment can be captured.`,
    collection_id: C[2].id,
    slug: "job-offers-and-checklists",
    sort_order: 10,
    summary: "Respond promptly, follow the checklist, check in and out on site.",
    title: "How do job offers and checklists work?",
    topic: "Jobs & sessions",
  },
  {
    body: `## Accept or decline
Only accept jobs you can reach on time with the right supplies. Declining early is better than a late cancel.

## After accepting
Message the customer in-app if you need access notes. Keep plans on Mundoria.`,
    collection_id: C[2].id,
    slug: "accept-or-decline-jobs",
    sort_order: 20,
    summary: "Accept only what you can deliver; decline early if you cannot.",
    title: "How do I accept or decline a job?",
    topic: "Jobs & sessions",
  },
  {
    body: `## Check-in
Arrive and check in inside the geofence so the customer sees you are on site.

## Check-out
Finish the checklist, add photos if asked, then check out. That unlocks payment capture.

> Tip: if GPS fails, move closer to the property or contact support — do not skip check-in quietly.`,
    collection_id: C[2].id,
    slug: "check-in-check-out",
    sort_order: 30,
    summary: "Geofenced check-in and checklist check-out unlock payment.",
    title: "How do check-in and check-out work?",
    topic: "Jobs & sessions",
  },
  {
    body: `## Cancelling a job
If you must cancel, do it as early as possible from the job screen and message the customer politely in-app.

## Impact
Late cancels hurt customers and your reliability. Repeated late cancels can affect future matching.`,
    collection_id: C[2].id,
    slug: "cancel-a-job",
    sort_order: 40,
    summary: "Cancel early in-app and message the customer — late cancels hurt matching.",
    title: "How do I cancel one or more jobs?",
    topic: "Jobs & sessions",
  },
  {
    body: `## Messaging
Use booking chat for access, running late, or clarifying rooms. Stay professional and on-platform.

## Phone numbers
Do not move the job to private payment or off-app chat for Mundoria bookings.`,
    collection_id: C[2].id,
    slug: "message-customers",
    sort_order: 50,
    summary: "Keep customer chat on Mundoria for access and timing updates.",
    title: "How do I contact my customer?",
    topic: "Jobs & sessions",
  },
  {
    body: `## Payouts
Completed, checked-out jobs pay out through Stripe Express on the schedule shown in your dashboard.

## Missing payout
Confirm check-out finished and the customer payment captured. Then contact support with the job reference.`,
    collection_id: C[2].id,
    slug: "payouts",
    sort_order: 60,
    summary: "Stripe Express payouts after successful check-out and capture.",
    title: "How and when do I get paid?",
    topic: "Revenue & payouts",
  },
  {
    body: `## Tips
Customer tips through Mundoria are paid out with your job earnings where tipping is enabled.

## Tracking
Review payouts and job history in your cleaner dashboard for a clear record.`,
    collection_id: C[2].id,
    slug: "cleaner-tips",
    sort_order: 70,
    summary: "In-app tips are included with your payouts where enabled.",
    title: "How do tips work for cleaners?",
    topic: "Revenue & payouts",
  },
  {
    body: `## Reviews
Great checklist photos, on-time arrivals and clear messages lead to better reviews.

## After the job
You may be able to rate the customer experience too — use that fairly so we can keep Mundoria safe for everyone.`,
    collection_id: C[2].id,
    slug: "reviews-and-ratings",
    sort_order: 80,
    summary: "Reliability and clear communication drive stronger reviews.",
    title: "How do reviews and ratings work?",
    topic: "Reputation & safety",
  },
  {
    body: `## Get more jobs
- Keep availability fresh.
- Cover realistic areas.
- Respond to offers quickly.
- Maintain strong ratings and low late-cancel rates.

## Proposal order
Matching prioritises fit and reliability — not only who taps first.`,
    collection_id: C[2].id,
    slug: "get-more-jobs",
    sort_order: 90,
    summary: "Fresh availability, fast replies and reliability unlock more offers.",
    title: "How do I receive more job offers?",
    topic: "Reputation & safety",
  },
  {
    body: `## Report a problem
If a customer is inappropriate or a site feels unsafe, leave if you need to, then report through the app / support with the job reference.

## What to include
Time, what happened, and any messages. We take safety reports seriously.`,
    collection_id: C[2].id,
    slug: "report-inappropriate-behaviour",
    sort_order: 100,
    summary: "Leave if unsafe, then report in-app with the job reference.",
    title: "How do I report inappropriate behaviour?",
    topic: "Reputation & safety",
  },
  {
    body: `## App issues
Force-quit and reopen the app, check you are on the latest version, and confirm location permission is on for check-in.

## Still broken?
Contact support with your device type, screenshots and the job reference. Describe what you expected vs what happened.`,
    collection_id: C[2].id,
    slug: "app-bugs",
    sort_order: 110,
    summary: "Update the app, check permissions, then send support screenshots.",
    title: "I think there's a bug — what can I do?",
    topic: "App & account",
  },
  {
    body: `## Contact Mundoria
Use in-app chat / Contact us from your account. Include booking or job references so we can help faster.

## Cleaner-specific help
For payouts or onboarding documents, say you are a cleaner partner in the first message.`,
    collection_id: C[2].id,
    slug: "contact-mundoria-cleaner",
    sort_order: 120,
    summary: "In-app chat with your job or booking reference.",
    title: "How can I contact Mundoria?",
    topic: "App & account",
  },
];
