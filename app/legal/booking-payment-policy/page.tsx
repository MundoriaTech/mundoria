import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { RESCHEDULE_CUTOFF_HOURS } from "@/lib/bookings/lead-time";
import { CLEANER_HOURLY_RATE_PENCE } from "@/lib/payments/cleaner-pay";
import { holdWindowLabel } from "@/lib/customer/payment-status";
import { getPaymentTimingSettings } from "@/lib/payments/lifecycle";
import { MUNDORIA_IDENTITY } from "@/lib/seo/identity";
import { buildPageMetadata } from "@/lib/seo/site";

// Hold timing comes from admin Settings; refresh within 5 minutes of a change.
export const revalidate = 300;

const HOLD_HOURS_TOKEN = "{holdOpenHours}";
const FREE_CANCEL_HOURS_TOKEN = "{freeCancelHours}";
const HOURLY_RATE = `£${(CLEANER_HOURLY_RATE_PENCE / 100).toFixed(2)}`;

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria Booking & Payment Policy for cleaners: how offers work, how earnings are calculated, Stripe Connect payouts, cancellations and no-shows.",
  path: "/legal/booking-payment-policy",
  title: "Booking & Payment Policy",
});

const sections: LegalSection[] = [
  {
    body:
      "This policy explains how bookings and payments work for cleaners on Mundoria. It forms part of the Self-Employed Cleaner Agreement. If the two conflict, the agreement prevails.",
    title: "1. Overview",
  },
  {
    bullets: [
      "Offers are sent in the app based on service type, area, availability and performance.",
      "Each offer shows the date, time, area and your earnings before you decide. Offers expire, so respond promptly.",
      "Accepting an offer is a commitment. Declining is always allowed and does not penalise you beyond how acceptance rate is shown on your profile.",
      "Exact address and access details are shared once you have accepted.",
    ],
    title: "2. Offers and acceptance",
  },
  {
    bullets: [
      `You are paid ${HOURLY_RATE} for every hour you are booked to work on a job. Your earnings for each job are shown on the offer and in your Earnings page.`,
      `Your hourly rate does not depend on what the customer pays. Discounts, offers and free first-visit hours do not reduce it. Mundoria keeps the rest of the booking price as its service fee.`,
      `On team jobs, each cleaner is paid ${HOURLY_RATE} an hour for their own hours.`,
      `If the customer approves extra time on the day, you are paid for it at the same ${HOURLY_RATE} an hour.`,
      `Customer cards are saved at booking. Payment is pre-authorised from ${HOLD_HOURS_TOKEN} before the visit once a cleaner has confirmed, and captured the next calendar day after checkout.`,
      "Earnings may change if the agreed scope is changed by the customer before or during the visit. Any change will be shown in the app.",
      "Tips, where offered, are passed on to you in full, subject to payment provider fees.",
    ],
    title: "3. Earnings",
  },
  {
    bullets: [
      "Payouts are made to your bank account through Stripe Connect. You must complete Stripe onboarding before you can be paid.",
      "You can choose a weekly or monthly payout preference in your profile. Changes apply from the next payout window.",
      "Completed jobs enter the next payout window after any hold period, which allows time for disputes and refunds.",
      "Stripe may need further verification from you. Payouts may be paused until that is complete.",
      "You are responsible for the accuracy of your bank details and for declaring your income to HMRC.",
    ],
    title: "4. Stripe Connect payouts",
  },
  {
    bullets: [
      "Mundoria may hold or adjust earnings where there is an open dispute, refund request, chargeback or suspected fraud.",
      "If a customer is refunded because of a service failure, your earnings for that job may be reduced or reversed in whole or part.",
      "We will tell you in the app what was adjusted and why, and you can ask support to review it.",
    ],
    title: "5. Disputes, refunds and adjustments",
  },
  {
    bullets: [
      "If you need to cancel an accepted job, do so in the app as early as possible so we can find a replacement.",
      "Late cancellations and repeated cancellations affect your performance score, tier and access to offers, and may result in a fee being withheld.",
      `Customers can cancel free of charge up to ${FREE_CANCEL_HOURS_TOKEN} hours before the start time. If a customer cancels a job, you are not paid for it, including when they cancel late.`,
      `Customers can change the date and time of a visit up to ${RESCHEDULE_CUTOFF_HOURS} hours before it starts. A rescheduled visit is offered again and may go to a different cleaner, so it leaves your diary until you accept it again.`,
      "Genuine emergencies are considered where you tell us promptly.",
    ],
    title: "6. Cancellations",
  },
  {
    bullets: [
      "A cleaner no-show is where you do not attend or check in without telling us. It can lead to loss of earnings for that job, a lower score and suspension if repeated.",
      "A customer no-show is where you arrive on time and cannot gain access after reasonable attempts to contact them. Contact support from the job screen and wait for the time we advise before leaving.",
      "Once you have checked in, the customer has 5 minutes to let you in. After that they are charged a waiting fee of 50p a minute, for up to 30 minutes, and you receive part of it in your payout.",
      "If you still cannot get in, contact support from the job screen before you leave. Mundoria reviews each case and tells you in the app whether the visit is charged and what you are paid.",
    ],
    title: "7. No-shows",
  },
  {
    bullets: [
      "Do not accept payment, tips or bookings outside the platform for work introduced through Mundoria.",
      "Do not ask customers to cancel and rebook off-platform.",
      "Breaches may lead to suspension and removal.",
    ],
    title: "8. Keeping payments on the platform",
  },
  {
    body:
      `We may update this policy and will tell you in the app or by email before material changes take effect. For payment questions, contact ${MUNDORIA_IDENTITY.supportEmail} or use the in-app help.`,
    title: "9. Changes and support",
  },
];

export default async function BookingPaymentPolicyPage() {
  const {
    payment_auth_open_hours_before: holdOpenHours,
    payment_preauth_hours_before: freeCancelHours,
  } = await getPaymentTimingSettings();
  const liveSections = sections.map((section) => ({
    ...section,
    bullets: section.bullets?.map((bullet) =>
      bullet
        .replace(HOLD_HOURS_TOKEN, holdWindowLabel(holdOpenHours))
        .replace(FREE_CANCEL_HOURS_TOKEN, String(freeCancelHours)),
    ),
  }));
  return (
    <LegalPage
      intro="How offers, earnings, payouts, cancellations and no-shows work for cleaners on Mundoria."
      lastUpdated="26 November 2026"
      sections={liveSections}
      title="Booking & Payment Policy"
    />
  );
}
